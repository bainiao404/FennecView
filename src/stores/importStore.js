import { ref } from 'vue'
import { defineStore } from 'pinia'
import { SpineProcessor } from '@/services/import/processors/SpineProcessor'
import { Live2dProcessor } from '@/services/import/processors/Live2dProcessor'
import { SpritesheetProcessor } from '@/services/import/processors/SpritesheetProcessor'
import { MediaProcessor } from '@/services/import/processors/MediaProcessor'
import { useLayerStore } from './layerStore'
import { MessagePlugin } from 'tdesign-vue-next'

const spineProcessor = new SpineProcessor()
const live2dProcessor = new Live2dProcessor()
const spritesheetProcessor = new SpritesheetProcessor()
const mediaProcessor = new MediaProcessor()

export const useImportStore = defineStore('import', () => {
    const filesPool = ref([])
    const importItems = ref([])
    const orphanedFiles = ref([])
    const isProcessing = ref(false)
    const layerStore = useLayerStore()

    /**
     * Clear all files and reset state.
     */
    function clear() {
        filesPool.value = []
        importItems.value = []
        orphanedFiles.value = []
    }

    /**
     * Remove a file by its relative path from the pool.
     */
    function removeFile(relativePath) {
        filesPool.value = filesPool.value.filter(f => f.relativePath !== relativePath)
        evaluate()
    }

    /**
     * Remove an import item. This deletes all of its associated files from the pool.
     */
    function removeItem(itemId) {
        const item = importItems.value.find(i => i.id === itemId)
        if (!item) return

        // Gather all files associated with this item
        const filesToRemove = new Set()
        if (item.entryFile) {
            filesToRemove.add(item.entryFile.relativePath)
        }
        if (item.associatedFiles) {
            Object.values(item.associatedFiles).forEach(val => {
                if (!val) return
                if (Array.isArray(val)) {
                    val.forEach(f => {
                        if (f && f.relativePath) filesToRemove.add(f.relativePath)
                    })
                } else if (val.relativePath) {
                    filesToRemove.add(val.relativePath)
                }
            })
        }

        // Filter filesPool
        filesPool.value = filesPool.value.filter(f => !filesToRemove.has(f.relativePath))
        evaluate()
    }

    /**
     * Add new scanned files to the pool.
     * Overwrites files with the same relativePath.
     */
    async function addFiles(newFiles) {
        if (!newFiles || newFiles.length === 0) return

        isProcessing.value = true
        try {
            const poolMap = new Map(filesPool.value.map(f => [f.relativePath, f]))
            for (const file of newFiles) {
                // If it is a project file (.fv), load it directly and bypass import preprocess
                if (file.name.toLowerCase().endsWith('.fv')) {
                    await handleFvProjectFile(file)
                    isProcessing.value = false
                    return
                }
                poolMap.set(file.relativePath, file)
            }
            filesPool.value = Array.from(poolMap.values())
            
            // Recalculate import groups
            await evaluate()

            // Open the ImportPrepareView layer if not already open
            const isAlreadyOpen = layerStore.layers.some(l => l.name === 'ImportPrepareView' && l.visible)
            if (!isAlreadyOpen) {
                layerStore.add({
                    name: 'ImportPrepareView',
                    z: 50,
                    direction: 'slide-bottom',
                    singleton: true
                })
            }
        } catch (e) {
            console.error('Error adding files to preprocessor pool:', e)
            MessagePlugin.error('文件预处理失败: ' + e.message)
        } finally {
            isProcessing.value = false
        }
    }

    /**
     * Handle project file (.fv) directly by loading it into scene.
     */
    async function handleFvProjectFile(fileItem) {
        const FennecView = (await import('@/fennec-view/FennecView')).default
        try {
            MessagePlugin.loading('正在加载项目文件...')
            let buffer
            if (fileItem.isNative) {
                const { ioManager } = await import('@/services/io/IOManager')
                buffer = await ioManager.getDriver().read(fileItem.path)
            } else {
                const { readBlobAsArrayBuffer } = await import('@/fennec-view/helpers')
                buffer = await readBlobAsArrayBuffer(fileItem.file)
            }
            await FennecView.loadProjectFromBuffer(buffer)
            MessagePlugin.closeAll()
            MessagePlugin.success('项目文件加载成功')
        } catch (err) {
            MessagePlugin.closeAll()
            console.error('加载拖入的项目文件失败:', err)
            MessagePlugin.error('加载项目文件失败: ' + err.message)
        }
    }

    /**
     * Core grouping algorithm. Analyzes filesPool and rebuilds importItems.
     */
    async function evaluate() {
        const pool = [...filesPool.value]
        const items = []
        const associatedPaths = new Set()

        // 1. Detect complex structures (Live2D -> Spine -> Spritesheet)
        // We look for entry files first.
        const entryCandidates = pool.filter(f => {
            const name = f.name.toLowerCase()
            return name.endsWith('.json') || name.endsWith('.skel') || name.endsWith('.spine-json')
        })

        // Check Live2D entries
        const live2dEntries = []
        for (const f of entryCandidates) {
            if (await live2dProcessor.detect(f)) {
                live2dEntries.push(f)
            }
        }

        // Group Live2D
        for (const entry of live2dEntries) {
            const groupItem = await live2dProcessor.group(entry, pool)
            groupItem.processor = live2dProcessor
            // Cache reference
            entry.importItemId = groupItem.id
            items.push(groupItem)

            // Mark associated
            associatedPaths.add(entry.relativePath)
            if (groupItem.associatedFiles.crucial) {
                groupItem.associatedFiles.crucial.forEach(f => associatedPaths.add(f.relativePath))
            }
            if (groupItem.associatedFiles.optional) {
                groupItem.associatedFiles.optional.forEach(f => associatedPaths.add(f.relativePath))
            }
        }

        // Check Spine entries (exclude files already associated)
        const spineEntries = []
        for (const f of entryCandidates) {
            if (associatedPaths.has(f.relativePath)) continue
            if (await spineProcessor.detect(f)) {
                spineEntries.push(f)
            }
        }

        // Group Spine
        for (const entry of spineEntries) {
            const groupItem = await spineProcessor.group(entry, pool)
            groupItem.processor = spineProcessor
            entry.importItemId = groupItem.id
            items.push(groupItem)

            // Mark associated
            associatedPaths.add(entry.relativePath)
            if (groupItem.associatedFiles.atlas) {
                associatedPaths.add(groupItem.associatedFiles.atlas.relativePath)
            }
            if (groupItem.associatedFiles.textures) {
                groupItem.associatedFiles.textures.forEach(f => associatedPaths.add(f.relativePath))
            }
        }

        // Check Spritesheet entries (exclude files already associated)
        const spritesheetEntries = []
        for (const f of entryCandidates) {
            if (associatedPaths.has(f.relativePath)) continue
            if (await spritesheetProcessor.detect(f)) {
                spritesheetEntries.push(f)
            }
        }

        // Group Spritesheets
        for (const entry of spritesheetEntries) {
            const groupItem = await spritesheetProcessor.group(entry, pool)
            groupItem.processor = spritesheetProcessor
            entry.importItemId = groupItem.id
            items.push(groupItem)

            // Mark associated
            associatedPaths.add(entry.relativePath)
            if (groupItem.associatedFiles.image) {
                associatedPaths.add(groupItem.associatedFiles.image.relativePath)
            }
        }

        // 2. Process remaining unassociated files as Media or Orphans
        const unassociated = pool.filter(f => !associatedPaths.has(f.relativePath))
        const orphans = []

        for (const f of unassociated) {
            if (await mediaProcessor.detect(f)) {
                const groupItem = await mediaProcessor.group(f, pool)
                groupItem.processor = mediaProcessor
                items.push(groupItem)
            } else {
                orphans.push(f)
            }
        }

        importItems.value = items
        orphanedFiles.value = orphans
    }

    /**
     * Import all completed items to the scene.
     */
    async function importAllComplete() {
        const completeItems = importItems.value.filter(item => item.status === 'complete')
        if (completeItems.length === 0) {
            MessagePlugin.warning('没有可导入的完整资源')
            return
        }

        isProcessing.value = true
        MessagePlugin.loading('正在导入资源至场景...')
        let successCount = 0
        let errorCount = 0

        for (const item of completeItems) {
            try {
                await item.processor.import(item)
                successCount++
            } catch (e) {
                console.error(`Failed to import item ${item.name}:`, e)
                errorCount++
            }
        }

        MessagePlugin.closeAll()
        if (errorCount > 0) {
            MessagePlugin.warning(`导入完成：成功 ${successCount} 个，失败 ${errorCount} 个`)
        } else {
            MessagePlugin.success(`成功导入 ${successCount} 个资源到场景`)
        }

        // Close the prep view
        layerStore.back()
        clear()
        isProcessing.value = false
    }

    return {
        filesPool,
        importItems,
        orphanedFiles,
        isProcessing,
        clear,
        removeFile,
        removeItem,
        addFiles,
        importAllComplete,
        evaluate
    }
})
