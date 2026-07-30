export class PlayNode {
    // === Core Properties ===
    slot = 0
    node = null
    childs = null
    emotion = null
    spine = null
    sprite = null
    live2dModel = null
    filter = null
    animationName = null

    // === Live2D State ===
    _live2dIdleIndex = 0
    _nextMotionTimer = null
    _idleTimer = null
    _isDestroyed = false
    _live2dParameter = {
        ParamAngleX: { state: true, value: 0, targetValue: 0, transitionSpeed: 0.1 },
        ParamAngleY: { state: true, value: 0, targetValue: 0, transitionSpeed: 0.1 },
        ParamAngleZ: { state: true, value: 0, targetValue: 0, transitionSpeed: 0.1 },
    }

    // === Constructor ===
    constructor(name, charm = window.charmAn) {
        // Initialize containers
        this._initializeContainers()

        // Setup bidirectional reference
        this.node.playNode = this

        // Initialize filters
        this._initializeFilters(charm)

        // Set name if provided
        if (name) {
            this.name = name
            this.node.name = name
        }

        // Bind event handlers
        this._onMotionFinish = this._onMotionFinish.bind(this)
    }

    // === Initialization Methods ===
    _initializeContainers() {
        this.node = new PIXI.Container()
        this.childs = new PIXI.Container()
        this.emotion = new PIXI.Container()
        this.node.addChild(this.childs, this.emotion)
    }

    _initializeFilters(charm) {
        this.filter = new PIXI.filters.ColorMatrixFilter()
        this.childs.filters = [this.filter]
        this.filter.brightness(1)
        this.charm = charm
    }

    // === Lifecycle Methods ===
    /**
     * Clean up resources to prevent memory leaks
     */
    destroy() {
        this._isDestroyed = true

        // Clear all timers
        this._clearTimers()

        // Cleanup Live2D model
        this._cleanupLive2D()

        // Destroy PIXI nodes
        this._destroyPixiNodes()

        // Clear references for GC
        this._clearReferences()
    }

    _clearTimers() {
        if (this._nextMotionTimer) clearTimeout(this._nextMotionTimer)
        if (this._idleTimer) clearTimeout(this._idleTimer)
    }

    _cleanupLive2D() {
        if (this.live2dModel?.internalModel?.motionManager) {
            this.live2dModel.internalModel.motionManager.off('motionFinish', this._onMotionFinish)
            this.live2dModel.internalModel.off('beforeModelUpdate', this.live2dTicker, this)
            this.live2dModel.destroy()
        }
    }

    _destroyPixiNodes() {
        if (this.node && !this.node.destroyed) {
            this.node.destroy(true)
        }
    }

    _clearReferences() {
        this.node =
            this.childs =
            this.emotion =
            this.spine =
            this.sprite =
            this.live2dModel =
            this.filter =
            this.charm =
                null
    }

    // === Asset Loading Methods ===
    /**
     * Load Spine animation
     */
    async loadSpine(src) {
        const spineData = await window.SimpleSpine.load(src)

        // Async safety check
        if (this._isDestroyed) return

        // Clean up existing spine
        this._cleanupSpine()

        // Create and add new spine
        this.spine = new PIXI.spine.Spine(spineData.spine)
        this.childs.addChild(this.spine)
        return this.spine
    }

    /**
     * Load Live2D model with options
     */
    async loadLive2D(src, options = { scale: 1, pivot: 'center' }) {
        const model = await PIXI.live2d.Live2DModel.from(src, {
            motionPreload: PIXI.live2d.MotionPreloadStrategy.ALL,
            autoInteract: true,
            idleMotionGroup: 'none',
        })

        // Async safety check
        if (this._isDestroyed) {
            model.destroy()
            return
        }

        // Clean up existing model
        this._cleanupLive2DModel()

        // Setup new model
        this._setupLive2DModel(model, options)
        return model
    }

    /**
     * Load sprite texture
     */
    async loadSprite(path, options = {}) {
        const loadTextureViaImg = (url) => {
            return new Promise((resolve, reject) => {
                const img = new Image()
                img.onload = () => {
                    // 将加载好的 img 转换成 Pixi 纹理，这不会触发 fetch
                    const texture = PIXI.Texture.from(img)
                    resolve(texture)
                }
                img.onerror = reject
                img.src = path // 这里的 path 可以是相对路径或 file:// 路径
            })
        }

        try {
            const texture = await loadTextureViaImg(path)

            if (this._isDestroyed) return

            this._cleanupSprite()

            this.sprite = PIXI.Sprite.from(texture)
            this.childs.addChild(this.sprite)

            if (options.pivot) {
                this.setPivot(
                    options.pivot == 'center'
                        ? { x: texture.width / 2, y: texture.height / 2 }
                        : this._calculatePivot(texture.width, texture.height, options.pivot),
                )
            }
            return this.sprite
        } catch (e) {
            console.error('加载失败:', e)
        }
    }

    _calculatePivot(width, height, pivot) {
        let x = 0
        let y = 0
        if (pivot === 'center') {
            x = width / 2
            y = height / 2
        }
        if (Array.isArray(pivot)) {
            if (pivot[0] == 'center') {
                x = width / 2
            }
            if (pivot[1] == 'center') {
                y = height / 2
            }
        }
        if (typeof pivot === 'object' && pivot !== null) {
            if (pivot.x == 'center') {
                x = width / 2
            }
            if (pivot.y == 'center') {
                y = height / 2
            }
        }
        return { x, y }
    }

    // === Cleanup Helpers ===
    _cleanupSpine() {
        if (this.spine) {
            this.spine.destroy()
            this.childs.removeChild(this.spine)
        }
    }

    _cleanupLive2DModel() {
        if (this.live2dModel) {
            this.live2dModel.destroy()
            this.childs.removeChild(this.live2dModel)
        }
    }

    _cleanupSprite() {
        if (this.sprite) {
            this.sprite.destroy()
            this.childs.removeChild(this.sprite)
        }
    }

    _setupLive2DModel(model, options) {
        this.live2dModel = model
        this.childs.addChild(model)

        // Handle mosaics
        this._handleLive2dMosaics(model)

        // Initialize motion system
        this._initLive2dMotion(model)

        // Set initial expression
        model.expression(0)

        // Apply scale if provided
        if (options.scale) {
            model.scale.set(options.scale)
        }

        // Set pivot if provided
        if (options.pivot) {
            this.setPivot(options.pivot)
        }

        // Bind parameter updates
        model.internalModel.on('beforeModelUpdate', () => {
            this.updateLive2DParameters()
        })
    }

    // === Live2D Methods ===
    /**
     * Update Live2D parameters with smooth transitions
     */
    updateLive2DParameters() {
        if (this._isDestroyed) return

        for (const key in this._live2dParameter) {
            const param = this._live2dParameter[key]
            if (param.state) {
                // Handle smooth transitions
                if (param.value !== param.targetValue) {
                    const diff = param.targetValue - param.value
                    const step = diff * param.transitionSpeed

                    // Direct set if very close
                    if (Math.abs(diff) < 0.001) {
                        param.value = param.targetValue
                    } else {
                        param.value += step
                    }
                }
                this.live2dModel.internalModel.coreModel.setParameterValueById(key, param.value)
            }
        }
    }

    /**
     * Set Live2D parameter with optional transition
     * @param {string} name - Parameter name
     * @param {boolean} state - Whether to enable this parameter
     * @param {number} value - Parameter value
     * @param {number} transitionSpeed - Transition speed (0-1, default 0.05)
     * @param {boolean} immediate - Skip transition and set immediately
     */
    setLive2DParameter(name, state, value = 0, transitionSpeed = 0.05, immediate = false) {
        let param = this._live2dParameter[name]
        if (!param) {
            this._live2dParameter[name] = {
                state: state,
                value: immediate ? value : 0,
                targetValue: value,
                transitionSpeed: transitionSpeed,
            }
        } else {
            param.state = state
            param.targetValue = value
            if (immediate) {
                param.value = value
            } else {
                param.transitionSpeed = transitionSpeed
            }
        }
    }

    /**
     * Reset all Live2D parameters to zero
     */
    resetLive2DParameters() {
        for (const key in this._live2dParameter) {
            this._live2dParameter[key].value = 0
            this._live2dParameter[key].targetValue = 0
        }
    }

    /**
     * Set Live2D parameter immediately (no transition)
     */
    setLive2DParameterImmediate(name, state, value = 0) {
        this.setLive2DParameter(name, state, value, 0.1, true)
    }

    /**
     * Set transition speed for specific Live2D parameter
     */
    setLive2DParameterSpeed(name, speed) {
        if (this._live2dParameter[name]) {
            this._live2dParameter[name].transitionSpeed = Math.max(0.01, Math.min(1, speed))
        }
    }

    _handleLive2dMosaics(model) {
        const coreModel = model.internalModel.coreModel
        const drawableIds = coreModel._drawableIds
        const vertexPositions = coreModel._model.drawables.vertexPositions

        drawableIds.forEach((id, index) => {
            if (id.includes('mosaic')) {
                vertexPositions[index] = new Float32Array(vertexPositions[index].length)
            }
        })
        coreModel.update()
    }

    searchMotionIndex(motionName) {
        if (!this.live2dModel) return -1
        return (
            this.live2dModel.internalModel.motionManager.definitions['']?.findIndex((e) =>
                e.File.includes(motionName),
            ) ?? -1
        )
    }

    _initLive2dMotion(model) {
        // 监听结束回到 idle
        model.internalModel.motionManager.on('motionFinish', this._onMotionFinish)
        const groupName = this.getLive2dAllMotionKeys()[0]
        const definitions = this.getLive2dMotionGroup(groupName)
        let index = definitions.findIndex(
            (e) => e.File.toLowerCase().includes('idle') || e.File.toLowerCase().includes('wait'),
        )

        this.setLive2dMotion(groupName, index !== -1 ? index : 0, true)
    }

    _onMotionFinish() {
        if (this._isDestroyed || !this.live2dModel) return
        // 清理之前的 idle 定时器
        if (this._idleTimer) clearTimeout(this._idleTimer)
        this._idleTimer = setTimeout(() => {
            if (!this._isDestroyed && this.live2dModel) {
                this.live2dModel.motion('', this._live2dIdleIndex)
            }
        }, 0)
    }

    getLive2dMotionGroup(groupName) {
        return this.getLive2dAllMotion()[groupName]
    }

    getLive2dAllMotion() {
        return this.live2dModel.internalModel.motionManager.definitions
    }

    getLive2dAllMotionKeys() {
        return Object.keys(this.getLive2dAllMotion())
    }

    // 提取到类原型的方法，代替原先在 _initLive2dMotion 里的动态声明
    setLive2dMotion(groupName, userIndex, isIdle = false, userConfig = { fadeInDuration: 0.1, fadeOutDuration: 0.1 }) {
        if (!this.live2dModel) return

        if (isIdle) this._live2dIdleIndex = userIndex
        let modelTask = this.live2dModel.motion(groupName, userIndex)

        if (userConfig) {
            const motionManager = this.live2dModel.internalModel.motionManager
            const motionGroup = motionManager.motionGroups[groupName]?.[userIndex]

            if (motionGroup) {
                if (userConfig.fadeInDuration !== undefined) motionGroup._fadeInSeconds = userConfig.fadeInDuration
                if (userConfig.fadeOutDuration !== undefined) motionGroup._fadeOutSeconds = userConfig.fadeOutDuration
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

    // === Animation Methods ===
    /**
     * Animate fade out effect
     */
    animateFadeOut(duration = 0.5) {
        return this.charm?.fadeOut(this.node, duration * 60)
    }

    /**
     * Animate fade in effect
     */
    animateFadeIn(duration = 0.5) {
        return this.charm?.fadeIn(this.node, duration * 60)
    }

    /**
     * Animate scale transformation
     */
    animateScale(x, y, duration) {
        return this.charm?.scale(this.node, x, y, duration * 60)
    }

    /**
     * Animate along path
     */
    animateWalkPath(paths, duration, easingType = 'smoothstep', loop = false) {
        return this.charm?.walkPath(this.node, paths, duration * 60, easingType, loop)
    }

    /**
     * Animate pulse effect
     */
    animatePulse(duration, alpha) {
        return this.charm?.pulse(this.node, duration * 60, alpha)
    }

    // === Spine Control Methods ===
    /**
     * Set Spine skin
     */
    setSpineSkin(skinName) {
        if (!this.spine) return
        this.spine.skeleton.setSkin(null)
        this.spine.skeleton.setSkinByName(skinName)
        this.spine.skeleton.setSlotsToSetupPose()
    }

    /**
     * Set Spine animation
     */
    setSpineAnimation(trackIndex = 0, name, loop = true) {
        if (!this.spine) return
        this.animationName = name
        this.spine.state.setAnimation(trackIndex, name, loop)
    }

    /**
     * Set Spine scale
}

/**
 * Reset all Live2D parameters to zero
 */
    resetLive2DParameters() {
        for (const key in this._live2dParameter) {
            this._live2dParameter[key].value = 0
            this._live2dParameter[key].targetValue = 0
        }
    }

    /**
     * Set Live2D parameter immediately (no transition)
     */
    setLive2DParameterImmediate(name, state, value = 0) {
        this.setLive2DParameter(name, state, value, 0.1, true)
    }

    /**
     * Set transition speed for specific Live2D parameter
     */
    setLive2DParameterSpeed(name, speed) {
        if (this._live2dParameter[name]) {
            this._live2dParameter[name].transitionSpeed = Math.max(0.01, Math.min(1, speed))
        }
    }

    _handleLive2dMosaics(model) {
        const coreModel = model.internalModel.coreModel
        const drawableIds = coreModel._drawableIds
        const vertexPositions = coreModel._model.drawables.vertexPositions

        drawableIds.forEach((id, index) => {
            if (id.includes('mosaic')) {
                vertexPositions[index] = new Float32Array(vertexPositions[index].length)
            }
        })
        coreModel.update()
    }

    searchMotionIndex(motionName) {
        if (!this.live2dModel) return -1
        return (
            this.live2dModel.internalModel.motionManager.definitions['']?.findIndex((e) =>
                e.File.includes(motionName),
            ) ?? -1
        )
    }

    _initLive2dMotion(model) {
        // 监听结束回到 idle
        model.internalModel.motionManager.on('motionFinish', this._onMotionFinish)
        const groupName = this.getLive2dAllMotionKeys()[0]
        const definitions = this.getLive2dMotionGroup(groupName)
        let index = definitions.findIndex(
            (e) => e.File.toLowerCase().includes('idle') || e.File.toLowerCase().includes('wait'),
        )

        this.setLive2dMotion(groupName, index !== -1 ? index : 0, true)
    }

    _onMotionFinish() {
        if (this._isDestroyed || !this.live2dModel) return
        // 清理之前的 idle 定时器
        if (this._idleTimer) clearTimeout(this._idleTimer)
        this._idleTimer = setTimeout(() => {
            if (!this._isDestroyed && this.live2dModel) {
                this.live2dModel.motion('', this._live2dIdleIndex)
            }
        }, 0)
    }

    getLive2dMotionGroup(groupName) {
        return this.getLive2dAllMotion()[groupName]
    }

    getLive2dAllMotion() {
        return this.live2dModel.internalModel.motionManager.definitions
    }

    getLive2dAllMotionKeys() {
        return Object.keys(this.getLive2dAllMotion())
    }

    // 提取到类原型的方法，代替原先在 _initLive2dMotion 里的动态声明
    setLive2dMotion(groupName, userIndex, isIdle = false, userConfig = { fadeInDuration: 0.1, fadeOutDuration: 0.1 }) {
        if (!this.live2dModel) return

        if (isIdle) this._live2dIdleIndex = userIndex
        let modelTask = this.live2dModel.motion(groupName, userIndex)

        if (userConfig) {
            const motionManager = this.live2dModel.internalModel.motionManager
            const motionGroup = motionManager.motionGroups[groupName]?.[userIndex]

            if (motionGroup) {
                if (userConfig.fadeInDuration !== undefined) motionGroup._fadeInSeconds = userConfig.fadeInDuration
                if (userConfig.fadeOutDuration !== undefined) motionGroup._fadeOutSeconds = userConfig.fadeOutDuration
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

    // === Animation Methods ===
    /**
     * Animate fade out effect
     */
    animateFadeOut(duration = 0.5) {
        return this.charm?.fadeOut(this.node, duration * 60)
    }

    /**
     * Animate fade in effect
     */
    animateFadeIn(duration = 0.5) {
        return this.charm?.fadeIn(this.node, duration * 60)
    }

    /**
     * Animate scale transformation
     */
    animateScale(x, y, duration, easingType = 'smoothstep') {
        return this.charm?.scale(this.node, x, y, duration * 60, easingType)
    }

    /**
     * Animate along path
     */
    animateWalkPath(paths, duration, easingType = 'smoothstep', loop = false) {
        return this.charm?.walkPath(this.node, paths, duration * 60, easingType, loop)
    }

    /**
     * Animate pulse effect
     */
    animatePulse(duration, alpha) {
        return this.charm?.pulse(this.node, duration * 60, alpha)
    }

    animateStrobe() {
        return this.charm?.strobe(this.node)
    }

    animateBreathe(endScaleX, endScaleY, duration, yoyo, delayBeforeRepeat) {
        return this.charm?.breathe(this.node, endScaleX, endScaleY, duration * 60, yoyo, delayBeforeRepeat)
    }

    // === Spine Control Methods ===
    /**
     * Set Spine skin
     */
    setSpineSkin(skinName) {
        if (!this.spine) return
        this.spine.skeleton.setSkin(null)
        this.spine.skeleton.setSkinByName(skinName)
        this.spine.skeleton.setSlotsToSetupPose()
    }

    /**
     * Set Spine animation
     */
    setSpineAnimation(trackIndex = 0, name, loop = true) {
        if (!this.spine) return
        this.animationName = name
        this.spine.state.setAnimation(trackIndex, name, loop)
    }

    /**
     * Set Spine scale
     */
    setSpineScale(scale) {
        if (this.spine) this.spine.scale.set(scale)
    }

    // === Property Accessors ===
    get x() {
        return this.node?.x ?? 0
    }
    set x(val) {
        if (this.node) this.node.x = val
    }

    get y() {
        return this.node?.y ?? 0
    }
    set y(val) {
        if (this.node) this.node.y = val
    }
    /**
     * Set pivot point for transformations
     */
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
        if (typeof pivot === 'object' && pivot !== null) {
            x = pivot.x
            y = pivot.y
            if (pivot.x == 'center') {
                x = this.node.width / 2
            }
            if (pivot.y == 'center') {
                y = this.node.height / 2
            }
        }
        this.node.pivot.set(x, y)
    }

    /**
     * Set brightness filter
     */
    setBrightness(value) {
        this.filter?.brightness(value)
    }
}
