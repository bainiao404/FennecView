import FennecView from '@/fennec-view/FennecView'
import { rectNode } from './RectNode'
import { loadRect, serializeRect, loadPreviewRect } from './rectLoader'

export default {
    install(registry) {
        registry.register("rect", {
            nodeClass: rectNode,
            loader: loadRect,
            previewLoader: loadPreviewRect,
            serialize: serializeRect,
            create: (src, options) => new rectNode(options)
        });

        FennecView.addRectNode = async function (options = {}) {
            let box = this.canvas.box;
            let nodeInstance = new rectNode(options);
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
