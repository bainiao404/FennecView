<script setup>
import { computed } from 'vue'
import { useI18nStore } from '@/stores/i18n'
import FennecView from '@/fennec-view/FennecView'
import { platformService } from '@/services/platform/PlatformService'

import { useUIStore } from '@/stores/uiStore'
import { readBlobAsArrayBuffer } from '@/utils/helpers'

const i18n = useI18nStore()
const uiStore = useUIStore()

const currentImportTextureMode = computed({
    get() {
        return FennecView.system?.import?.textureMode !== undefined ? FennecView.system.import.textureMode : 3
    },
    set(value) {
        if (typeof window.setTextureMode === 'function') {
            window.setTextureMode(Number(value))
        }
    }
})

function getCordovaFile(path) {
    return new Promise((resolve, reject) => {
        window.resolveLocalFileSystemURL(path, (entry) => {
            if (entry.isFile) {
                entry.file(resolve, reject)
            } else {
                reject(new Error('Not a file'))
            }
        }, reject)
    })
}

function loadProject() {
    if (platformService.isElectron()) {
        FennecView.loadProject()
    } else if (typeof window.cordova !== 'undefined') {
        uiStore.openCordovaFileView({
            title: i18n.locale === 'zh' ? '选择项目文件' : 'Select Project File',
            multiple: false,
            onlyFolder: false,
            onSelect: async (selected) => {
                if (!selected || !selected.path) return
                try {
                    const fileObj = await getCordovaFile(selected.path)
                    const arrayBuffer = await readBlobAsArrayBuffer(fileObj)
                    await FennecView.loadProject(arrayBuffer)
                } catch (e) {
                    console.error('加载项目文件失败:', e)
                }
            }
        })
    } else {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.fv'
        input.onchange = async (e) => {
            const file = e.target.files[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = async (evt) => {
                const arrayBuffer = evt.target.result
                await FennecView.loadProject(arrayBuffer)
            }
            reader.readAsArrayBuffer(file)
        }
        input.click()
    }
}

function importFiles() {
    if (typeof window.cordova !== 'undefined') {
        uiStore.openCordovaFileView({
            title: i18n.locale === 'zh' ? '选择导入文件' : 'Select Import Files',
            multiple: true,
            onlyFolder: false,
            onSelect: async (selected) => {
                if (!selected || selected.length === 0) return
                const filesToLoad = []
                for (let fileInfo of selected) {
                    try {
                        const fileObj = await getCordovaFile(fileInfo.path)
                        fileObj.path = fileInfo.path
                        filesToLoad.push(fileObj)
                    } catch (e) {
                        console.error('获取文件失败:', fileInfo.path, e)
                    }
                }
                if (filesToLoad.length > 0 && typeof FennecView.fileHandleDropWeb === 'function') {
                    await FennecView.fileHandleDropWeb(filesToLoad)
                }
            }
        })
    } else {
        const input = document.createElement('input')
        input.type = 'file'
        input.multiple = true
        input.onchange = async (e) => {
            const files = e.target.files
            if (!files || files.length === 0) return
            if (typeof FennecView.fileHandleDropWeb === 'function') {
                await FennecView.fileHandleDropWeb(files)
            }
        }
        input.click()
    }
}

function importFolder() {
    if (typeof window.cordova !== 'undefined') {
        uiStore.openCordovaFileView({
            title: i18n.locale === 'zh' ? '选择导入文件夹' : 'Select Import Folder',
            multiple: false,
            onlyFolder: true,
            onSelect: async (selected) => {
                if (!selected || !selected.path) return
                try {
                    const { readdirAllFile } = await import('@/assets/gkd-js-0.2/fs.js')
                    const filePaths = await readdirAllFile(selected.path)
                    const filesToLoad = []
                    for (let filePath of filePaths) {
                        try {
                            const fileObj = await getCordovaFile(filePath)
                            fileObj.path = filePath
                            filesToLoad.push(fileObj)
                        } catch (e) {
                            console.error('获取文件夹内文件失败:', filePath, e)
                        }
                    }
                    if (filesToLoad.length > 0 && typeof FennecView.fileHandleDropWeb === 'function') {
                        await FennecView.fileHandleDropWeb(filesToLoad)
                    }
                } catch (e) {
                    console.error('读取文件夹失败:', e)
                }
            }
        })
    } else {
        const input = document.createElement('input')
        input.type = 'file'
        input.webkitdirectory = true
        input.directory = true
        input.onchange = async (e) => {
            const files = e.target.files
            if (!files || files.length === 0) return
            if (typeof FennecView.fileHandleDropWeb === 'function') {
                await FennecView.fileHandleDropWeb(files)
            }
        }
        input.click()
    }
}

</script>

<template>
    <div class="import-panel">
        <div class="panel-section">
            <div class="section-title">{{ i18n.locale === 'zh' ? '项目管理' : 'Project Management' }}</div>
            <div class="ind-btn project-btn" @click="loadProject">
                {{ i18n.t('btnLoadProject') }}
            </div>
        </div>

        <div class="panel-section">
            <div class="section-title">{{ i18n.locale === 'zh' ? '资源导入' : 'Resource Import' }}</div>
            <div class="import-buttons-row">
                <div class="ind-btn import-btn" @click="importFiles">
                    {{ i18n.locale === 'zh' ? '导入文件' : 'Import Files' }}
                </div>
                <div class="ind-btn import-btn" @click="importFolder">
                    {{ i18n.locale === 'zh' ? '导入文件夹' : 'Import Folder' }}
                </div>
            </div>

        </div>

        <div class="panel-section">
            <div class="section-title">{{ i18n.t('propTextureMode') }}</div>
            <select
                v-model="currentImportTextureMode"
                class="attr-select"
            >
                <option :value="0">{{ i18n.t('premultClose') }}</option>
                <option :value="1">{{ i18n.t('premultOnUpload') }}</option>
                <option :value="2">{{ i18n.t('premultOpen') }}</option>
                <option :value="3">{{ i18n.t('premultAuto') }}</option>
            </select>
        </div>
    </div>
</template>

<style scoped>
.import-panel {
    padding: 10px;
}

.panel-section {
    margin-bottom: 16px;
}

.section-title {
    font-size: 13px;
    font-weight: bold;
    color: var(--text-active);
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.radio-group {
    display: flex;
    gap: 12px;
    padding: 4px 0;
}

.radio-label {
    font-size: 12px;
    color: var(--text-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
}

.radio-label input {
    cursor: pointer;
    accent-color: var(--bg-dark-active);
}

.project-btn {
    width: 100%;
    text-align: center;
    box-sizing: border-box;
}

.import-buttons-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
}

.import-btn {
    flex: 1;
    text-align: center;
    box-sizing: border-box;
    font-size: 12px;
    padding: 6px 4px;
}

.attr-select {
    width: 100%;
    background-color: var(--bg-dark-panel, #1e1e1e);
    border: 1px solid var(--border-color, #333);
    color: var(--text-active, #fff);
    font-size: 11px;
    padding: 4px 6px;
    border-radius: 3px;
    outline: none;
    transition: border-color 0.15s ease;
    cursor: pointer;
    box-sizing: border-box;
}

.attr-select:focus {
    border-color: var(--bg-dark-active, #0052d9);
}
</style>
