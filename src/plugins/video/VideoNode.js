import { useUIStore } from '@/stores/uiStore'
import { node } from '@/fennec-view/nodes/BaseNode'

const VideoResourceClass =
    typeof PIXI !== 'undefined' ? PIXI.VideoResource || (PIXI.resources && PIXI.resources.VideoResource) : null
if (VideoResourceClass) {
    const originalOnCanPlay = VideoResourceClass.prototype._onCanPlay
    const originalOnPlayStart = VideoResourceClass.prototype._onPlayStart

    let inOnCanPlay = false
    let inOnPlayStart = false

    if (originalOnCanPlay && !originalOnCanPlay.__patched) {
        VideoResourceClass.prototype._onCanPlay = function (...args) {
            if (inOnCanPlay) return
            inOnCanPlay = true
            try {
                return originalOnCanPlay.apply(this, args)
            } finally {
                inOnCanPlay = false
            }
        }
        VideoResourceClass.prototype._onCanPlay.__patched = true
    }

    if (originalOnPlayStart && !originalOnPlayStart.__patched) {
        VideoResourceClass.prototype._onPlayStart = function (...args) {
            if (inOnPlayStart) return
            inOnPlayStart = true
            try {
                return originalOnPlayStart.apply(this, args)
            } finally {
                inOnPlayStart = false
            }
        }
        VideoResourceClass.prototype._onPlayStart.__patched = true
    }
}

export class videoNode extends node {
    static exposedAttributes = ['node']
    type = 'video'
    constructor(src, options = {}) {
        super()
        return this.start(src, options)
    }
    async start(src, options = {}) {
        try {
            let url = ''
            if (typeof src === 'string') {
                url = src
            } else if (src && typeof src === 'object') {
                url = src.path && src.path[0] ? src.path[0] : ''
            }

            const texture = await PIXI.Assets.load({
                src: url,
                loadParser: 'loadVideo',
                data: {
                    parser: 'video',
                    autoPlay: options.autoplay !== undefined ? options.autoplay : true,
                    autoLoad: true,
                    muted: options.muted !== undefined ? options.muted : false,
                    loop: options.loop !== undefined ? options.loop : true,
                },
            })

            const source = texture.source
            if (source && source.resource) {
                source.resource.crossOrigin = 'anonymous'
                source.resource.playsInline = true
                source.resource.volume = options.volume !== undefined ? options.volume : 1.0
            }

            const pixiNode = new PIXI.Sprite(texture)
            pixiNode.name =
                src && typeof src === 'object' && src.name ? src.name : url.replace(/\\/g, '/').replace(/.*\//g, '')
            pixiNode.url = url.replace(/\\/g, '/')
            pixiNode.position.set(0, 0)

            this.setNode(pixiNode)

            pixiNode._videoLoop = options.loop !== undefined ? options.loop : true
            pixiNode._videoMuted = options.muted !== undefined ? options.muted : false
            pixiNode._videoVolume = options.volume !== undefined ? options.volume : 1.0
            pixiNode._videoPlaying = options.autoplay !== undefined ? options.autoplay : true

            const border = new PIXI.Graphics()
            border.visible = false
            pixiNode.addChild(border)

            pixiNode.setDebug = (state = false) => {
                const uiStore = useUIStore()
                border
                    .clear()
                    .rect(0, 0, pixiNode.texture.width, pixiNode.texture.height)
                    .stroke({ width: 4, color: 0xff0000 })
                border.visible = state && uiStore.debug.enabled
            }

            return pixiNode
        } catch (err) {
            console.error('加载视频异常:', err)
        }
    }

    getVideoElement() {
        const sprite = this.node
        if (sprite && sprite.texture && sprite.texture.source) {
            return sprite.texture.source.resource
        }
        return null
    }

    getAttributes() {
        let sprite = this.node
        let base = this.getBaseAttributes()
        let attributes = base.attributes

        const videoEl = this.getVideoElement()
        if (videoEl) {
            sprite._videoLoop = videoEl.loop
            sprite._videoMuted = videoEl.muted
            sprite._videoVolume = videoEl.volume
            sprite._videoPlaying = !videoEl.paused
        }

        attributes.width = sprite.width
        attributes.height = sprite.height
        attributes.videoLoop = sprite._videoLoop
        attributes.videoMuted = sprite._videoMuted
        attributes.videoVolume = sprite._videoVolume
        attributes.videoPlaying = sprite._videoPlaying

        return {
            attributes,
            schema: {},
        }
    }

    getSerializableState() {
        let state = super.getSerializableState()
        if (!state) return null
        let sprite = this.node
        state.type = 'video'

        const videoEl = this.getVideoElement()
        if (videoEl) {
            sprite._videoLoop = videoEl.loop
            sprite._videoMuted = videoEl.muted
            sprite._videoVolume = videoEl.volume
            sprite._videoPlaying = !videoEl.paused
        }

        state.videoLoop = sprite._videoLoop
        state.videoMuted = sprite._videoMuted
        state.videoVolume = sprite._videoVolume
        state.videoPlaying = sprite._videoPlaying
        return state;
    }

    setVideoLoop(t) {
        if (this.node) {
            const val = t === 'true' || t === true;
            this.node._videoLoop = val;
            const videoEl = this.getVideoElement();
            if (videoEl) videoEl.loop = val;
        }
    }
    setVideoMuted(t) {
        if (this.node) {
            const val = t === 'true' || t === true;
            this.node._videoMuted = val;
            const videoEl = this.getVideoElement();
            if (videoEl) videoEl.muted = val;
        }
    }
    setVideoVolume(t) {
        if (this.node) {
            const val = parseFloat(t);
            this.node._videoVolume = val;
            const videoEl = this.getVideoElement();
            if (videoEl) videoEl.volume = val;
        }
    }
    setVideoPlaying(t) {
        if (this.node) {
            const val = t === 'true' || t === true;
            this.node._videoPlaying = val;
            const videoEl = this.getVideoElement();
            if (videoEl) {
                if (val) videoEl.play();
                else videoEl.pause();
            }
        }
    }

    destroy() {
        const videoEl = this.getVideoElement()
        if (videoEl) {
            try {
                videoEl.pause()
                videoEl.src = ''
                videoEl.load()
            } catch (e) {
                console.warn('Failed to stop video playback during destroy:', e)
            }
        }
        super.destroy()
    }
}
