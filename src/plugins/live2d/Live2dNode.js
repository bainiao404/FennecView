import { useUIStore } from '@/stores/uiStore'
import { node } from '@/fennec-view/nodes/BaseNode'
import FennecView from '@/fennec-view/FennecView'
import { toTitleCase } from '@/utils/baseScript'

import { registerLive2DMiddleware } from './Live2dMiddleware'
import { 
    setParameterValue, 
    setPartOpacity,
    setLive2dParameter,
    setLive2dParameterState,
    setLive2dPart,
    setLive2dPartState,
    resetLive2dParameters,
    resetLive2dParts
} from './Live2dParameterSetter'
import {
    extractLive2DAnimations,
    extractLive2DSkins,
    extractLive2DParameters,
    extractLive2DParts,
    syncLive2DParametersAndParts
} from './Live2dExtractor'
import { updateLive2DTracking } from './Live2dTracking'

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
        this.transitionMode = 'loop'
        this.live2dFadeIn = 0.1
        this.live2dFadeOut = 0.1

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

        const animations = extractLive2DAnimations(node)
        const skins = extractLive2DSkins(node)
        const live2dParameters = extractLive2DParameters(node, this._live2DParameters)
        
        if (!this._live2DParts) this._live2DParts = {}
        const live2dParts = extractLive2DParts(node, this._live2DParts)

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
            updateLive2DTracking(
                this.node.internalModel.coreModel,
                this._trackingState,
                uiStore.canvasDisplay.canvasPosition,
                this.node.getGlobalPosition(),
                app.screen.width,
                app.screen.height
            )
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
            }
        }
        return 0
    }
    setLive2dTransitionMode(t) {
        this.transitionMode = t
    }
    setLive2dFadeIn(t) {
        this.live2dFadeIn = parseFloat(t)
    }
    setLive2dFadeOut(t) {
        this.live2dFadeOut = parseFloat(t)
    }
    setLive2dTracking(t) {
        this.live2dTracking = !!t
    }
    setLive2dParameter(t) {
        if (!this._live2DParameters) {
            this._live2DParameters = {}
        }
        setLive2dParameter(this._live2DParameters, t)
    }
    setLive2dParameterState(t) {
        if (!this._live2DParameters) {
            this._live2DParameters = {}
        }
        setLive2dParameterState(this._live2DParameters, t)
    }
    setLive2dPart(t) {
        if (!this._live2DParts) {
            this._live2DParts = {}
        }
        setLive2dPart(this._live2DParts, t)
    }
    setLive2dPartState(t) {
        if (!this._live2DParts) {
            this._live2DParts = {}
        }
        setLive2dPartState(this._live2DParts, t)
    }
    setResetLive2dParameters(t) {
        this._live2DParameters = {}
        resetLive2dParameters(this.node, this._live2DParameters, t)
    }
    setResetLive2dParts(t) {
        this._live2DParts = {}
        resetLive2dParts(this.node, this._live2DParts, t)
    }

    syncLive2DParametersAndParts(parametersList, partsList) {
        if (this._isDestroyed) return
        syncLive2DParametersAndParts(this.node, parametersList, partsList)
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
