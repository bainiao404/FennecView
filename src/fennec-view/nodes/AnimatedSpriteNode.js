import { useUIStore } from '@/stores/uiStore'
import { node } from './BaseNode'

export class animatedSpriteNode extends node {
    static exposedAttributes = ["node", "animationSpeed", "loop", "playing"];
    type = "animatedSprite";
    
    constructor(textures, sourceType, extraInfo = {}) {
        super();
        this.textures = textures;
        this.sourceType = sourceType; // 'spritesheet' or 'grid' or 'images'
        this.extraInfo = extraInfo; // originalJson, imageSrc, imageName, jsonName, imagesInfo, rows, cols
        this._frameDuration = 100;
        return this.start(textures);
    }
    
    async start(textures) {
        try {
            const frameObjects = textures.map(t => ({ texture: t, time: this._frameDuration }));
            const node = new PIXI.AnimatedSprite(frameObjects);
            node.name = this.extraInfo.name || "AnimatedSprite";
            node.position.set(0, 0);
            node.loop = true;
            node.play();
            
            this.setNode(node);
            
            const border = new PIXI.Graphics()
                .rect(0, 0, node.width, node.height)
                .stroke({ width: 4, color: 0xff0000 });
            border.visible = false;
            node.addChild(border);
            
            node.setDebug = function (state = false) {
                const uiStore = useUIStore();
                border.visible = state && uiStore.debug.enabled;
            };
            
            return node;
        } catch (err) {
            console.error("加载动画精灵异常:", err);
        }
    }
    
    get animationSpeed() {
        return this._frameDuration;
    }
    
    set animationSpeed(val) {
        this._frameDuration = val;
        if (this.node && this.textures) {
            const frameObjects = this.textures.map(t => ({ texture: t.texture || t, time: val }));
            const wasPlaying = this.node.playing;
            this.node.textures = frameObjects;
            if (wasPlaying) {
                this.node.play();
            }
        }
    }
    
    get loop() {
        return this.node ? this.node.loop : true;
    }
    
    set loop(val) {
        if (this.node) this.node.loop = val;
    }
    
    get playing() {
        return this.node ? this.node.playing : false;
    }
    
    set playing(val) {
        if (this.node) {
            if (val) this.node.play();
            else this.node.stop();
        }
    }
    
    get paused() {
        return !this.playing;
    }
    
    set paused(val) {
        this.playing = !val;
    }
    
    getAttributes() {
        let node = this.node;
        if (!node) return { attributes: {} };
        let { attributes } = this.getBaseAttributes();
        attributes.width = node.width;
        attributes.height = node.height;
        attributes.animationSpeed = this.animationSpeed;
        attributes.animationLoop = this.loop;
        attributes.animationPlaying = this.playing;
        return { attributes };
    }
    
    getSerializableState() {
        let state = super.getSerializableState();
        if (!state) return null;
        state.type = 'animatedSprite';
        state.sourceType = this.sourceType;
        state.animationSpeed = this.animationSpeed;
        state.loop = this.loop;
        state.playing = this.playing;
        
        // Save serialization properties
        state.imageName = this.extraInfo.imageName || "";
        state.imageSrc = this.extraInfo.imageSrc || "";
        
        if (this.sourceType === 'spritesheet') {
            state.jsonName = this.extraInfo.jsonName || "";
            state.originalJson = this.extraInfo.originalJson || null;
        } else if (this.sourceType === 'grid') {
            state.rows = this.extraInfo.rows;
            state.cols = this.extraInfo.cols;
        } else if (this.sourceType === 'images') {
            state.imagesInfo = this.extraInfo.imagesInfo || [];
        }
        
        return state;
    }
}
