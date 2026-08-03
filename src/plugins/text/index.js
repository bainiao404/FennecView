import FennecView from '@/fennec-view/FennecView'
import { textNode } from './TextNode'
import { loadText, serializeText, loadPreviewText } from './textLoader'

export default {
    install(registry) {
        registry.register("text", {
            nodeClass: textNode,
            loader: loadText,
            previewLoader: loadPreviewText,
            serialize: serializeText,
            create: (src, options) => new textNode(src, options)
        });

        FennecView.addTextNode = async function (text, options = {}) {
            let box = this.canvas.box;
            let nodeInstance = new textNode(text, options);
            let pixiNode = await nodeInstance;
            if (pixiNode) {
                this.click.current = pixiNode;
                box.addChild(pixiNode);
                this.refreshPropertyPanel();
                this.attachNodeEvents(pixiNode);
                this.refreshList();
                return [pixiNode];
            }
            return [];
        };
    }
};
