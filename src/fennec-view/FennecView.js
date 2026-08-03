/**
 * FennecView Core Engine - Modular ES6 version
 */

import { spine36To38 } from 'simple-pixi-spine'
import { MessagePlugin } from 'tdesign-vue-next'
import { useUIStore } from '@/stores/uiStore'
import GKD from '@/assets/gkd-js-0.2'

import projectMethods from './project'
import screenshotMethods from './screenshot'
import interactionMethods from './interaction'
import listMethods from './list'
import helperMethods, { downloadTextAsFile } from '@/utils/helpers'
import * as ffmpegWasmMethods from './ffmpegWasm'

// Core sub-modules
import viewportMethods from './core/viewport'
import nodeOperationsMethods from './core/nodeOperations'
import lifecycleMethods from './core/lifecycle'

export const FennecView = {
    appMode: 0,
    path: {
        data: null,
        exe: null,
    },
    preview: {
        config: null,
        state: false,
    },
    canvas: {
        app: null,
        world: null,
        box: null,
        textureAtlasContainer: null,
        texturePreviewContainer: null,
        background: null,
    },
    click: {
        current: null,
        remain: {
            x: 0,
            y: 0,
        },
        drag: null, // 当前拖拽元素
        batchList: [], // 批量选择的数组
        toSpine38: function () {
            let node = this.current
            if (node && node.spineData && node.spineData.originalSpine) {
                const jsonContent = JSON.stringify(spine36To38(node.spineData.originalSpine))
                const filename = node.name.replace('.skel', '.json').replace('.json.json', '.json')
                if (typeof window.cordova !== 'undefined') {
                    const uiStore = useUIStore()
                    uiStore.openCordovaFileView({
                        title: '选择导出文件夹',
                        multiple: false,
                        onlyFolder: true,
                        onSelect: async (selected) => {
                            if (!selected || !selected.path) return
                            let cordovaDest = selected.path
                            if (!cordovaDest.endsWith('/')) cordovaDest += '/'
                            cordovaDest += filename
                            try {
                                MessagePlugin.loading('正在导出文件...')
                                await GKD.fs.saveFile(cordovaDest, jsonContent)
                                MessagePlugin.closeAll()
                                MessagePlugin.success('导出文件成功: ' + filename)
                            } catch (err) {
                                MessagePlugin.closeAll()
                                MessagePlugin.error('导出文件失败: ' + err.message)
                            }
                        },
                    })
                } else {
                    downloadTextAsFile(jsonContent, filename)
                }
            }
        },
        toSpineJson: function () {
            let node = this.current
            if (node && node.spineData && node.spineData.originalSpine) {
                const jsonContent = JSON.stringify(node.spineData.originalSpine)
                const filename = node.name.replace('.skel', '.json').replace('.json.json', '.json')
                if (typeof window.cordova !== 'undefined') {
                    const uiStore = useUIStore()
                    uiStore.openCordovaFileView({
                        title: '选择导出文件夹',
                        multiple: false,
                        onlyFolder: true,
                        onSelect: async (selected) => {
                            if (!selected || !selected.path) return
                            let cordovaDest = selected.path
                            if (!cordovaDest.endsWith('/')) cordovaDest += '/'
                            cordovaDest += filename
                            try {
                                MessagePlugin.loading('正在导出文件...')
                                await GKD.fs.saveFile(cordovaDest, jsonContent)
                                MessagePlugin.closeAll()
                                MessagePlugin.success('导出文件成功: ' + filename)
                            } catch (err) {
                                MessagePlugin.closeAll()
                                MessagePlugin.error('导出文件失败: ' + err.message)
                            }
                        },
                    })
                } else {
                    downloadTextAsFile(jsonContent, filename)
                }
            }
        },
    },
    div: {
        po: null,
        ProgressBar: null,
    },
    debug: {
        examples: {
            spine: null,
            spine42: null,
        },
        setStyle: function (style = {}) {
            for (let key in this.examples) {
                if (!this.examples[key]) continue
                for (let key2 in style) {
                    this.examples[key][key2] = style[key2]
                }
            }
            const uiStore = useUIStore()
            uiStore.updateDebugStyle(style)
        },
    },
    system: {
        import: {
            textureMode: 3,
        },
    },
}

Object.assign(
    FennecView,
    viewportMethods,
    nodeOperationsMethods,
    lifecycleMethods,
    projectMethods,
    screenshotMethods,
    interactionMethods,
    listMethods,
    helperMethods,
    ffmpegWasmMethods,
)

if (typeof window !== 'undefined') {
    window.setTextureMode = (mode) => {
        FennecView.system.import.textureMode = Number(mode)
    }
}

export default FennecView
