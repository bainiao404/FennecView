import { useUIStore } from '@/stores/uiStore'
import { node } from './BaseNode'
import FennecView from '../FennecView'
import { toTitleCase } from '@/utils/baseScript'

let isLive2DMiddlewareRegistered = false

function registerLive2DMiddleware() {
    if (isLive2DMiddlewareRegistered) return
    if (
        typeof PIXI !== 'undefined' &&
        PIXI.live2d &&
        PIXI.live2d.Live2DFactory &&
        PIXI.live2d.Live2DFactory.live2DModelMiddlewares
    ) {
        isLive2DMiddlewareRegistered = true

        function patchSettings(settings) {
            if (!settings || settings._patchedResolveURL) return
            settings._patchedResolveURL = true
            const originalResolve = settings.resolveURL
            if (typeof originalResolve === 'function') {
                settings.resolveURL = function (path) {
                    if (
                        typeof path === 'string' &&
                        (path.startsWith('blob:') ||
                            path.startsWith('data:') ||
                            path.startsWith('http:') ||
                            path.startsWith('https:'))
                    ) {
                        return path
                    }
                    return originalResolve.call(this, path)
                }
            }
        }

        const patchMiddleware = async (context, next) => {
            if (context.settings) {
                patchSettings(context.settings)
            }
            Object.defineProperty(context, 'settings', {
                get() {
                    return this._settingsVal
                },
                set(val) {
                    this._settingsVal = val
                    if (val) {
                        patchSettings(val)
                    }
                },
                configurable: true,
                enumerable: true,
            })
            await next()
        }

        PIXI.live2d.Live2DFactory.live2DModelMiddlewares.unshift(patchMiddleware)
    }
}

function setParameterValue(coreModel, name, value) {
    if (!coreModel) return false
    // 1. Try Cubism 4/5
    const params = coreModel._model?.parameters
    if (params && params.ids) {
        let idx = params.ids.indexOf(name)
        if (idx === -1) {
            const lowerName = name.toLowerCase()
            idx = params.ids.findIndex(id => id.toLowerCase() === lowerName)
        }
        if (idx !== -1) {
            if (typeof coreModel.setParameterValueByIndex === 'function') {
                coreModel.setParameterValueByIndex(idx, value)
            } else if (params.values) {
                params.values[idx] = value
            }
            return true
        }
    }
    // 2. Try Cubism 2
    if (coreModel._parameterIds) {
        let idx = coreModel._parameterIds.indexOf(name)
        if (idx === -1) {
            const lowerName = name.toLowerCase()
            idx = coreModel._parameterIds.findIndex(id => id.toLowerCase() === lowerName)
        }
        if (idx !== -1) {
            if (typeof coreModel.setParameterValueByIndex === 'function') {
                coreModel.setParameterValueByIndex(idx, value)
            } else if (coreModel._parameterValues) {
                coreModel._parameterValues[idx] = value
            }
            return true
        }
    }
    // 3. Fallback
    if (typeof coreModel.setParameterValueById === 'function') {
        coreModel.setParameterValueById(name, value)
        return true
    }
    return false
}

function setPartOpacity(coreModel, name, value) {
    if (!coreModel) return false
    // 1. Try Cubism 4/5
    const parts = coreModel._model?.parts
    if (parts && parts.ids) {
        let idx = parts.ids.indexOf(name)
        if (idx === -1) {
            const lowerName = name.toLowerCase()
            idx = parts.ids.findIndex(id => id.toLowerCase() === lowerName)
        }
        if (idx !== -1) {
            if (typeof coreModel.setPartOpacityByIndex === 'function') {
                coreModel.setPartOpacityByIndex(idx, value)
            } else if (parts.opacities) {
                parts.opacities[idx] = value
            }
            return true
        }
    }
    // 2. Try Cubism 2
    if (coreModel._partIds) {
        let idx = coreModel._partIds.indexOf(name)
        if (idx === -1) {
            const lowerName = name.toLowerCase()
            idx = coreModel._partIds.findIndex(id => id.toLowerCase() === lowerName)
        }
        if (idx !== -1) {
            if (typeof coreModel.setPartOpacityByIndex === 'function') {
                coreModel.setPartOpacityByIndex(idx, value)
            } else if (coreModel._partOpacities) {
                coreModel._partOpacities[idx] = value
            }
            return true
        }
    }
    // 3. Fallback
    if (typeof coreModel.setPartOpacityById === 'function') {
        coreModel.setPartOpacityById(name, value)
        return true
    }
    return false
}

export class live2dNode extends node {
    static exposedAttributes = ['node']
    type = 'live2d'

    constructor(src, options = { scale: 1, pivot: 'center' }) {
        registerLive2DMiddleware()
        super()
        this._isDestroyed = false
        this._live2dIdleIndex = 0
        this._nextMotionTimer = null
        this._idleTimer = null
        this._live2DParameters = {
            ParamAngleX: { state: true, value: 0, targetValue: 0, transitionSpeed: 0.1 },
            ParamAngleY: { state: true, value: 0, targetValue: 0, transitionSpeed: 0.1 },
            ParamAngleZ: { state: true, value: 0, targetValue: 0, transitionSpeed: 0.1 },
        }
        this.live2dTracking = false
        this._trackingState = {
            current: {
                headX: 0,
                headY: 0,
                headZ: 0,
                bodyX: 0,
                bodyY: 0,
                bodyZ: 0,
                eyeX: 0,
                eyeY: 0,
            },
        }
        this._paused = false
        this.activeAnimationName = ''
        this.activeSkinName = ''
        this.transitionMode = 'loop' // 'loop' (线性循环), 'idle' (播放一次后回到待机), 'once' (播放一次后停止)
        this.live2dFadeIn = 0.1 // 淡入时间
        this.live2dFadeOut = 0.1 // 淡出时间

        if (options && options.live2dTracking !== undefined) {
            this.live2dTracking = options.live2dTracking
        }

        return this.start(src, options)
    }

    async start(src, options) {
        try {
            const model = await PIXI.live2d.Live2DModel.from(src, {
                motionPreload: PIXI.live2d.MotionPreloadStrategy.ALL,
                autoInteract: false,
                idleMotionGroup: 'none',
            })

            if (this._isDestroyed) {
                model.destroy()
                return
            }

            model.name = src.replace(/\\/g, '/').replace(/.*\//g, '')
            model.url = src.replace(/\\/g, '/')
            this.setNode(model)

            this._handleLive2DMosaics(model)
            this._initLive2DMotion(model)

            if (model.internalModel?.motionManager?.expressionManager) {
                model.expression(0)
                const definitions = model.internalModel.motionManager.expressionManager.definitions
                if (definitions && definitions[0]) {
                    this.activeSkinName = definitions[0].Name || definitions[0].File || 'Expr_0'
                }
            }

            if (options.scale) {
                model.scale.set(options.scale)
            }
            if (options.pivot) {
                this.setPivot(options.pivot)
            }

            model.internalModel.on('beforeModelUpdate', () => {
                this.updateLive2DParameters()
            })

            const border = new PIXI.Graphics().rect(0, 0, model.width, model.height).stroke({ width: 4, color: 0x00ff00 })
            border.visible = false
            model.addChild(border)
            model.setDebug = (state = false) => {
                const uiStore = useUIStore()
                border.visible = state && uiStore.debug.enabled
            }

            return model
        } catch (err) {
            console.error('Live2D Load Exception:', err)
        }
    }

    get paused() {
        return this._paused
    }
    set paused(val) {
        this._paused = val
        if (this.node) {
            this.node.autoUpdate = !val
        }
    }

    getAttributes() {
        let node = this.node
        let attributes = this.getBaseAttributes()
        attributes.width = node ? node.width : 0
        attributes.height = node ? node.height : 0

        let animations = []
        if (node && node.internalModel?.motionManager?.definitions) {
            const definitions = node.internalModel.motionManager.definitions
            for (let group in definitions) {
                definitions[group].forEach((motion, index) => {
                    const name = group ? `${group}_${index}` : motion.File
                    let duration = 0
                    const motionGroup = node.internalModel.motionManager.motionGroups[group]?.[index]
                    if (motionGroup) {
                        if (typeof motionGroup.getDuration === 'function') {
                            duration = motionGroup.getDuration()
                        } else if (motionGroup.duration !== undefined) {
                            duration = motionGroup.duration
                        }
                        if (duration > 30) {
                            duration = duration / 1000
                        }
                    }
                    animations.push({
                        name: name,
                        duration: duration || motion.FadeInTime || 0,
                        groupName: group,
                        index: index,
                    })
                })
            }
        }

        let skins = []
        if (node && node.internalModel?.motionManager?.expressionManager?.definitions) {
            const definitions = node.internalModel.motionManager.expressionManager.definitions
            definitions.forEach((expr, index) => {
                skins.push({
                    name: expr.Name || expr.File || `Expr_${index}`,
                    index: index,
                })
            })
        }

        let live2dParameters = []
        if (node && node.internalModel && node.internalModel.coreModel) {
            let coreModel = node.internalModel.coreModel
            let params = coreModel._model?.parameters
            if (params && params.ids && params.values) {
                let ids = params.ids
                let maxs = params.maximumValues
                let mins = params.minimumValues
                let values = params.values
                let defaultVals = params.defaultValues || values
                for (let i = 0; i < ids.length; i++) {
                    let id = ids[i]
                    let currentOverride = this._live2DParameters[id]
                        ? this._live2DParameters[id].targetValue
                        : values[i]
                    let isStateForced = this._live2DParameters[id] ? this._live2DParameters[id].state : false
                    live2dParameters.push({
                        name: id,
                        min: mins[i],
                        max: maxs[i],
                        value: currentOverride,
                        defaultValue: defaultVals[i],
                        state: isStateForced,
                    })
                }
            }
            // Cubism 2 pattern
            else if (
                coreModel._parameterIds &&
                coreModel._parameterMaximumValues &&
                coreModel._parameterMinimumValues &&
                coreModel._parameterValues
            ) {
                let ids = coreModel._parameterIds
                let maxs = coreModel._parameterMaximumValues
                let mins = coreModel._parameterMinimumValues
                let values = coreModel._parameterValues
                let defaultVals = coreModel._parameterDefaultValues || values
                for (let i = 0; i < ids.length; i++) {
                    let currentOverride = this._live2DParameters[ids[i]]
                        ? this._live2DParameters[ids[i]].targetValue
                        : values[i]
                    let isStateForced = this._live2DParameters[ids[i]] ? this._live2DParameters[ids[i]].state : false
                    live2dParameters.push({
                        name: ids[i],
                        min: mins[i],
                        max: maxs[i],
                        value: currentOverride,
                        defaultValue: defaultVals[i],
                        state: isStateForced,
                    })
                }
            }
            // Fallback for Cubism 2 or other versions
            else if (typeof coreModel.getParameterIds === 'function') {
                try {
                    let ids = coreModel.getParameterIds()
                    for (let i = 0; i < ids.length; i++) {
                        let id = ids[i]
                        let val = coreModel.getParameterValueById ? coreModel.getParameterValueById(id) : 0
                        let max = 30 // fallback
                        let min = -30 // fallback
                        let currentOverride = this._live2DParameters[id] ? this._live2DParameters[id].targetValue : val
                        let isStateForced = this._live2DParameters[id] ? this._live2DParameters[id].state : false
                        live2dParameters.push({
                            name: id,
                            min: min,
                            max: max,
                            value: currentOverride,
                            defaultValue: 0,
                            state: isStateForced,
                        })
                    }
                } catch (e) {}
            }
        }

        let live2dParts = []
        if (node && node.internalModel && node.internalModel.coreModel) {
            let coreModel = node.internalModel.coreModel
            let parts = coreModel._model?.parts
            if (parts && parts.ids && parts.opacities) {
                let ids = parts.ids
                let opacities = parts.opacities
                for (let i = 0; i < ids.length; i++) {
                    let id = ids[i]
                    if (!this._live2DParts) this._live2DParts = {}
                    let currentOverride = this._live2DParts[id] ? this._live2DParts[id].targetValue : opacities[i]
                    let isStateForced = this._live2DParts[id] ? this._live2DParts[id].state : false
                    live2dParts.push({
                        name: id,
                        opacity: currentOverride,
                        state: isStateForced,
                    })
                }
            }
            else if (coreModel._partIds && coreModel._partOpacities) {
                let ids = coreModel._partIds
                let opacities = coreModel._partOpacities
                for (let i = 0; i < ids.length; i++) {
                    if (!this._live2DParts) this._live2DParts = {}
                    let currentOverride = this._live2DParts[ids[i]]
                        ? this._live2DParts[ids[i]].targetValue
                        : opacities[i]
                    let isStateForced = this._live2DParts[ids[i]] ? this._live2DParts[ids[i]].state : false
                    live2dParts.push({
                        name: ids[i],
                        opacity: currentOverride,
                        state: isStateForced,
                    })
                }
            } else if (typeof coreModel.getPartIds === 'function') {
                try {
                    let ids = coreModel.getPartIds()
                    for (let i = 0; i < ids.length; i++) {
                        let id = ids[i]
                        let val = coreModel.getPartOpacityById ? coreModel.getPartOpacityById(id) : 1
                        if (!this._live2DParts) this._live2DParts = {}
                        let currentOverride = this._live2DParts[id] ? this._live2DParts[id].targetValue : val
                        let isStateForced = this._live2DParts[id] ? this._live2DParts[id].state : false
                        live2dParts.push({
                            name: id,
                            opacity: currentOverride,
                            state: isStateForced,
                        })
                    }
                } catch (e) {}
            }
        }

        return {
            attributes,
            animations,
            skins,
            slots: [],
            attachments: [],
            live2dParameters,
            live2dParts,
        }
    }
    getSerializableState() {
        let state = super.getSerializableState()
        if (!state) return null
        state.type = 'live2d'
        state.transitionMode = this.transitionMode || 'loop'
        state.live2dFadeIn = this.live2dFadeIn !== undefined ? this.live2dFadeIn : 0.1
        state.live2dFadeOut = this.live2dFadeOut !== undefined ? this.live2dFadeOut : 0.1
        state.activeAnimationName = this.activeAnimationName || ''
        state.activeSkinName = this.activeSkinName || ''
        state.live2dTracking = !!this.live2dTracking
        return state
    }

    setAnimation(animName) {
        if (!this.node) return

        const definitions = this.node.internalModel.motionManager.definitions
        for (let group in definitions) {
            const index = definitions[group].findIndex((m, idx) => {
                const name = group ? `${group}_${idx}` : m.File
                return name === animName || m.File === animName
            })
            if (index !== -1) {
                this.setLive2DMotion(group, index)
                this.activeAnimationName = animName
                return
            }
        }
    }

    setSkin(exprName) {
        if (!this.node || !this.node.internalModel?.motionManager?.expressionManager) return
        const definitions = this.node.internalModel.motionManager.expressionManager.definitions
        const index = definitions.findIndex((expr, idx) => {
            const name = expr.Name || expr.File || `Expr_${idx}`
            return name === exprName
        })
        if (index !== -1) {
            this.node.expression(index)
            this.activeSkinName = exprName
        }
    }

    updateLive2DParameters() {
        if (this._isDestroyed || !this.node) return

        if (this.live2dTracking && FennecView && FennecView.canvas && FennecView.canvas.app) {
            const app = FennecView.canvas.app
            const uiStore = useUIStore()
            const mousePos = uiStore.canvasDisplay.canvasPosition
            const nodeScreenPos = this.node.getGlobalPosition()

            const mouseX = mousePos.x - nodeScreenPos.x
            const mouseY = mousePos.y - nodeScreenPos.y

            const maxDistanceX = app.screen.width / 2
            const maxDistanceY = app.screen.height / 2

            const ratioX = mouseX / maxDistanceX
            const ratioY = mouseY / maxDistanceY

            const targetHeadX = Math.max(-30, Math.min(30, ratioX * 30))
            const targetHeadY = Math.max(-30, Math.min(30, -ratioY * 30))
            const targetHeadZ = Math.max(-30, Math.min(30, ratioX * 30))
            const targetBodyX = Math.max(-10, Math.min(10, ratioX * 10))
            const targetBodyY = Math.max(-10, Math.min(10, -ratioY * 10))
            const targetEyeX = Math.max(-1, Math.min(1, ratioX))
            const targetEyeY = Math.max(-1, Math.min(1, -ratioY))

            const smoothing = 0.1
            const current = this._trackingState.current
            current.headX += (targetHeadX - current.headX) * smoothing
            current.headY += (targetHeadY - current.headY) * smoothing
            current.headZ += (targetHeadZ - current.headZ) * smoothing
            current.bodyX += (targetBodyX - current.bodyX) * smoothing
            current.bodyY += (targetBodyY - current.bodyY) * smoothing
            current.eyeX += (targetEyeX - current.eyeX) * smoothing
            current.eyeY += (targetEyeY - current.eyeY) * smoothing

            const coreModel = this.node.internalModel.coreModel
            setParameterValue(coreModel, 'ParamAngleX', current.headX)
            setParameterValue(coreModel, 'ParamAngleY', current.headY)
            setParameterValue(coreModel, 'ParamAngleZ', current.headZ)
            setParameterValue(coreModel, 'ParamBodyAngleX', current.bodyX)
            setParameterValue(coreModel, 'ParamBodyAngleY', current.bodyY)
            setParameterValue(coreModel, 'ParamEyeBallX', current.eyeX)
            setParameterValue(coreModel, 'ParamEyeBallY', current.eyeY)
        }

        const coreModel = this.node.internalModel.coreModel
        for (const key in this._live2DParameters) {
            const param = this._live2DParameters[key]
            if (param.state) {
                if (param.value !== param.targetValue) {
                    const diff = param.targetValue - param.value
                    const step = diff * param.transitionSpeed

                    if (Math.abs(diff) < 0.001) {
                        param.value = param.targetValue
                    } else {
                        param.value += step
                    }
                }

                // Only apply these parameters if tracking is not taking over, or if they are different parameters
                if (!this.live2dTracking || (key !== 'ParamAngleX' && key !== 'ParamAngleY' && key !== 'ParamAngleZ')) {
                    setParameterValue(coreModel, key, param.value)
                }
            }
        }

        if (this._live2DParts) {
            for (const key in this._live2DParts) {
                const part = this._live2DParts[key]
                if (part.state) {
                    if (part.value !== part.targetValue) {
                        const diff = part.targetValue - part.value
                        const step = diff * part.transitionSpeed

                        if (Math.abs(diff) < 0.001) {
                            part.value = part.targetValue
                        } else {
                            part.value += step
                        }
                    }

                    setPartOpacity(coreModel, key, part.value)
                }
            }
        }
    }

    setPivot(pivot) {
        if (!this.node) return
        let x = 0
        let y = 0
        if (pivot === 'center') {
            x = this.node.width / 2
            y = this.node.height / 2
        }
        if (Array.isArray(pivot)) {
            x = pivot[0]
            y = pivot[1]
            if (pivot[0] == 'center') {
                x = this.node.width / 2
            }
            if (pivot[1] == 'center') {
                y = this.node.height / 2
            }
        }
        this.node.pivot.set(x, y)
    }

    _handleLive2DMosaics(model) {
        if (!model.internalModel?.coreModel) return
        const coreModel = model.internalModel.coreModel
        const drawableIds = coreModel._drawableIds
        const vertexPositions = coreModel._model?.drawables?.vertexPositions

        if (drawableIds && typeof drawableIds.forEach === 'function' && vertexPositions) {
            drawableIds.forEach((id, index) => {
                if (id && id.includes('mosaic')) {
                    vertexPositions[index] = new Float32Array(vertexPositions[index].length)
                }
            })
            if (typeof coreModel.update === 'function') {
                coreModel.update()
            }
        }
    }

    _initLive2DMotion(model) {
        if (!model.internalModel?.motionManager) return
        model.internalModel.motionManager.on('motionFinish', () => this.onMotionFinish())
        const groupKeys = Object.keys(model.internalModel.motionManager.definitions || {})
        if (groupKeys.length === 0) return

        const groupName = groupKeys[0]
        const definitions = model.internalModel.motionManager.definitions[groupName] || []
        let index = definitions.findIndex(
            (e) => e.File.toLowerCase().includes('idle') || e.File.toLowerCase().includes('wait'),
        )

        this.setLive2DMotion(groupName, index !== -1 ? index : 0, true)
    }

    onMotionFinish() {
        if (this._isDestroyed || !this.node) return
        if (this._idleTimer) clearTimeout(this._idleTimer)
        this._idleTimer = setTimeout(() => {
            if (!this._isDestroyed && this.node) {
                if (this.transitionMode === 'loop') {
                    if (this._currentMotionGroup !== undefined && this._currentMotionIndex !== undefined) {
                        this.setLive2DMotion(this._currentMotionGroup, this._currentMotionIndex)
                    } else {
                        this.node.motion('', this._live2dIdleIndex)
                    }
                } else if (this.transitionMode === 'idle') {
                    this.node.motion('', this._live2dIdleIndex)
                }
                // 'once' mode does nothing on finish (stops on last frame)
            }
        }, 0)
    }

    setLive2DMotion(groupName, userIndex, isIdle = false, userConfig = {}) {
        if (!this.node) return

        if (isIdle) this._live2dIdleIndex = userIndex
        this._currentMotionGroup = groupName
        this._currentMotionIndex = userIndex
        this.activeAnimationName = groupName ? `${groupName}_${userIndex}` : ''
        let modelTask = this.node.motion(groupName, userIndex)

        let fadeIn = this.live2dFadeIn !== undefined ? this.live2dFadeIn : 0.1
        let fadeOut = this.live2dFadeOut !== undefined ? this.live2dFadeOut : 0.1
        if (userConfig && userConfig.fadeInDuration !== undefined) {
            fadeIn = userConfig.fadeInDuration
        }
        if (userConfig && userConfig.fadeOutDuration !== undefined) {
            fadeOut = userConfig.fadeOutDuration
        }

        if (userConfig) {
            const motionManager = this.node.internalModel.motionManager
            const motionGroup = motionManager.motionGroups[groupName]?.[userIndex]

            if (motionGroup) {
                motionGroup._fadeInSeconds = fadeIn
                motionGroup._fadeOutSeconds = fadeOut
            }

            if (userConfig.nextMotion !== undefined) {
                if (this._nextMotionTimer) clearTimeout(this._nextMotionTimer)
                this._nextMotionTimer = setTimeout(() => {
                    this._live2dIdleIndex = userConfig.nextMotion
                }, 400)
            }
        }
        return modelTask
    }

    getActiveAnimationDuration() {
        if (!this.node) return 0
        const motionManager = this.node.internalModel?.motionManager
        if (!motionManager) return 0

        let groupName = this._currentMotionGroup
        let index = this._currentMotionIndex

        if (!groupName || index === undefined || index === -1) {
            const groupKeys = Object.keys(motionManager.definitions || {})
            if (groupKeys.length > 0) {
                groupName = groupKeys[0]
                index = this._live2dIdleIndex || 0
            }
        }

        if (groupName && index !== -1 && index !== undefined) {
            const motionGroup = motionManager.motionGroups[groupName]?.[index]
            if (motionGroup) {
                let duration = 0
                if (typeof motionGroup.getDuration === 'function') {
                    duration = motionGroup.getDuration()
                } else if (motionGroup.duration !== undefined) {
                    duration = motionGroup.duration
                }
                if (duration > 30) {
                    duration = duration / 1000
                }
                return duration
            }
        }
        return 0
    }

    destroy() {
        this._isDestroyed = true
        if (this._nextMotionTimer) clearTimeout(this._nextMotionTimer)
        if (this._idleTimer) clearTimeout(this._idleTimer)

        if (this.node) {
            if (this.node.internalModel?.motionManager) {
                this.node.internalModel.motionManager.off('motionFinish')
            }
            this.node.destroy()
        }
        super.destroy()
    }
}
