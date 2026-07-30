import { useUIStore } from '@/stores/uiStore'
import { sceneResourceManager } from './node'

const listMethods = {
    refreshList: function () {
        if (this.preview.state) {
            return
        }
        let box = this.canvas.box
        let children = box.children
        const uiStore = useUIStore()

        const sceneFiles = Array.from(children).map((node, i) => {
            let type = 'img'
            if (node.nodeData && node.nodeData.type) {
                type = node.nodeData.type
            } else if (node.skeleton) {
                type = 'spine'
            } else if (node.internalModel) {
                type = 'live2d'
            }

            let isPlaying = false
            if (node.nodeData) {
                if (node.nodeData.type === 'video') {
                    isPlaying = !!node._videoPlaying
                } else {
                    isPlaying = !node.nodeData.paused
                }
            } else if (node.state) {
                isPlaying = node.state.timeScale !== 0
            }

            return {
                name: node.name,
                index: i,
                visible: node.visible,
                playing: isPlaying,
                type: type,
            }
        })
        uiStore.updateSceneFiles(sceneFiles)
    },

    selectNodeFromList: function (id) {
        var box = this.canvas.box
        var node = box.children[id]
        if (node) {
            this.click.current = node
        }
        this.refreshPropertyPanel()
    },

    hoverNodeFromList: function (id) {
        var box = this.canvas.box
        var node = box.children[id]
        if (node && node.setDebug) {
            node.setDebug(true)
        }
    },

    unhoverNodeFromList: function (id) {
        var box = this.canvas.box
        var node = box.children[id]
        if (node && node.setDebug) {
            node.setDebug(false)
        }
    },

    deleteNode: function () {
        let node = this.click.current
        var box = this.canvas.box
        if (node) {
            this.click.current = null
            box.removeChild(node)
            if (node.nodeData) {
                sceneResourceManager.remove(node)
            } else {
                node.destroy(true)
            }
            if (box.children.length > 0) {
                this.click.current = box.children[0]
            }
        }
        this.click.batchList = []
        this.refreshBatchSelection()
        this.refreshList()
        this.refreshPropertyPanel()
    },

    handleListNodeDragStart: function (e) {
        this.click.drag = e.target
        e.stopPropagation()
    },

    handleListNodeDrop: function (e) {
        let endDiv = getSpineNode(e.target)
        if (!endDiv) return
        if (endDiv) {
            var box = this.canvas.box
            var div = this.click.drag
            let endPo = endDiv.dataset.spineposition
            let startPo = div.dataset.spineposition
            if (div) {
                if (endPo !== undefined && startPo !== undefined) {
                    box.setChildIndex(box.children[startPo], endPo)
                }
            }
            this.click.batchList = []
            this.refreshBatchSelection()
            this.refreshList()
        }
        e.stopPropagation()

        function getSpineNode(n) {
            if (n.dataset && n.dataset.spineposition !== undefined) {
                return n
            }
            if (n.parentNode) {
                return getSpineNode(n.parentNode)
            } else {
                return null
            }
        }
    },

    toggleBatchSelection: function (event, div, type) {
        var btnNum = event.button
        var batch = this.click.batchList
        if (btnNum == 2) {
            var index = batch.indexOf(div.dataset.spineposition)
            if (type == 'add') {
                if (index == -1) {
                    batch.push(div.dataset.spineposition)
                }
            } else {
                if (index > -1) {
                    batch.splice(index, 1)
                }
            }
            this.refreshBatchSelection()
        }
    },

    refreshBatchSelection: function () {
        var batch = this.click.batchList
        const uiStore = useUIStore()
        uiStore.updateBatchSelection(batch)
    },

    updateNodeProperty: function (type, t, po) {
        const { box } = this.canvas
        const { current, batchList } = this.click
        const targetNode = po !== undefined ? box.children[po] : current
        const nodes = [targetNode, ...batchList.map((idx) => box.children[idx])]

        nodes.forEach((node, index) => {
            if (!node) return
            if (type !== 'visible' && !node.nodeData && !node.state) return
            switch (type) {
                case 'skin':
                    if (node.nodeData) {
                        node.nodeData.setSkin(t)
                    }
                    break
                case 'animation':
                    if (node.nodeData) {
                        node.nodeData.setAnimation(t)
                    }
                    break
                case 'play':
                    handlePlayState(node, index === 0 ? null : targetNode)
                    break
                case 'visible':
                    handleVisibility(node, index === 0 ? null : targetNode)
                    break
                case 'attachment':
                    if (node.skeleton) {
                        let slot = node.skeleton.findSlot(t[0])
                        if (!slot) {
                            break
                        }
                        let attachment = null
                        if (t[1]) {
                            attachment = node.skeleton.getAttachmentByName(t[0], t[1])
                        }
                        if (!attachment) {
                            if (node.nodeData && node.nodeData.setAttachment) {
                                node.nodeData.setAttachment(t[0], null)
                            }
                            break
                        }
                        if (node.nodeData && node.nodeData.setAttachment) {
                            node.nodeData.setAttachment(t[0], t[1])
                        }
                    }
                    break
                case 'text':
                    if (node instanceof PIXI.Text) {
                        node.text = t
                        if (node.children[0]) {
                            node.children[0].clear().rect(0, 0, node.width, node.height).stroke({ width: 4, color: 0xff0000 })
                        }
                    }
                    break
                case 'fontSize':
                    if (node instanceof PIXI.Text) {
                        node.style.fontSize = parseFloat(t)
                        if (node.children[0]) {
                            node.children[0].clear().rect(0, 0, node.width, node.height).stroke({ width: 4, color: 0xff0000 })
                        }
                    }
                    break
                case 'fontFamily':
                    if (node instanceof PIXI.Text) {
                        node.style.fontFamily = t
                        if (node.children[0]) {
                            node.children[0].clear().rect(0, 0, node.width, node.height).stroke({ width: 4, color: 0xff0000 })
                        }
                    }
                    break
                case 'fill':
                    if (node instanceof PIXI.Text) {
                        node.style.fill = t
                    } else if (node.nodeData && node.nodeData.type === 'rect') {
                        node._rectFill = t
                        node.nodeData.redraw()
                    }
                    break
                case 'width':
                    if (node.nodeData && node.nodeData.type === 'rect') {
                        node._rectWidth = parseFloat(t)
                        node.nodeData.redraw()
                    } else {
                        node.width = parseFloat(t)
                    }
                    break
                case 'height':
                    if (node.nodeData && node.nodeData.type === 'rect') {
                        node._rectHeight = parseFloat(t)
                        node.nodeData.redraw()
                    } else {
                        node.height = parseFloat(t)
                    }
                    break
                case 'radius':
                    if (node.nodeData && node.nodeData.type === 'rect') {
                        node._rectRadius = parseFloat(t)
                        node.nodeData.redraw()
                    }
                    break
                case 'borderWidth':
                    if (node.nodeData && node.nodeData.type === 'rect') {
                        node._rectBorderWidth = parseFloat(t)
                        node.nodeData.redraw()
                    }
                    break
                case 'borderColor':
                    if (node.nodeData && node.nodeData.type === 'rect') {
                        node._rectBorderColor = t
                        node.nodeData.redraw()
                    }
                    break
                case 'videoLoop':
                    if (node.nodeData && node.nodeData.type === 'video') {
                        node._videoLoop = t === 'true' || t === true
                        const videoEl = node.nodeData.getVideoElement()
                        if (videoEl) videoEl.loop = node._videoLoop
                    }
                    break
                case 'videoMuted':
                    if (node.nodeData && node.nodeData.type === 'video') {
                        node._videoMuted = t === 'true' || t === true
                        const videoEl = node.nodeData.getVideoElement()
                        if (videoEl) videoEl.muted = node._videoMuted
                    }
                    break
                case 'videoVolume':
                    if (node.nodeData && node.nodeData.type === 'video') {
                        node._videoVolume = parseFloat(t)
                        const videoEl = node.nodeData.getVideoElement()
                        if (videoEl) videoEl.volume = node._videoVolume
                    }
                    break
                case 'videoPlaying':
                    if (node.nodeData && node.nodeData.type === 'video') {
                        node._videoPlaying = t === 'true' || t === true
                        const videoEl = node.nodeData.getVideoElement()
                        if (videoEl) {
                            if (node._videoPlaying) videoEl.play()
                            else videoEl.pause()
                        }
                    }
                    break
                case 'animationSpeed':
                    if (node.nodeData && node.nodeData.type === 'animatedSprite') {
                        node.nodeData.animationSpeed = parseFloat(t)
                    }
                    break
                case 'animationLoop':
                    if (node.nodeData && node.nodeData.type === 'animatedSprite') {
                        node.nodeData.loop = t === 'true' || t === true
                    }
                    break
                case 'animationPlaying':
                    if (node.nodeData && node.nodeData.type === 'animatedSprite') {
                        node.nodeData.playing = t === 'true' || t === true
                    }
                    break
                case 'align':
                    if (node instanceof PIXI.Text) {
                        node.style.align = t
                    }
                    break
                case 'name':
                    node.name = t
                    break
                case 'x':
                    node.x = parseFloat(t)
                    break
                case 'y':
                    node.y = parseFloat(t)
                    break
                case 'scaleX':
                    node.scale.x = parseFloat(t)
                    break
                case 'scaleY':
                    node.scale.y = parseFloat(t)
                    break
                case 'rotation':
                    node.rotation = (parseFloat(t) * Math.PI) / 180
                    break
                case 'alpha':
                    node.alpha = Math.max(0, Math.min(1, parseFloat(t)))
                    break
                case 'isPremultiplied':
                    if (node.spineData && typeof node.spineData.setPremultiplied === 'function') {
                        node.spineData.setPremultiplied(t)
                        if (this.canvas?.app) {
                            this.canvas.app.render()
                        }
                    }
                    break
                case 'textureMode':
                    if (node.spineData && typeof node.spineData.setPremultiplied === 'function') {
                        node.spineData.setPremultiplied(Number(t))
                        if (this.canvas?.app) {
                            this.canvas.app.render()
                        }
                    }
                    break
                case 'live2dTransitionMode':
                    if (node.nodeData) {
                        node.nodeData.transitionMode = t
                    }
                    break
                case 'live2dFadeIn':
                    if (node.nodeData) {
                        node.nodeData.live2dFadeIn = parseFloat(t)
                    }
                    break
                case 'live2dFadeOut':
                    if (node.nodeData) {
                        node.nodeData.live2dFadeOut = parseFloat(t)
                    }
                    break
                case 'live2dTracking':
                    if (node.nodeData) {
                        node.nodeData.live2dTracking = !!t
                    }
                    break
                case 'live2dParameter':
                    if (node.nodeData) {
                        if (!node.nodeData._live2DParameters) {
                            node.nodeData._live2DParameters = {}
                        }
                        let pName = t[0]
                        let pVal = parseFloat(t[1])
                        if (!node.nodeData._live2DParameters[pName]) {
                            node.nodeData._live2DParameters[pName] = {
                                state: true,
                                value: pVal,
                                targetValue: pVal,
                                transitionSpeed: 0.1,
                            }
                        } else {
                            node.nodeData._live2DParameters[pName].targetValue = pVal
                            node.nodeData._live2DParameters[pName].state = true
                        }
                    }
                    break
                case 'live2dParameterState':
                    if (node.nodeData) {
                        if (!node.nodeData._live2DParameters) {
                            node.nodeData._live2DParameters = {}
                        }
                        let pName = t[0]
                        let pState = !!t[1]
                        if (node.nodeData._live2DParameters[pName]) {
                            node.nodeData._live2DParameters[pName].state = pState
                        } else if (pState) {
                            node.nodeData._live2DParameters[pName] = {
                                state: true,
                                value: 0,
                                targetValue: 0,
                                transitionSpeed: 0.1,
                            }
                        }
                    }
                    break
                case 'live2dPart':
                    if (node.nodeData) {
                        if (!node.nodeData._live2DParts) {
                            node.nodeData._live2DParts = {}
                        }
                        let pName = t[0]
                        let pVal = parseFloat(t[1])
                        if (!node.nodeData._live2DParts[pName]) {
                            node.nodeData._live2DParts[pName] = {
                                state: true,
                                value: pVal,
                                targetValue: pVal,
                                transitionSpeed: 0.1,
                            }
                        } else {
                            node.nodeData._live2DParts[pName].targetValue = pVal
                            node.nodeData._live2DParts[pName].state = true
                        }
                    }
                    break
                case 'live2dPartState':
                    if (node.nodeData) {
                        if (!node.nodeData._live2DParts) {
                            node.nodeData._live2DParts = {}
                        }
                        let pName = t[0]
                        let pState = !!t[1]
                        if (node.nodeData._live2DParts[pName]) {
                            node.nodeData._live2DParts[pName].state = pState
                        } else if (pState) {
                            node.nodeData._live2DParts[pName] = {
                                state: true,
                                value: 1,
                                targetValue: 1,
                                transitionSpeed: 0.1,
                            }
                        }
                    }
                    break
                case 'resetLive2dParameters':
                    if (node.nodeData) {
                        node.nodeData._live2DParameters = {}
                        if (t && Array.isArray(t)) {
                            t.forEach((p) => {
                                if (
                                    node.internalModel &&
                                    node.internalModel.coreModel &&
                                    node.internalModel.coreModel.setParameterValueById
                                ) {
                                    node.internalModel.coreModel.setParameterValueById(
                                        p.name,
                                        p.defaultValue !== undefined ? p.defaultValue : 0,
                                    )
                                }
                            })
                        }
                    }
                    break
                case 'resetLive2dParts':
                    if (node.nodeData) {
                        node.nodeData._live2DParts = {}
                        if (t && Array.isArray(t)) {
                            t.forEach((p) => {
                                if (
                                    node.internalModel &&
                                    node.internalModel.coreModel &&
                                    node.internalModel.coreModel.setPartOpacityById
                                ) {
                                    node.internalModel.coreModel.setPartOpacityById(
                                        p.name,
                                        p.defaultValue !== undefined ? p.defaultValue : 1,
                                    )
                                }
                            })
                        }
                    }
                    break
            }
        })

        switch (type) {
            case 'slotsAlpha':
                if (targetNode && targetNode.skeleton) {
                    targetNode.skeleton.slots[t[0]].color.a = t[1] * 1
                }
                break
        }

        this.refreshList()
        this.refreshPropertyPanel()

        function handlePlayState(n, masterNode) {
            if (n.nodeData) {
                if (!masterNode) {
                    n.nodeData.paused = !n.nodeData.paused
                } else {
                    n.nodeData.paused = masterNode.nodeData.paused
                }
            } else if (n.state) {
                if (!masterNode) {
                    n.state.timeScale = n.state.timeScale === 1 ? 0 : 1
                } else {
                    n.state.timeScale = masterNode.state.timeScale
                }
            }
        }

        function handleVisibility(n, masterNode) {
            if (!masterNode) {
                n.visible = !n.visible
            } else {
                n.visible = masterNode.visible
            }
        }
    },
}

export default listMethods
