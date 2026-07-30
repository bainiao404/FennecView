import { useUIStore } from '@/stores/uiStore'
import { node } from './BaseNode'

// Recursion / stack overflow guard patch for PIXI.VideoResource
const VideoResourceClass = typeof PIXI !== 'undefined' ? (PIXI.VideoResource || (PIXI.resources && PIXI.resources.VideoResource)) : null;
if (VideoResourceClass) {
    const originalOnCanPlay = VideoResourceClass.prototype._onCanPlay;
    const originalOnPlayStart = VideoResourceClass.prototype._onPlayStart;
    
    let inOnCanPlay = false;
    let inOnPlayStart = false;
    
    if (originalOnCanPlay && !originalOnCanPlay.__patched) {
        VideoResourceClass.prototype._onCanPlay = function(...args) {
            if (inOnCanPlay) return;
            inOnCanPlay = true;
            try {
                return originalOnCanPlay.apply(this, args);
            } finally {
                inOnCanPlay = false;
            }
        };
        VideoResourceClass.prototype._onCanPlay.__patched = true;
    }
    
    if (originalOnPlayStart && !originalOnPlayStart.__patched) {
        VideoResourceClass.prototype._onPlayStart = function(...args) {
            if (inOnPlayStart) return;
            inOnPlayStart = true;
            try {
                return originalOnPlayStart.apply(this, args);
            } finally {
                inOnPlayStart = false;
            }
        };
        VideoResourceClass.prototype._onPlayStart.__patched = true;
    }
}

export class videoNode extends node {
    static exposedAttributes = ["node"];
    type = "video";
    constructor(src, options = {}) {
        super();
        return this.start(src, options);
    }
    async start(src, options = {}) {
        try {
            let url = "";
            if (typeof src === 'string') {
                url = src;
            } else if (src && typeof src === 'object') {
                url = (src.path && src.path[0]) ? src.path[0] : "";
            }
            
            // Create video source
            const source = new PIXI.VideoSource({
                src: url,
                autoPlay: options.autoplay !== undefined ? options.autoplay : true,
                autoLoad: true,
                muted: options.muted !== undefined ? options.muted : false,
                loop: options.loop !== undefined ? options.loop : true
            });
            
            if (source.resource) {
                source.resource.crossOrigin = 'anonymous';
                source.resource.playsInline = true;
                source.resource.volume = options.volume !== undefined ? options.volume : 1.0;
            }
            
            const texture = new PIXI.Texture({ source });
            
            const pixiNode = new PIXI.Sprite(texture);
            pixiNode.name = (src && typeof src === 'object' && src.name) ? src.name : url.replace(/\\/g, "/").replace(/.*\//g, "");
            pixiNode.url = url.replace(/\\/g, "/");
            pixiNode.position.set(0, 0);
            
            this.setNode(pixiNode);
            
            // Save properties locally so they can be retrieved/serialized easily
            pixiNode._videoLoop = options.loop !== undefined ? options.loop : true;
            pixiNode._videoMuted = options.muted !== undefined ? options.muted : false;
            pixiNode._videoVolume = options.volume !== undefined ? options.volume : 1.0;
            pixiNode._videoPlaying = options.autoplay !== undefined ? options.autoplay : true;
            
            const border = new PIXI.Graphics();
            border.visible = false;
            pixiNode.addChild(border);
            
            pixiNode.setDebug = (state = false) => {
                const uiStore = useUIStore();
                border.clear()
                    .rect(0, 0, pixiNode.texture.width, pixiNode.texture.height)
                    .stroke({ width: 4, color: 0xff0000 });
                border.visible = state && uiStore.debug.enabled;
            };
            
            return pixiNode;
        } catch (err) {
            console.error("加载视频异常:", err);
        }
    }
    
    getVideoElement() {
        const sprite = this.node;
        if (sprite && sprite.texture && sprite.texture.source) {
            return sprite.texture.source.resource;
        }
        return null;
    }
    
    getAttributes() {
        let sprite = this.node;
        let base = this.getBaseAttributes();
        let attributes = base.attributes;
        
        // Sync with the actual HTML5 video element if it has loaded
        const videoEl = this.getVideoElement();
        if (videoEl) {
            sprite._videoLoop = videoEl.loop;
            sprite._videoMuted = videoEl.muted;
            sprite._videoVolume = videoEl.volume;
            sprite._videoPlaying = !videoEl.paused;
        }
        
        attributes.width = sprite.width;
        attributes.height = sprite.height;
        attributes.videoLoop = sprite._videoLoop;
        attributes.videoMuted = sprite._videoMuted;
        attributes.videoVolume = sprite._videoVolume;
        attributes.videoPlaying = sprite._videoPlaying;
        
        return {
            attributes,
            schema: {}
        };
    }
    
    getSerializableState() {
        let state = super.getSerializableState();
        if (!state) return null;
        let sprite = this.node;
        state.type = 'video';
        
        // Sync properties first
        const videoEl = this.getVideoElement();
        if (videoEl) {
            sprite._videoLoop = videoEl.loop;
            sprite._videoMuted = videoEl.muted;
            sprite._videoVolume = videoEl.volume;
            sprite._videoPlaying = !videoEl.paused;
        }
        
        state.videoLoop = sprite._videoLoop;
        state.videoMuted = sprite._videoMuted;
        state.videoVolume = sprite._videoVolume;
        state.videoPlaying = sprite._videoPlaying;
        return state;
    }
    
    destroy() {
        const videoEl = this.getVideoElement();
        if (videoEl) {
            try {
                videoEl.pause();
                videoEl.src = "";
                videoEl.load();
            } catch (e) {
                console.warn("Failed to stop video playback during destroy:", e);
            }
        }
        super.destroy();
    }
}
