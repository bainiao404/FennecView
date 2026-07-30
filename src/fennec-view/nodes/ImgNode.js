import { useUIStore } from '@/stores/uiStore'
import { node } from './BaseNode'
import { blobRegistry } from '@/services/resources/BlobRegistry'

export class imgNode extends node {
    static exposedAttributes = ["node"];
    type = "img";
    constructor(src) {
        super();
        return this.start(src);
    }
    async start(src) {
        try {
            let url = "";
            if (typeof src === 'string') {
                url = src;
            } else if (src && typeof src === 'object') {
                url = (src.path && src.path[0]) ? src.path[0] : "";
            }
            
            let loadOptions = url;
            if (url.startsWith('blob:')) {
                loadOptions = {
                    src: url,
                    loadParser: 'loadTextures'
                };
            }
            const texture = await PIXI.Assets.load(loadOptions);
            const node = new PIXI.Sprite(texture);
            node.name = (src && typeof src === 'object' && src.name) ? src.name : url.replace(/\\/g, "/").replace(/.*\//g, "");
            node.url = url.replace(/\\/g, "/");
            node.position.set(0, 0);
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
            console.error("加载图片异常:", err);
        }
    }
    getAttributes() {
        let node = this.node;
        let attributes = this.getBaseAttributes();
        attributes.width = node.width;
        attributes.height = node.height;
        return { attributes };
    }
    getSerializableState() {
        let state = super.getSerializableState();
        if (!state) return null;
        state.type = 'img';
        return state;
    }
}