import { spineNode } from './SpineNode'
import { imgNode } from './ImgNode'
import { live2dNode } from './Live2dNode'
import { textNode } from './TextNode'
import { videoNode } from './VideoNode'
import { animatedSpriteNode } from './AnimatedSpriteNode'
import { blobRegistry } from '@/services/resources/BlobRegistry'

export class SceneResourceManager {
    constructor() {
        this.nodes = [];
    }

    async load(src, options = {}) {
        let ext = "";
        let srcStr = "";
        if (typeof src === 'string') {
            srcStr = src;
            ext = src.split('?')[0].split('.').pop().toLowerCase();
        } else if (src && typeof src === 'object') {
            srcStr = src.path && src.path[0] ? src.path[0] : "";
            ext = src.type || (srcStr ? srcStr.split('?')[0].split('.').pop().toLowerCase() : "");
        }

        let nodeInstance = null;

        if (ext === 'text' || options.type === 'text') {
            nodeInstance = new textNode(src, options);
        } else if (ext === 'animatedSprite' || options.type === 'animatedSprite') {
            nodeInstance = new animatedSpriteNode(options.textures, options.sourceType, options.extraInfo);
        } else if (ext === 'video' || options.type === 'video' || ['mp4', 'webm', 'ogg'].includes(ext)) {
            nodeInstance = new videoNode(src, options);
        } else if (ext === 'live2d' || srcStr.includes('.model3.json') || srcStr.includes('.model.json') || (ext === 'json' && srcStr.includes('model'))) {
            const finalSrc = (src && typeof src === 'object' && src.path && src.path[0]) ? src.path[0] : src;
            nodeInstance = new live2dNode(finalSrc, options);
        } else if (ext === 'skel' || ext === 'json' || srcStr.includes('.spine-json')) {
            const alphaMode = options.alphaMode !== undefined ? options.alphaMode : 3;
            nodeInstance = new spineNode(src, alphaMode);
        } else if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'webg'].includes(ext)) {
            nodeInstance = new imgNode(src);
        } else {
            console.warn(`Unknown resource extension: ${ext}, falling back to Image loader`);
            nodeInstance = new imgNode(src);
        }

        const pixiNode = await nodeInstance;
        if (pixiNode) {
            this.nodes.push(nodeInstance);
        }
        return pixiNode;
    }

    remove(pixiNode) {
        const index = this.nodes.findIndex(n => n.node === pixiNode);
        if (index !== -1) {
            const nodeInstance = this.nodes[index];
            nodeInstance.destroy();
            this.nodes.splice(index, 1);
        }
    }

    clear() {
        this.nodes.forEach(n => n.destroy());
        this.nodes = [];
        blobRegistry.revokeAll();
    }
}
export const sceneResourceManager = new SceneResourceManager();