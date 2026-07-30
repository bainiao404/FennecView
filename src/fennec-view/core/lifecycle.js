import { createFennecViewCanvas } from '../FennecViewCanvas'
import { isElectron } from '@/assets/gkd-js-0.2/env.js'
import axios from 'axios'
import { useUIStore } from '@/stores/uiStore'
const PIXI = window.PIXI

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

export default {
    setUI: function (state) {
        const uiStore = useUIStore()
        uiStore.setMainUIVisibility(state)

        // 更新画布元素可见性
        const canvas = this.canvas
        if (canvas) {
            if (canvas.ruler) canvas.ruler.visible = state
            if (canvas.crosshair) canvas.crosshair.visible = state
        }
    },

    start: async function () {
        if (isElectron()) {
            this.appMode = 1
            await this.windowStart()
            return
        }
        if (typeof window !== 'undefined' && window.cordova) {
            this.appMode = 2
            this.cordovaStart()
            return
        }
        await this.webStart()
    },

    webStart: async function () {
        try {
            let config = await axios.get('export/config.json')
            if (config.data && typeof config.data === 'object' && config.data.world) {
                this.preview.config = config.data
                this.previewStart()
                return
            }
            throw new Error('Invalid or missing config.json')
        } catch (error) {
            await this.appStart()
        }
    },

    previewStart: async function () {
        const uiStore = useUIStore()
        uiStore.setPreviewMode()
        this.preview.state = true
        await this.appStart()
        let t = this
        let config = this.preview.config
        let world = this.canvas.world
        let background = this.canvas.background
        if (config.background && config.background.alpha) {
            background.alpha = config.background.alpha
            background.redraw(config.background.color)
        }
        let app = this.canvas.app
        app.ticker.maxFPS = config.fps || 30
        this.setResolution(config.resolution || 1)
        if (config.world) {
            world.scale.set(config.world.scale)
            world.x = config.world.x
            world.y = config.world.y
        }
        if (config.rect) {
            this.adaptWallpaperRect()
        }

        let nodes = config.box.node
        let mCacheNode = []
        for (var i = 0; i < nodes.length; i++) {
            let node = nodes[i]
            switch (node.type) {
                case 'spine': {
                    let alphaMode = node.textureMode !== undefined ? node.textureMode : (node.isPremultiplied ? 2 : 0)
                    let spineNodes = await t.addSpineNode(['export/' + node.path + '/' + node.name], alphaMode)
                    let mNode = spineNodes[0]
                    if (mNode) {
                        if (node.scaleX !== undefined && node.scaleY !== undefined) {
                            mNode.scale.set(node.scaleX, node.scaleY)
                        } else {
                            mNode.scale.set(node.scale)
                        }
                        mNode.x = node.x
                        mNode.y = node.y
                        if (node.rotation !== undefined) mNode.rotation = node.rotation
                        if (node.alpha !== undefined) mNode.alpha = node.alpha
                        t.updateNodeProperty('skin', node.skin)
                        t.updateNodeProperty('animation', node.animation)
                        node.slots.forEach((e) => {
                            t.updateNodeProperty('slotsAlpha', e)
                        })
                        node.slotsAttachment.forEach((e) => {
                            t.updateNodeProperty('attachment', [e.slotName, e.attachmentName])
                        })
                        mCacheNode.push(mNode)
                    }
                    break
                }
                case 'live2d': {
                    let spineNodes = await t.addSpineNode(['export/' + node.path + '/' + node.name])
                    let mNode = spineNodes[0]
                    if (mNode) {
                        if (node.scaleX !== undefined && node.scaleY !== undefined) {
                            mNode.scale.set(node.scaleX, node.scaleY)
                        } else {
                            mNode.scale.set(node.scale)
                        }
                        mNode.x = node.x
                        mNode.y = node.y
                        if (node.rotation !== undefined) mNode.rotation = node.rotation
                        if (node.alpha !== undefined) mNode.alpha = node.alpha
                        if (node.skin) {
                            t.updateNodeProperty('skin', node.skin)
                        }
                        if (node.animation) {
                            t.updateNodeProperty('animation', node.animation)
                        }
                        if (node.transitionMode && mNode.nodeData) {
                            mNode.nodeData.transitionMode = node.transitionMode
                        }
                        if (node.hasOwnProperty('live2dFadeIn') && mNode.nodeData) {
                            mNode.nodeData.live2dFadeIn = node.live2dFadeIn
                        }
                        if (node.hasOwnProperty('live2dFadeOut') && mNode.nodeData) {
                            mNode.nodeData.live2dFadeOut = node.live2dFadeOut
                        }
                        if (node.hasOwnProperty('live2dTracking') && mNode.nodeData) {
                            mNode.nodeData.live2dTracking = node.live2dTracking
                        }
                        if (node.live2dParameters) {
                            node.live2dParameters.forEach((p) => {
                                t.updateNodeProperty('live2dParameter', [p.name, p.value])
                                t.updateNodeProperty('live2dParameterState', [p.name, p.state])
                            })
                        }
                        if (node.live2dParts) {
                            node.live2dParts.forEach((p) => {
                                t.updateNodeProperty('live2dPart', [p.name, p.value])
                                t.updateNodeProperty('live2dPartState', [p.name, p.state])
                            })
                        }
                    }
                    break
                }
                case 'img': {
                    let imgNodes = await t.addImageNode(['export/' + node.path + '/' + node.name])
                    let mNode = imgNodes[0]
                    if (mNode) {
                        if (node.scaleX !== undefined && node.scaleY !== undefined) {
                            mNode.scale.set(node.scaleX, node.scaleY)
                        } else {
                            mNode.scale.set(node.scale)
                        }
                        mNode.x = node.x
                        mNode.y = node.y
                        if (node.rotation !== undefined) mNode.rotation = node.rotation
                        if (node.alpha !== undefined) mNode.alpha = node.alpha
                    }
                    break
                }
                case 'video': {
                    let videoNodes = await t.addVideoNode([{
                        path: ['export/' + node.path + '/' + node.name],
                        name: node.name,
                        type: node.name.split('.').pop().toLowerCase()
                    }])
                    let mNode = videoNodes[0]
                    if (mNode) {
                        if (node.scaleX !== undefined && node.scaleY !== undefined) {
                            mNode.scale.set(node.scaleX, node.scaleY)
                        } else {
                            mNode.scale.set(node.scale)
                        }
                        mNode.x = node.x
                        mNode.y = node.y
                        if (node.rotation !== undefined) mNode.rotation = node.rotation
                        if (node.alpha !== undefined) mNode.alpha = node.alpha
                        
                        mNode._videoLoop = node.videoLoop !== undefined ? node.videoLoop : true
                        mNode._videoMuted = node.videoMuted !== undefined ? node.videoMuted : false
                        mNode._videoVolume = node.videoVolume !== undefined ? node.videoVolume : 1.0
                        mNode._videoPlaying = node.videoPlaying !== undefined ? node.videoPlaying : true
                        
                        const videoEl = mNode.nodeData.getVideoElement()
                        if (videoEl) {
                            videoEl.loop = mNode._videoLoop
                            videoEl.muted = mNode._videoMuted
                            videoEl.volume = mNode._videoVolume
                            if (mNode._videoPlaying) {
                                videoEl.play()
                            } else {
                                videoEl.pause()
                            }
                        }
                    }
                    break
                }
                case 'text': {
                    let textNodes = await t.addTextNode(node.text, {
                        fontFamily: node.fontFamily,
                        fontSize: node.fontSize,
                        fill: node.fill,
                        align: node.align,
                        name: node.name
                    })
                    let mNode = textNodes[0]
                    if (mNode) {
                        if (node.scaleX !== undefined && node.scaleY !== undefined) {
                            mNode.scale.set(node.scaleX, node.scaleY)
                        } else {
                            mNode.scale.set(node.scale)
                        }
                        mNode.x = node.x
                        mNode.y = node.y
                        if (node.rotation !== undefined) mNode.rotation = node.rotation
                        if (node.alpha !== undefined) mNode.alpha = node.alpha
                    }
                    break
                }
                case 'rect': {
                    let rectNodes = await t.addRectNode({
                        width: node.width,
                        height: node.height,
                        fill: node.fill,
                        radius: node.radius,
                        borderWidth: node.borderWidth,
                        borderColor: node.borderColor,
                        name: node.name
                    })
                    let mNode = rectNodes[0]
                    if (mNode) {
                        if (node.scaleX !== undefined && node.scaleY !== undefined) {
                            mNode.scale.set(node.scaleX, node.scaleY)
                        } else {
                            mNode.scale.set(node.scale)
                        }
                        mNode.x = node.x
                        mNode.y = node.y
                        if (node.rotation !== undefined) mNode.rotation = node.rotation
                        if (node.alpha !== undefined) mNode.alpha = node.alpha
                    }
                    break
                }
                case 'animatedSprite': {
                    let textures = []
                    let originalJson = node.originalJson
                    let imageSrc = node.imageSrc
                    if (node.sourceType === 'spritesheet' || node.sourceType === 'grid') {
                        imageSrc = 'export/' + node.path + '/' + node.imageName
                    }
                    let imagesInfo = []
                    
                    if (node.sourceType === 'spritesheet') {
                        const baseTexture = await loadTexture(imageSrc)
                        const spritesheet = new PIXI.Spritesheet(baseTexture, originalJson)
                        await spritesheet.parse()
                        textures = Object.values(spritesheet.textures)
                    } else if (node.sourceType === 'grid') {
                        const baseTexture = await loadTexture(imageSrc)
                        const rows = node.rows
                        const cols = node.cols
                        const frameW = baseTexture.width / cols
                        const frameH = baseTexture.height / rows
                        
                        for (let r = 0; r < rows; r++) {
                            for (let c = 0; c < cols; c++) {
                                const rect = new PIXI.Rectangle(c * frameW, r * frameH, frameW, frameH)
                                const frameTexture = new PIXI.Texture(baseTexture.baseTexture || baseTexture, rect)
                                textures.push(frameTexture)
                            }
                        }
                    } else {
                        // images
                        for (let i = 0; i < node.images.length; i++) {
                            const imgInfo = node.images[i]
                            const imgUrl = 'export/' + node.path + '/' + imgInfo.savedName
                            const texture = await loadTexture(imgUrl)
                            textures.push(texture)
                            imagesInfo.push({
                                name: imgInfo.name,
                                url: imgUrl
                            })
                        }
                    }
                    
                    if (textures.length > 0) {
                        let animatedSpriteNodes = await t.addAnimatedSpriteNode(textures, node.sourceType, {
                            name: node.name,
                            originalJson,
                            imageSrc,
                            jsonName: node.jsonName,
                            imageName: node.imageName,
                            imagesInfo,
                            rows: node.rows,
                            cols: node.cols
                        })
                        let mNode = animatedSpriteNodes[0]
                        if (mNode) {
                            if (node.scaleX !== undefined && node.scaleY !== undefined) {
                                mNode.scale.set(node.scaleX, node.scaleY)
                            } else {
                                mNode.scale.set(node.scale)
                            }
                            mNode.x = node.x
                            mNode.y = node.y
                            if (node.rotation !== undefined) mNode.rotation = node.rotation
                            if (node.alpha !== undefined) mNode.alpha = node.alpha
                            mNode.nodeData.animationSpeed = node.animationSpeed !== undefined ? node.animationSpeed : 1.0
                            mNode.nodeData.loop = node.loop !== undefined ? node.loop : true
                            mNode.nodeData.playing = node.playing !== undefined ? node.playing : true
                        }
                    }
                    break
                }
            }
        }
        setTimeout(() => {
            for (var j = 0; j < mCacheNode.length; j++) {
                if (mCacheNode[j].state && mCacheNode[j].state.tracks && mCacheNode[j].state.tracks[0]) {
                    mCacheNode[j].state.tracks[0].time = 0
                }
            }
        }, 200)
    },

    appStart: async function () {
        let canvas = (this.canvas = createFennecViewCanvas())
        let isNoPreview = !this.preview.state
        const canvasElement = document.getElementById('app_canvas')
        const uiStore = useUIStore()
        await canvas.initialize({
            canvas: {
                width: canvasElement ? canvasElement.offsetWidth : 1280,
                height: canvasElement ? canvasElement.offsetHeight : 720,
                resolution: 1,
                hello: true,
                useContextAlpha: false,
                antialias: uiStore.antialiasEnabled,
            },
            ruler: false,
        })

        let app = canvas.app
        app.ticker.maxFPS = 60

        // 设置背景和容器
        this.canvas = canvas
        app.canvas.style.imageRendering = 'pixelated'
        if (canvasElement) {
            canvasElement.appendChild(app.canvas)
        } else {
            const interval = setInterval(() => {
                const el = document.getElementById('app_canvas')
                if (el) {
                    el.appendChild(app.canvas)
                    clearInterval(interval)
                }
            }, 50)
        }

        uiStore.updateFPS(60)
        uiStore.updateResolution(1)

        app.canvas.addEventListener('mousemove', (e) => {
            uiStore.updateCanvasPosition(e.offsetX, e.offsetY)
        })

        if (isNoPreview) {
            app.ticker.add((delta) => {
                this.process(delta)
            })
            let createOriginCrosshair = canvas.createOriginCrosshair()
            canvas.crosshair = createOriginCrosshair
            canvas.world.addChild(createOriginCrosshair)
            canvas.world.addChildAt(createOriginCrosshair, 0)

            // Set initial world position to the center of the screen
            const centerX = app.screen.width / 2
            const centerY = app.screen.height / 2
            canvas.world.position.set(centerX, centerY)
            uiStore.updateWorldPosition(centerX, centerY)

            app.canvas.addEventListener('wheel', (e) => this.onMouseWheel(e))
            app.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e))

            this.debug.examples.spine = new PIXI.spine.SpineDebugRenderer()
            this.debug.examples.spine42 = new PIXI.spine.spine42.SpineDebugRenderer()

            uiStore.updateDebugStyle({
                lineWidth: 4,
                drawMeshHull: false,
                drawMeshTriangles: false,
                drawBones: true,
                drawPaths: false,
                drawBoundingBoxes: true,
                drawClipping: false,
                drawRegionAttachments: false,
            })
            this.updateScale()
        }
    },

    process: function () {
        if (this.click.current && this.click.current.state && typeof this.click.current.state.getCurrent === 'function') {
            let state = this.click.current.state
            let currentTrackEntry = state.getCurrent(0)
            if (currentTrackEntry) {
                let progress = currentTrackEntry.animationLast / currentTrackEntry.animationEnd
                const uiStore = useUIStore()
                uiStore.updateProgressBar(progress)
            }
        }
    },

    windowStart: async function () {
        if (isElectron()) {
            let pathStr = process.execPath.replace(/\\/g, '/').match(/(.*)\/exe/)
            let path = pathStr ? pathStr[1] : process.cwd()
            this.path.exe = path
            this.path.data = path + '/data/FennecView'
        }
        await this.appStart()
    },

    cordovaStart: function () {
        if (typeof document !== 'undefined') {
            document.addEventListener(
                'deviceready',
                async () => {
                    await this.appStart()
                },
                false,
            )
        } else {
            this.appStart()
        }
    },
}
