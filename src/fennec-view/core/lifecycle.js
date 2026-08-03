import { createFennecViewCanvas } from '../FennecViewCanvas'
import { isElectron } from '@/assets/gkd-js-0.2/env.js'
import axios from 'axios'
import { useUIStore } from '@/stores/uiStore'
import { nodeRegistry } from '@/fennec-view/core/NodeRegistry'
const PIXI = window.PIXI

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
        for (let i = 0; i < nodes.length; i++) {
            let nodeConfig = nodes[i]
            const def = nodeRegistry.get(nodeConfig.type);
            if (def && def.previewLoader) {
                try {
                    await def.previewLoader.call(t, nodeConfig, mCacheNode);
                } catch (loadErr) {
                    console.error(`Error loading preview node of type ${nodeConfig.type}:`, loadErr);
                }
            } else {
                console.warn(`No preview loader found for node type: ${nodeConfig.type}`);
            }
        }
        setTimeout(() => {
            for (let j = 0; j < mCacheNode.length; j++) {
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

            // Mobile Touch Gestures (Pinch to Zoom & Two-Finger Pan)
            let touchState = {
                lastX: 0,
                lastY: 0,
                lastDistance: 0,
                isTwoFinger: false,
            }

            app.canvas.addEventListener(
                'touchstart',
                (e) => {
                    if (e.touches.length === 2) {
                        e.preventDefault()
                        touchState.isTwoFinger = true

                        const t1 = e.touches[0]
                        const t2 = e.touches[1]
                        touchState.lastX = (t1.clientX + t2.clientX) / 2
                        touchState.lastY = (t1.clientY + t2.clientY) / 2

                        const dx = t1.clientX - t2.clientX
                        const dy = t1.clientY - t2.clientY
                        touchState.lastDistance = Math.sqrt(dx * dx + dy * dy)
                    } else {
                        touchState.isTwoFinger = false
                    }
                },
                { passive: false },
            )

            app.canvas.addEventListener(
                'touchmove',
                (e) => {
                    if (e.touches.length === 2 && touchState.isTwoFinger) {
                        e.preventDefault()

                        const t1 = e.touches[0]
                        const t2 = e.touches[1]

                        const midX = (t1.clientX + t2.clientX) / 2
                        const midY = (t1.clientY + t2.clientY) / 2
                        const deltaX = midX - touchState.lastX
                        const deltaY = midY - touchState.lastY

                        const dx = t1.clientX - t2.clientX
                        const dy = t1.clientY - t2.clientY
                        const distance = Math.sqrt(dx * dx + dy * dy)
                        let scaleRatio = 1
                        if (touchState.lastDistance > 0) {
                            scaleRatio = distance / touchState.lastDistance
                        }

                        const world = canvas.world
                        const oldScale = world.scale.x
                        let newScale = oldScale * scaleRatio
                        newScale = Math.max(0.1, Math.min(3.0, newScale))

                        const rect = app.canvas.getBoundingClientRect()
                        const zoomClientX = midX - rect.left
                        const zoomClientY = midY - rect.top

                        const localPos = world.worldTransform.applyInverse({ x: zoomClientX, y: zoomClientY })

                        world.scale.set(newScale)

                        const scaleStep = newScale - oldScale
                        world.x += deltaX - localPos.x * scaleStep
                        world.y += deltaY - localPos.y * scaleStep

                        touchState.lastX = midX
                        touchState.lastY = midY
                        touchState.lastDistance = distance

                        this.updateScale()
                        uiStore.updateScale(newScale)
                        uiStore.updateWorldPosition(world.x, world.y)
                    }
                },
                { passive: false },
            )

            app.canvas.addEventListener(
                'touchend',
                (e) => {
                    if (e.touches.length < 2) {
                        touchState.isTwoFinger = false
                    }
                },
                { passive: false },
            )

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
