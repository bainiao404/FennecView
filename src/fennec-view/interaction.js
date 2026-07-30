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

    fileHandleDrop: function (event) {
        event.preventDefault()
        let files = event.dataTransfer.files
        if (!files || files.length === 0) return

        if (!isElectron() || !files[0].path) {
            this.fileHandleDropWeb(files)
            return
        }

        let spineList = []
        let imgList = []
        let videoList = []
        let fvFile = null
        for (var i = 0; i < files.length; i++) {
            let name = files[i].name
            let file_path = files[i].path ? files[i].path.replace(/\\/g, '/') : ''

            if (name.toLowerCase().endsWith('.fv')) {
                fvFile = files[i]
                break
            }
            if (name.indexOf('.skel') != -1 || name.indexOf('.json') != -1 || name.indexOf('.spine-json') != -1) {
                spineList.push(file_path)
            }
            if (name.indexOf('.png') != -1 || name.indexOf('.jpg') != -1 || name.indexOf('.webg') != -1) {
                imgList.push(file_path)
            }
            if (name.endsWith('.mp4') || name.endsWith('.webm') || name.endsWith('.ogg')) {
                videoList.push(file_path)
            }
        }

        if (fvFile) {
            const self = this
            ;(async () => {
                try {
                    const arrayBuffer = await readBlobAsArrayBuffer(fvFile)
                    await self.loadProjectFromBuffer(arrayBuffer)
                } catch (err) {
                    console.error('加载拖入的项目文件失败:', err)
                }
            })()
            return
        }

        if (spineList.length > 0) {
            this.addSpineNode(spineList, this.system.import.textureMode)
            return
        }
        if (imgList.length > 0) {
            this.addImageNode(imgList)
        }
        if (videoList.length > 0) {
            this.addVideoNode(videoList)
        }
    },

    fileHandleDropWeb: async function (files) {
        const fileArray = Array.from(files)

        const fvFile = fileArray.find((f) => f.name.toLowerCase().endsWith('.fv'))
        if (fvFile) {
            try {
                const arrayBuffer = await readBlobAsArrayBuffer(fvFile)
                await this.loadProjectFromBuffer(arrayBuffer)
            } catch (err) {
                console.error('加载拖入的项目文件失败:', err)
            }
            return
        }

        function normalizePath(p) {
            if (typeof p !== 'string') return ''
            let np = p.replace(/\\/g, '/')
            if (np.startsWith('./')) {
                np = np.substring(2)
            }
            return np
        }

        function findMatchingFile(relPath) {
            const norm = normalizePath(relPath).toLowerCase()
            const fileName = norm.substring(norm.lastIndexOf('/') + 1)
            let found = fileArray.find((f) => f.name.toLowerCase() === fileName)
            if (found) return found
            found = fileArray.find((f) => {
                const fNorm = normalizePath(f.webkitRelativePath || f.name).toLowerCase()
                return fNorm.endsWith(norm)
            })
            return found
        }

        const spineSkelJsonFiles = []
        const live2dModelFiles = []
        const imageFiles = []
        const videoFiles = []
        const atlasFiles = []
        const spritesheetJsonFiles = []

        for (let file of fileArray) {
            const name = file.name.toLowerCase()
            if (
                name.endsWith('.model3.json') ||
                name.endsWith('.model.json') ||
                (name.includes('model') && name.endsWith('.json'))
            ) {
                live2dModelFiles.push(file)
            } else if (name.endsWith('.skel') || name.endsWith('.spine-json')) {
                spineSkelJsonFiles.push(file)
            } else if (name.endsWith('.json')) {
                try {
                    const text = await readBlobAsText(file)
                    const parsed = JSON.parse(text)
                    if (parsed.frames && parsed.meta && parsed.meta.image) {
                        spritesheetJsonFiles.push({ file, json: parsed })
                    } else if (parsed.skeleton || parsed.bones) {
                        spineSkelJsonFiles.push(file)
                    } else if (parsed.model || parsed.FileReferences) {
                        live2dModelFiles.push(file)
                    } else {
                        spineSkelJsonFiles.push(file)
                    }
                } catch (e) {
                    spineSkelJsonFiles.push(file)
                }
            } else if (name.endsWith('.atlas')) {
                atlasFiles.push(file)
            } else if (/\.(png|jpg|jpeg|webp|gif)$/.test(name)) {
                imageFiles.push(file)
            } else if (/\.(mp4|webm|ogg)$/.test(name)) {
                videoFiles.push(file)
            }
        }

        if (spritesheetJsonFiles.length > 0) {
            for (let item of spritesheetJsonFiles) {
                const { file: jsonFile, json } = item
                const imageName = json.meta.image
                
                let matchedImgFile = findMatchingFile(imageName)
                if (!matchedImgFile && imageFiles.length === 1) {
                    matchedImgFile = imageFiles[0]
                }
                
                if (!matchedImgFile) {
                    console.warn(`未找到与精灵表 ${jsonFile.name} 匹配的纹理文件 ${imageName}`)
                    continue
                }
                
                try {
                    const imageSrc = await getSafeBlobUrl(matchedImgFile)
                    const baseTexture = await loadTexture(imageSrc)
                    const spritesheet = new PIXI.Spritesheet(baseTexture, json)
                    await spritesheet.parse()
                    const textures = Object.values(spritesheet.textures)
                    
                    if (textures.length > 0) {
                        const name = jsonFile.name.substring(0, jsonFile.name.lastIndexOf('.'))
                        await this.addAnimatedSpriteNode(textures, 'spritesheet', {
                            name,
                            originalJson: json,
                            imageSrc,
                            jsonName: jsonFile.name,
                            imageName: matchedImgFile.name
                        })
                    }
                } catch (err) {
                    console.error('加载精灵表失败:', err)
                }
            }
            return
        }

        if (live2dModelFiles.length > 0) {
            for (let modelFile of live2dModelFiles) {
                try {
                    const text = await readBlobAsText(modelFile)
                    const modelJson = JSON.parse(text)
                    const originalModelJson = JSON.parse(JSON.stringify(modelJson))

                    const pathMap = {}
                    const mappedPromises = []
                    function collectAndMapPaths(obj) {
                        for (let key in obj) {
                            if (typeof obj[key] === 'string') {
                                const val = obj[key]
                                if (
                                    /\.[a-zA-Z0-9]+$/.test(val) &&
                                    !val.startsWith('http') &&
                                    !val.startsWith('data:') &&
                                    !val.startsWith('blob:')
                                ) {
                                    const matchFile = findMatchingFile(val)
                                    if (matchFile) {
                                        const p = (async () => {
                                            const buffer = await readBlobAsArrayBuffer(matchFile)
                                            let mimeType = 'application/octet-stream'
                                            if (matchFile.name.endsWith('.png')) mimeType = 'image/png'
                                            else if (matchFile.name.endsWith('.json')) mimeType = 'application/json'
                                            const blob = new Blob([buffer], { type: mimeType })
                                            const blobUrl = blobRegistry.createURL(blob)
                                            pathMap[normalizePath(val)] = blobUrl
                                        })()
                                        mappedPromises.push(p)
                                    }
                                }
                            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                                collectAndMapPaths(obj[key])
                            }
                        }
                    }

                    collectAndMapPaths(modelJson)
                    await Promise.all(mappedPromises)

                    function findBlobUrl(relPath) {
                        const norm = normalizePath(relPath)
                        if (pathMap[norm]) return pathMap[norm]
                        const lowerNorm = norm.toLowerCase()
                        for (let key in pathMap) {
                            if (key.toLowerCase() === lowerNorm) {
                                return pathMap[key]
                            }
                        }
                        return null
                    }

                    function rewritePaths(obj) {
                        for (let key in obj) {
                            if (typeof obj[key] === 'string') {
                                const mappedUrl = findBlobUrl(obj[key])
                                if (mappedUrl) {
                                    obj[key] = mappedUrl
                                }
                            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                                rewritePaths(obj[key])
                            }
                        }
                    }
                    rewritePaths(modelJson)

                    const rewrittenJsonBlob = new Blob([JSON.stringify(modelJson, null, 4)], {
                        type: 'application/json',
                    })
                    const rewrittenJsonBlobUrl = blobRegistry.createURL(rewrittenJsonBlob)

                    const live2dSrcObj = {
                        type: 'live2d',
                        path: [rewrittenJsonBlobUrl],
                    }
                    let live2dNodes = await this.addSpineNode([live2dSrcObj])
                    let mNode = live2dNodes[0]
                    if (mNode) {
                        mNode.name = modelFile.name
                        mNode.url = rewrittenJsonBlobUrl
                        mNode.live2dData = {
                            originalModelJson: originalModelJson,
                            pathMap: pathMap,
                        }
                    }
                } catch (err) {
                    console.error('加载拖入的 Live2D 模型失败:', err)
                }
            }
            return
        }

        if (spineSkelJsonFiles.length > 0) {
            const imageBlobMaps = {}
            await Promise.all(
                imageFiles.map(async (file) => {
                    imageBlobMaps[file.name] = await getSafeBlobUrl(file)
                }),
            )

            for (let skelFile of spineSkelJsonFiles) {
                try {
                    const baseName = skelFile.name.substring(0, skelFile.name.lastIndexOf('.'))
                    let atlasFile = atlasFiles.find((f) => {
                        const fBaseName = f.name.substring(0, f.name.lastIndexOf('.'))
                        return fBaseName.toLowerCase() === baseName.toLowerCase()
                    })
                    if (!atlasFile && atlasFiles.length === 1) {
                        atlasFile = atlasFiles[0]
                    }
                    if (!atlasFile) {
                        console.warn(`未找到与 ${skelFile.name} 匹配的 .atlas 文件`)
                        continue
                    }

                    const skelBlobUrl = await getSafeBlobUrl(skelFile)
                    const atlasText = await readBlobAsText(atlasFile)
                    const atlasBlob = new Blob([atlasText], { type: 'text/plain' })
                    const atlasBlobUrl = blobRegistry.createURL(atlasBlob)

                    const isSkel = skelFile.name.endsWith('.skel')
                    const spineSrcObj = {
                        type: isSkel ? 'skel' : 'json',
                        path: [skelBlobUrl, atlasBlobUrl, ''],
                        atlasPath: atlasBlobUrl,
                        texturePath: '',
                        textures: imageBlobMaps,
                        name: skelFile.name,
                    }

                    await this.addSpineNode([spineSrcObj], this.system.import.textureMode)
                } catch (err) {
                    console.error('加载拖入的 Spine 动画失败:', err)
                }
            }
            return
        }

        if (imageFiles.length > 0) {
            const imgSrcs = []
            for (let file of imageFiles) {
                const blobUrl = await getSafeBlobUrl(file)
                const ext = file.name.split('.').pop().toLowerCase()
                imgSrcs.push({
                    path: [blobUrl],
                    name: file.name,
                    type: ext,
                })
            }
            await this.addImageNode(imgSrcs)
        }

        if (videoFiles.length > 0) {
            const videoSrcs = []
            for (let file of videoFiles) {
                const blobUrl = await getSafeBlobUrl(file)
                const ext = file.name.split('.').pop().toLowerCase()
                videoSrcs.push({
                    path: [blobUrl],
                    name: file.name,
                    type: ext,
                })
            }
            await this.addVideoNode(videoSrcs)
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
