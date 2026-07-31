import { useUIStore } from '@/stores/uiStore'
import { isElectron } from '@/assets/gkd-js-0.2/env.js'
import { readBlobAsText, readBlobAsArrayBuffer } from './helpers'
import { blobRegistry } from '@/services/resources/BlobRegistry'

async function getSafeBlobUrl(file) {
    try {
        return blobRegistry.createURL(file)
    } catch (e) {
        try {
            const buffer = await readBlobAsArrayBuffer(file)
            const nativeBlob = new Blob([buffer], { type: file.type || 'application/octet-stream' })
            return blobRegistry.createURL(nativeBlob)
        } catch (err) {
            console.error('Failed to convert file to native Blob:', err)
            throw err
        }
    }
}
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

const interactionMethods = {
    onMouseWheel: function (event) {
        const { deltaY, offsetX, offsetY } = event
        let targetNode = this.click.current
        let operationType = 'spine'

        if (!targetNode || !targetNode.dragging) {
            targetNode = this.canvas.world
            operationType = 'world'
        }

        const zoomDirection = Math.sign(deltaY)
        const zoomStep = 0.1 * -zoomDirection

        const scaleNodes = (node) => {
            const localPos = node.worldTransform.applyInverse({ x: offsetX, y: offsetY })
            const newScale = node.scale.x + zoomStep

            if (newScale >= 0.1 && newScale <= 3) {
                node.scale.set(newScale)
                node.position.set(node.x - localPos.x * zoomStep, node.y - localPos.y * zoomStep)
            }
        }

        if (operationType === 'world') {
            scaleNodes(targetNode)
            this.updateScale()
            const uiStore = useUIStore()
            uiStore.updateScale(targetNode.scale.x)
            uiStore.updateWorldPosition(targetNode.x, targetNode.y)
        } else {
            const batchList = this.click.batchList
            const boxChildren = this.canvas.box.children

            batchList.forEach((index) => {
                const batchNode = boxChildren[index]
                if (batchNode !== targetNode) {
                    scaleNodes(batchNode)
                }
            })

            scaleNodes(targetNode)
        }
    },

    onMouseMove: function (event) {
        var world = this.canvas.world
        const uiStore = useUIStore()
        uiStore.updateCanvasPosition(event.offsetX, event.offsetY)
        if (world.dragging) {
            world.x = world.x + event.movementX
            world.y = world.y + event.movementY
            this.updateScale()
            uiStore.updateWorldPosition(world.x, world.y)
        }
        event.stopPropagation()
    },

    handleRightClickDrag: function (event, type) {
        var world = this.canvas.world
        if (!world) return
        var btnNum = event.button
        if (btnNum == 2) {
            switch (type) {
                case 0:
                    world.dragging = true
                    break
                case 1:
                    world.dragging = false
                    break
            }
        }
    },

    fileHandleDrop: async function (event) {
        event.preventDefault()
        const { FileScanner } = await import('@/services/import/utils/fileScanner')
        const { useImportStore } = await import('@/stores/importStore')
        
        const files = await FileScanner.scanDrop(event.dataTransfer)
        if (files && files.length > 0) {
            const importStore = useImportStore()
            await importStore.addFiles(files)
        }
    },

    fileHandleDropWeb: async function (files) {
        const { FileScanner } = await import('@/services/import/utils/fileScanner')
        const { useImportStore } = await import('@/stores/importStore')
        
        const scannedFiles = await FileScanner.scanFileInput(files)
        if (scannedFiles && scannedFiles.length > 0) {
            const importStore = useImportStore()
            await importStore.addFiles(scannedFiles)
        }
    },

    getUserRect: async function (hintText) {
        const uiStore = useUIStore()
        uiStore.startRectSelection(hintText || '请划取区域')
        this.setUI(false)

        await new Promise((resolve) => setTimeout(resolve, 0))

        const container = document.getElementById('userRect')
        if (!container) {
            uiStore.endRectSelection()
            this.setUI(true)
            return null
        }

        try {
            const rect = await this.createRectangleDrawer(container, 20, (rectParams) => {
                uiStore.updateRectParameters(rectParams)
                const parameterTextElement = document.getElementById('userRectParameterText')
                if (parameterTextElement) {
                    const worldRect = this.getWindowRectToWorldRect(rectParams)
                    if (worldRect) {
                        parameterTextElement.textContent =
                            'X:' +
                            Math.round(worldRect.x) +
                            '/Y:' +
                            Math.round(worldRect.y) +
                            '/W:' +
                            Math.round(worldRect.width) +
                            '/H:' +
                            Math.round(worldRect.height)
                    }
                }
            })
            if (!rect || isNaN(rect.width) || isNaN(rect.height) || rect.width <= 2 || rect.height <= 2) {
                return null
            }
            return rect
        } finally {
            uiStore.endRectSelection()
            this.setUI(true)
        }
    },

    getWindowRectToWorldRect: function (rect) {
        if (!rect) return null
        let world = this.canvas.world
        const localPos = world.toLocal({ x: rect.x, y: rect.y })
        return {
            x: localPos.x,
            y: localPos.y,
            width: rect.width / world.scale.x,
            height: rect.height / world.scale.x,
        }
    },

    createRectangleDrawer: function (container, zIndex, moveCallback) {
        return new Promise((resolve) => {
            const rectangle = document.createElement('div')
            rectangle.style.cssText = `
                position: absolute;
                border: 2px dashed #ff0000;
                background: rgba(255, 0, 0, 0.1);
                pointer-events: none;
                display: none;
                z-index: ${zIndex};
            `
            container.appendChild(rectangle)

            let startX, startY
            let isDrawing = false

            const getPosition = (e) => {
                const rect = container.getBoundingClientRect()
                return {
                    x: (e.clientX || e.touches[0].clientX) - rect.left,
                    y: (e.clientY || e.touches[0].clientY) - rect.top,
                }
            }

            const handleStart = (e) => {
                e.preventDefault()
                const { x, y } = getPosition(e)
                startX = x
                startY = y
                isDrawing = true
                rectangle.style.display = ''
            }

            const handleMove = (e) => {
                if (!isDrawing) return
                e.preventDefault()

                const { x, y } = getPosition(e)
                const width = x - startX
                const height = y - startY

                rectangle.style.left = `${width < 0 ? x : startX}px`
                rectangle.style.top = `${height < 0 ? y : startY}px`
                rectangle.style.width = `${Math.abs(width)}px`
                rectangle.style.height = `${Math.abs(height)}px`

                if (moveCallback) {
                    const rectParams = {
                        x: parseInt(rectangle.style.left),
                        y: parseInt(rectangle.style.top),
                        width: parseInt(rectangle.style.width),
                        height: parseInt(rectangle.style.height),
                    }
                    moveCallback(rectParams)
                }
            }

            const handleEnd = (e) => {
                if (!isDrawing) return
                e.preventDefault()
                isDrawing = false

                const rectParams = {
                    x: parseInt(rectangle.style.left) || 0,
                    y: parseInt(rectangle.style.top) || 0,
                    width: parseInt(rectangle.style.width) || 0,
                    height: parseInt(rectangle.style.height) || 0,
                }

                container.removeEventListener('mousedown', handleStart)
                container.removeEventListener('mousemove', handleMove)
                container.removeEventListener('mouseup', handleEnd)
                container.removeEventListener('touchstart', handleStart)
                container.removeEventListener('touchmove', handleMove)
                container.removeEventListener('touchend', handleEnd)

                if (rectangle.parentNode === container) {
                    container.removeChild(rectangle)
                }

                resolve(rectParams)
            }

            container.addEventListener('mousedown', handleStart)
            container.addEventListener('mousemove', handleMove)
            container.addEventListener('mouseup', handleEnd)
            container.addEventListener('touchstart', handleStart)
            container.addEventListener('touchmove', handleMove)
            container.addEventListener('touchend', handleEnd)
        })
    },
}

export default interactionMethods
