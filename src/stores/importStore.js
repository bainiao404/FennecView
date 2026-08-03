import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useLayerStore } from './layerStore'
import { MessagePlugin } from 'tdesign-vue-next'
import { createFileItem } from '@/services/import/models/FileItem.js'
import { platformService } from '@/services/platform/PlatformService'
import { processorRegistry } from '@/services/import/processors/ProcessorRegistry'
import { MimeUtil } from '@/utils/MimeUtil'

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
            const expandedFiles = []
            const scannedDirs = new Set()
            const isNativePlatform = platformService.isNative()

            for (const file of newFiles) {
                // If it is a project file (.fv), load it directly and bypass import preprocess
                if (file.name.toLowerCase().endsWith('.fv')) {
                    await handleFvProjectFile(file)
                    isProcessing.value = false
                    return
                }

                const name = file.name.toLowerCase()
                const isSpineOrLive2D = MimeUtil.isSpineOrLive2dCore(name)
                const fileItemPath = file.path

                if (isNativePlatform && isSpineOrLive2D && fileItemPath) {
                    const normPath = fileItemPath.replace(/\\/g, '/')
                    const lastSlash = normPath.lastIndexOf('/')
                    if (lastSlash !== -1) {
                        const parentDir = normPath.substring(0, lastSlash)
                        if (!scannedDirs.has(parentDir)) {
                            scannedDirs.add(parentDir)
                            try {
                                const { FileScanner } = await import('@/services/import/utils/fileScanner.js')
                                const localFiles = await FileScanner.scanLocalDirectory(parentDir)
                                if (localFiles && localFiles.length > 0) {
                                    expandedFiles.push(...localFiles)
                                    continue
                                }
                            } catch (e) {
                                console.error('Failed to auto-scan associated files from directory:', parentDir, e)
                            }
                        } else {
                            continue
                        }
                    }
                }
                expandedFiles.push(file)
            }

            const poolMap = new Map(filesPool.value.map(f => [f.relativePath, createFileItem(f)]))
            for (const file of expandedFiles) {
                poolMap.set(file.relativePath, createFileItem(file))
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
                const { readBlobAsArrayBuffer } = await import('@/utils/helpers')
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

    async function evaluate() {
        const manualItems = importItems.value.filter(item => ['animated_sprite', 'spritesheet_grid', 'stand_diff'].includes(item.type))

        const pool = [...filesPool.value]
        const items = [...manualItems]
        const associatedPaths = new Set()

        // Mark files from manual items as associated
        for (const item of manualItems) {
            if (item.associatedFiles) {
                Object.values(item.associatedFiles).forEach(val => {
                    if (!val) return
                    if (Array.isArray(val)) {
                        val.forEach(f => {
                            if (f && f.relativePath) associatedPaths.add(f.relativePath)
                        })
                    } else if (val.relativePath) {
                        associatedPaths.add(val.relativePath)
                    }
                })
            }
        }

        // 1. Detect complex structures (Live2D, Spine, Spritesheets) using entry candidates
        const entryCandidates = pool.filter(f => MimeUtil.isEntryCandidate(f.name))

        const processors = processorRegistry.getProcessors()

        for (const processor of processors) {
            if (!processor.isEntryBased) continue

            // Find entries that are not yet associated
            const entries = []
            for (const f of entryCandidates) {
                if (associatedPaths.has(f.relativePath)) continue
                if (await processor.detect(f)) {
                    entries.push(f)
                }
            }

            // Group and map them
            for (const entry of entries) {
                const groupItem = await processor.group(entry, pool)
                groupItem.processor = processor
                entry.importItemId = groupItem.id
                items.push(groupItem)

                // Mark all associated files
                associatedPaths.add(entry.relativePath)
                if (groupItem.associatedFiles) {
                    Object.values(groupItem.associatedFiles).forEach(val => {
                        if (!val) return
                        if (Array.isArray(val)) {
                            val.forEach(f => {
                                if (f && f.relativePath) associatedPaths.add(f.relativePath)
                            })
                        } else if (val.relativePath) {
                            associatedPaths.add(val.relativePath)
                        }
                    })
                }
            }
        }

        // 2. Process remaining unassociated files (Media, etc.) or treat as Orphans
        const unassociated = pool.filter(f => !associatedPaths.has(f.relativePath))
        const orphans = []

        for (const f of unassociated) {
            let matched = false
            for (const processor of processors) {
                if (processor.isEntryBased) continue

                if (await processor.detect(f)) {
                    const groupItem = await processor.group(f, pool)
                    groupItem.processor = processor
                    items.push(groupItem)
                    matched = true
                    break
                }
            }
            if (!matched) {
                orphans.push(f)
            }
        }

        importItems.value = items
        orphanedFiles.value = orphans
    }

    /**
     * Change the type of an import item dynamically.
     */
    function changeItemType(itemId, newType) {
        const item = importItems.value.find(i => i.id === itemId)
        if (!item) return

        if (newType === 'spritesheet_grid' && item.type === 'image') {
            item.type = 'spritesheet_grid'
            item.associatedFiles = {
                image: item.associatedFiles.media
            }
            item.config = {
                name: item.name.replace(/\.[^/.]+$/, "") + '_grid',
                rows: 1,
                cols: 1,
                animationSpeed: 100,
                loop: true,
                autoPlay: true
            }
        } else if (newType === 'image' && item.type === 'spritesheet_grid') {
            item.type = 'image'
            item.associatedFiles = {
                media: item.associatedFiles.image
            }
            item.config = {
                name: item.name
            }
        }
        evaluate()
    }

    /**
     * Combine all images in the import list into a single animated_sprite item.
     */
    function combineImagesToAnimatedSprite() {
        const imageItems = importItems.value.filter(item => item.type === 'image')
        if (imageItems.length === 0) return

        const files = imageItems.map(item => item.associatedFiles.media)
        // Natural alphanumeric sort
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
        
        const resourceId = `animatedSprite_${Math.random().toString(36).substring(2, 9)}`
        const baseName = files[0].name.replace(/\.[^/.]+$/, "")

        const animatedSpriteItem = {
            id: resourceId,
            type: 'animated_sprite',
            name: baseName + '_anim',
            status: 'complete',
            associatedFiles: {
                frames: files
            },
            missingFiles: [],
            config: {
                name: baseName + '_anim',
                animationSpeed: 100,
                loop: true,
                autoPlay: true
            }
        }

        // Remove the individual image items from our active collection
        const imageIds = new Set(imageItems.map(i => i.id))
        importItems.value = importItems.value.filter(i => !imageIds.has(i.id))
        importItems.value.push(animatedSpriteItem)

        evaluate()
    }

    /**
     * Combine all images in the import list into a single stand_diff item.
     */
    function combineImagesToStandDiff() {
        const imageItems = importItems.value.filter(item => item.type === 'image')
        if (imageItems.length < 2) return

        const files = imageItems.map(item => item.associatedFiles.media)
        // Natural alphanumeric sort
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
        
        const resourceId = `standDiff_${Math.random().toString(36).substring(2, 9)}`
        const baseName = files[0].name.replace(/\.[^/.]+$/, "")

        const standDiffItem = {
            id: resourceId,
            type: 'stand_diff',
            name: baseName + '_stand',
            status: 'complete',
            associatedFiles: {
                files: files
            },
            missingFiles: [],
            config: {
                name: baseName + '_stand',
                backgroundName: files[0].name,
                bgAnchorPreset: 'both',
                bgAnchorX: 0.5,
                bgAnchorY: 0.5,
                fgAnchorPreset: 'both',
                fgAnchorX: 0.5,
                fgAnchorY: 0.5,
                defaultFgX: 0,
                defaultFgY: 0,
                foregroundConfigs: files.map(f => ({
                    name: f.name,
                    x: '',
                    y: ''
                }))
            }
        }

        const imageIds = new Set(imageItems.map(i => i.id))
        importItems.value = importItems.value.filter(i => !imageIds.has(i.id))
        importItems.value.push(standDiffItem)

        evaluate()
    }

    /**
     * Add a manually created import item.
     */
    function addManualItem(item) {
        if (item.associatedFiles) {
            Object.values(item.associatedFiles).forEach(val => {
                if (!val) return
                if (Array.isArray(val)) {
                    val.forEach(f => {
                        if (!filesPool.value.some(existing => existing.relativePath === f.relativePath)) {
                            filesPool.value.push(f)
                        }
                    })
                } else {
                    if (!filesPool.value.some(existing => existing.relativePath === val.relativePath)) {
                        filesPool.value.push(val)
                    }
                }
            })
        }
        importItems.value.push(item)
        evaluate()
    }

    async function importAnimatedSprite(item) {
        const PIXI = window.PIXI
        const FennecView = (await import('@/fennec-view/FennecView')).default
        const { fileResourceManager } = await import('@/services/resources/FileResourceManager')

        const textures = []
        const imagesInfo = []
        
        async function loadTexture(url) {
            let loadOptions = url
            if (url && typeof url === 'string' && url.startsWith('blob:')) {
                loadOptions = {
                    src: url,
                    loadParser: 'loadTextures'
                }
            }
            return await PIXI.Assets.load(loadOptions)
        }

        const frames = item.associatedFiles?.frames || []
        for (const fileItem of frames) {
            const url = await fileItem.getLoadUrl()
            if (fileItem.isNative) {
                fileResourceManager.registerFile(fileItem.name, null, { path: url })
            }
            fileResourceManager.addFileToGroup(item.id, url)
            
            const texture = await loadTexture(url)
            textures.push(texture)
            imagesInfo.push({
                name: fileItem.name,
                url: url
            })
        }

        if (textures.length > 0 && typeof FennecView.addAnimatedSpriteNode === 'function') {
            const node = await FennecView.addAnimatedSpriteNode(textures, 'images', {
                name: item.config.name,
                imagesInfo,
                resourceId: item.id
            })
            if (node && node[0]) {
                const pixiNode = node[0]
                const frameDuration = item.config.animationSpeed || 100
                if (pixiNode.nodeData) {
                    pixiNode.nodeData.animationSpeed = frameDuration
                }
                if (pixiNode.loop !== undefined) {
                    pixiNode.loop = item.config.loop ?? true
                }
            }
        }
    }

    async function importSpritesheetGrid(item) {
        const PIXI = window.PIXI
        const FennecView = (await import('@/fennec-view/FennecView')).default
        const { fileResourceManager } = await import('@/services/resources/FileResourceManager')

        const imageFile = item.associatedFiles.image
        const imageSrc = await imageFile.getLoadUrl()
        
        if (imageFile.isNative) {
            fileResourceManager.registerFile(imageFile.name, null, { path: imageSrc })
        }
        fileResourceManager.addFileToGroup(item.id, imageSrc)

        async function loadTexture(url) {
            let loadOptions = url
            if (url && typeof url === 'string' && url.startsWith('blob:')) {
                loadOptions = {
                    src: url,
                    loadParser: 'loadTextures'
                }
            }
            return await PIXI.Assets.load(loadOptions)
        }

        const baseTexture = await loadTexture(imageSrc)
        const rows = item.config.rows || 1
        const cols = item.config.cols || 1
        const frameW = baseTexture.width / cols
        const frameH = baseTexture.height / rows

        const textures = []
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const rect = new PIXI.Rectangle(c * frameW, r * frameH, frameW, frameH)
                const frameTexture = new PIXI.Texture({
                    source: baseTexture.source || baseTexture,
                    frame: rect
                })
                textures.push(frameTexture)
            }
        }

        if (textures.length > 0 && typeof FennecView.addAnimatedSpriteNode === 'function') {
            const node = await FennecView.addAnimatedSpriteNode(textures, 'grid', {
                name: item.config.name,
                imageSrc,
                imageName: imageFile.name,
                rows,
                cols,
                resourceId: item.id
            })
            if (node && node[0]) {
                const pixiNode = node[0]
                const frameDuration = item.config.animationSpeed || 100
                if (pixiNode.nodeData) {
                    pixiNode.nodeData.animationSpeed = frameDuration
                }
                if (pixiNode.loop !== undefined) {
                    pixiNode.loop = item.config.loop ?? true
                }
            }
        }
    }

    async function importStandDiff(item) {
        const PIXI = window.PIXI
        const FennecView = (await import('@/fennec-view/FennecView')).default
        const { fileResourceManager } = await import('@/services/resources/FileResourceManager')

        const files = item.associatedFiles?.files || []
        const bgFile = files.find(f => f.name === item.config.backgroundName) || files[0]
        const fgFiles = files.filter(f => f.name !== bgFile.name)

        const bgUrl = await bgFile.getLoadUrl()
        if (bgFile.isNative) {
            fileResourceManager.registerFile(bgFile.name, null, { path: bgUrl })
        }
        fileResourceManager.addFileToGroup(item.id, bgUrl)

        const bgInfo = {
            name: bgFile.name,
            url: bgUrl
        }

        const fgList = []
        for (const fileItem of fgFiles) {
            const url = await fileItem.getLoadUrl()
            if (fileItem.isNative) {
                fileResourceManager.registerFile(fileItem.name, null, { path: url })
            }
            fileResourceManager.addFileToGroup(item.id, url)

            const fgConfig = item.config.foregroundConfigs?.find(c => c.name === fileItem.name)
            fgList.push({
                name: fileItem.name,
                url: url,
                x: (fgConfig?.x !== undefined && fgConfig?.x !== null && fgConfig?.x !== '') ? Number(fgConfig.x) : null,
                y: (fgConfig?.y !== undefined && fgConfig?.y !== null && fgConfig?.y !== '') ? Number(fgConfig.y) : null
            })
        }

        if (typeof FennecView.addStandDiffNode === 'function') {
            await FennecView.addStandDiffNode(bgInfo, fgList, {
                name: item.config.name,
                bgAnchorPreset: item.config.bgAnchorPreset || 'both',
                bgAnchorX: item.config.bgAnchorX !== undefined ? item.config.bgAnchorX : 0.5,
                bgAnchorY: item.config.bgAnchorY !== undefined ? item.config.bgAnchorY : 0.5,
                fgAnchorPreset: item.config.fgAnchorPreset || 'both',
                fgAnchorX: item.config.fgAnchorX !== undefined ? item.config.fgAnchorX : 0.5,
                fgAnchorY: item.config.fgAnchorY !== undefined ? item.config.fgAnchorY : 0.5,
                activeFgKey: fgList[0]?.name || '',
                defaultFgX: item.config.defaultFgX !== undefined ? item.config.defaultFgX : 0,
                defaultFgY: item.config.defaultFgY !== undefined ? item.config.defaultFgY : 0,
                resourceId: item.id
            })
        }
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
                if (item.type === 'animated_sprite') {
                    await importAnimatedSprite(item)
                } else if (item.type === 'spritesheet_grid') {
                    await importSpritesheetGrid(item)
                } else if (item.type === 'stand_diff') {
                    await importStandDiff(item)
                } else {
                    await item.processor.import(item)
                }
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
        addManualItem,
        changeItemType,
        combineImagesToAnimatedSprite,
        combineImagesToStandDiff,
        importAllComplete,
        evaluate
    }
})
