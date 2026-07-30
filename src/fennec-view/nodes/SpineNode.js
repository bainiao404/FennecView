import FennecView from '../FennecView'
import { useUIStore } from '@/stores/uiStore'
import { node } from './BaseNode'
import SimpleSpine from 'simple-pixi-spine'

export class spineNode extends node {
    static exposedAttributes = ['node']
    type = 'spine'
    constructor(src, alphaMode = 3) {
        super()
        return this.start(src, alphaMode)
    }
    async start(src, alphaMode) {
        let spineData = await SimpleSpine.load(src)
        console.log(alphaMode)
        switch (alphaMode) {
            case 0:
                spineData.setPremultiplied(0)
                break
            case 1:
                spineData.setPremultiplied(1)
                break
            case 2:
                spineData.setPremultiplied(2)
                break
            case 3:
                spineData.setPremultiplied()
                break
        }
        let node = SimpleSpine.spine(spineData).spine
        const fennecView = FennecView
        if (fennecView && fennecView.debug && fennecView.debug.examples) {
            if (spineData.version == 42) {
                node.myDebug = fennecView.debug.examples.spine42
            } else {
                node.myDebug = fennecView.debug.examples.spine
            }
        } else {
            node.myDebug = null
        }
        node.setDebug = function (state) {
            const uiStore = useUIStore()
            this.debug = state && uiStore.debug.enabled && this.myDebug ? this.myDebug : null
        }
        node.spineData = spineData
        node.spineAtlas = spineData.atlas
        node.url = spineData.info.path[0]
        node.name = spineData.info.path[0].replace(/\\/g, '/').replace(/.*\//g, '')
        this.setNode(node)

        let skinName = node.state.data.skeletonData.skins[0].name
        if (node.state.data.skeletonData.skins.length > 1) {
            skinName = node.state.data.skeletonData.skins[1].name
        }
        this.setSkin(skinName)

        let animations = node.state.data.skeletonData.animations
        let animationName = animations[0].name
        for (var i = 0; i < animations.length; i++) {
            let e = animations[i]
            if (e.name.startsWith('Idle') || e.name.startsWith('idle')) {
                animationName = e.name
                break
            }
        }
        this.setAnimation(animationName)
        return node
    }
    get paused() {
        return this.node && this.node.state ? this.node.state.timeScale === 0 : false
    }
    set paused(val) {
        if (this.node && this.node.state) {
            this.node.state.timeScale = val ? 0 : 1
        }
    }
    getAttributes() {
        let node = this.node
        let attributes = this.getBaseAttributes()
        let animations = []
        let skins = []
        let slots = []
        let attachments = []
        if (node.skeleton) {
            animations = node.state.data.skeletonData.animations
            skins = node.state.data.skeletonData.skins
            slots = node.skeleton.slots
            attachments = node.skeleton.skin.attachments
            let spineInfo = null
            if (node.spineData.originalSpine && node.spineData.originalSpine.skeleton) {
                spineInfo = node.spineData.originalSpine.skeleton
            } else {
                spineInfo = node.spineData.spine || node.spineData
            }
            let info = ['version', 'fps', 'width', 'height']
            for (var i = 0; i < info.length; i++) {
                let value = spineInfo[info[i]]
                if (i == 0 && !value) {
                    value = spineInfo['spine']
                }
                if (value && typeof value === 'number') {
                    value = value.toFixed(2)
                }
                attributes['spine' + toTitleCase(info[i])] = value
            }
        }
        return {
            attributes,
            animations,
            skins,
            slots,
            attachments,
        }
    }
    getSerializableState() {
        let state = super.getSerializableState()
        if (!state) return null
        let node = this.node
        state.type = 'spine'
        state.isPremultiplied = node.spineData ? node.spineData.isPremultiplied : false
        state.textureMode = node.spineData ? node.spineData.textureMode : 0
        state.hasOriginalSpine = !!(node.spineData && node.spineData.originalSpine)
        state.activeAnimationName = node.state?.tracks?.[0]?.animation?.name || ''
        state.activeSkinName = node.skeleton?.skin?.name || ''
        return state
    }
    setSkin(skinName) {
        let node = this.node
        let skeleton = node.skeleton
        if (node.state.data.skeletonData.findSkin(skinName)) {
            skeleton.setSkin(null)
            skeleton.setSkinByName(skinName)
            skeleton.setSlotsToSetupPose()
        }
    }
    setAnimation(animName) {
        let node = this.node
        if (node.state.data.skeletonData.findAnimation(animName)) {
            node.state.setAnimation(0, animName, true)
        }
    }
    setAttachment(slotName, attachmentName) {
        let node = this.node
        if (attachmentName) {
            node.skeleton.setAttachment(slotName, attachmentName)
        } else {
            let slot = node.skeleton.findSlot(slotName)
            slot.attachment = null
        }
    }
}
