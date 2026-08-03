import { markRaw } from 'vue'
import FennecView from '@/fennec-view/FennecView'
import { standDiffNode } from './StandDiffNode'
import { loadStandDiff, serializeStandDiff, loadPreviewStandDiff } from './standDiffLoader'
import StandDiffPropertiesPanel from './StandDiffPropertiesPanel.vue'

export default {
    install(registry) {
        registry.register("standDiff", {
            nodeClass: standDiffNode,
            loader: loadStandDiff,
            previewLoader: loadPreviewStandDiff,
            serialize: serializeStandDiff,
            propertyComponent: markRaw(StandDiffPropertiesPanel),
            create: (src, options) => new standDiffNode(options.bgInfo, options.fgList, options)
        });

        // Dynamically register the creator operation on FennecView core engine
        FennecView.addStandDiffNode = async function (bgInfo, fgList, options = {}) {
            let box = this.canvas.box;
            let nodeInstance = new standDiffNode(bgInfo, fgList, options);
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
