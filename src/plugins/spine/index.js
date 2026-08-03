import FennecView from '@/fennec-view/FennecView'
import { sceneResourceManager } from '@/fennec-view/node'
import { spineNode } from './SpineNode'
import { loadSpine, serializeSpine, loadPreviewSpine } from './spineLoader'

export default {
    install(registry) {
        registry.register("spine", {
            nodeClass: spineNode,
            loader: loadSpine,
            previewLoader: loadPreviewSpine,
            serialize: serializeSpine,
            create: (src, options) => {
                const alphaMode = options.alphaMode !== undefined ? options.alphaMode : 3;
                return new spineNode(src, alphaMode);
            }
        });

        FennecView.addSpineNode = async function (list, alphaMode = 2) {
            if (!list || list.length === 0) {
                return [];
            }
            let box = this.canvas.box;
            let loadList = [];
            let nodes = [];
            list.forEach((e) => {
                loadList.push(sceneResourceManager.load(e, { alphaMode }));
            });
            let loadedNodes = await Promise.all(loadList);
            loadedNodes.forEach((node) => {
                if (!node) return;
                this.click.current = node;
                box.addChild(node);
                this.refreshPropertyPanel();
                this.attachNodeEvents(node);
                nodes.push(node);
            });
            this.refreshList();
            return nodes;
        };
    }
};
