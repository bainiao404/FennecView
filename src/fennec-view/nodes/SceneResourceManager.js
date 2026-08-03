import { nodeRegistry } from '../core/NodeRegistry'
import { blobRegistry } from '@/services/resources/BlobRegistry'
import { fileResourceManager } from '@/services/resources/FileResourceManager'

export class SceneResourceManager {
    constructor() {
        this.nodes = [];
    }

    async load(src, options = {}) {
        let ext = "";
        let srcStr = "";
        let resourceId = "";
        if (typeof src === 'string') {
            srcStr = src;
            ext = src.split('?')[0].split('.').pop().toLowerCase();
        } else if (src && typeof src === 'object') {
            srcStr = src.path && src.path[0] ? src.path[0] : "";
            ext = src.type || (srcStr ? srcStr.split('?')[0].split('.').pop().toLowerCase() : "");
            resourceId = src.resourceId || "";
        }

        let nodeType = options.type || ext;
        
        // Map extensions to registered type keys
        if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'webg'].includes(nodeType)) {
            nodeType = 'img';
        } else if (['mp4', 'webm', 'ogg'].includes(nodeType)) {
            nodeType = 'video';
        } else if (['skel', 'json', 'spine-json'].includes(nodeType) && !srcStr.includes('model')) {
            nodeType = 'spine';
        } else if (nodeType === 'live2d' || srcStr.includes('.model3.json') || srcStr.includes('.model.json') || (nodeType === 'json' && srcStr.includes('model'))) {
            nodeType = 'live2d';
        }

        let nodeInstance = null;
        const registryDef = nodeRegistry.get(nodeType);
        if (registryDef && registryDef.create) {
            nodeInstance = registryDef.create(src, options);
        } else {
            console.warn(`Unknown resource type/extension: ${nodeType}, falling back to Image loader`);
            const imgDef = nodeRegistry.get('img');
            if (imgDef && imgDef.create) {
                nodeInstance = imgDef.create(src, options);
            }
        }

        const pixiNode = await nodeInstance;
        if (pixiNode) {
            if (resourceId) {
                pixiNode.resourceId = resourceId;
                fileResourceManager.bindNodeToGroup(pixiNode, resourceId);
            }
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
        fileResourceManager.unbindNode(pixiNode);
    }

    clear() {
        this.nodes.forEach(n => n.destroy());
        this.nodes = [];
        blobRegistry.revokeAll();
        fileResourceManager.clear();
    }
}
export const sceneResourceManager = new SceneResourceManager();