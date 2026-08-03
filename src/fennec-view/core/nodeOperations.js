import { sceneResourceManager } from '../node'
import { useUIStore } from '@/stores/uiStore'
import { fileResourceManager } from '@/services/resources/FileResourceManager'
const PIXI = window.PIXI

export default {
    clearAllNodes: function () {
        let box = this.canvas.box
        if (!box) return
        let children = [...box.children]
        children.forEach((node) => {
            box.removeChild(node)
            if (node.nodeData) {
                sceneResourceManager.remove(node)
            } else {
                node.destroy(true)
            }
        })
        this.click.current = null
        this.click.batchList = []
        this.refreshBatchSelection()
        this.refreshList()
        this.refreshPropertyPanel()
    },


    attachNodeEvents: function (node) {
        let t = this
        if (this.preview.state) {
            node.interactiveChildren = false
            return
        }
        const { world, box } = t.canvas
        node.interactive = true
        node.buttonMode = true

        const handlers = {
            onDragStart(event) {
                if (event.button === 2 || (event.data?.originalEvent && event.data.originalEvent.button === 2)) {
                    return
                }
                this.dragging = true
                this.prevX = event.data.global.x
                this.prevY = event.data.global.y
                t.click.current = this
                t.refreshPropertyPanel()

                if (t.canvas?.app?.stage) {
                    t.canvas.app.stage.interactive = true
                    t.canvas.app.stage.hitArea = t.canvas.app.screen
                    t.canvas.app.stage.on('pointermove', handlers.onDragMoveStage, this)
                    t.canvas.app.stage.on('pointerup', handlers.onDragEndStage, this)
                    t.canvas.app.stage.on('pointerupoutside', handlers.onDragEndStage, this)
                }
            },

            onDragMoveStage(event) {
                if (!this.dragging) return
                const { current, batchList } = t.click
                t.click.remain = { ...event.data.global }

                const dx = event.data.global.x - this.prevX
                const dy = event.data.global.y - this.prevY

                const nodesToMove = getDragNodes(current, batchList, box.children)
                nodesToMove.forEach((targetNode) => {
                    targetNode.position.set(targetNode.x + dx / world.scale.x, targetNode.y + dy / world.scale.y)
                })

                this.prevX = event.data.global.x
                this.prevY = event.data.global.y
            },

            onDragEndStage() {
                if (this.dragging) {
                    this.dragging = false
                    if (t.canvas?.app?.stage) {
                        t.canvas.app.stage.off('pointermove', handlers.onDragMoveStage, this)
                        t.canvas.app.stage.off('pointerup', handlers.onDragEndStage, this)
                        t.canvas.app.stage.off('pointerupoutside', handlers.onDragEndStage, this)
                    }
                    t.refreshPropertyPanel()
                }
            },

            onMouseover() {
                if (node.setDebug) node.setDebug(true)
            },

            onMouseout() {
                if (node.setDebug) node.setDebug(false)
            },
        }

        const events = [
            ['pointerdown', handlers.onDragStart],
            ['pointerover', handlers.onMouseover],
            ['pointerout', handlers.onMouseout],
        ]

        events.forEach(([type, handler]) => node.on(type, handler))

        function getDragNodes(current, batchList, boxChildren) {
            const nodes = new Set([current])
            if (batchList.length > 0) {
                batchList.forEach((idx) => {
                    if (boxChildren[idx]) nodes.add(boxChildren[idx])
                })
            }
            return Array.from(nodes)
        }
    },

    refreshPropertyPanel: function () {
        if (this.preview.state) {
            return
        }
        const node = this.click.current
        if (!node) {
            return
        }
        const uiStore = useUIStore()
        uiStore.updatePropertyPanel(node)
    },
}
