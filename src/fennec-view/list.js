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
            
            if (type !== 'visible' && type !== 'play' && node.nodeData && typeof node.nodeData.updateProperty === 'function') {
                if (node.nodeData.updateProperty(type, t)) {
                    return
                }
            }

            switch (type) {
                case 'play':
                    handlePlayState(node, index === 0 ? null : targetNode)
                    break
                case 'visible':
                    handleVisibility(node, index === 0 ? null : targetNode)
                    break
            }
        })

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
