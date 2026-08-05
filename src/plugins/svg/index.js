import { markRaw } from 'vue'
import FennecView from '@/fennec-view/FennecView'
import { sceneResourceManager } from '@/fennec-view/node'
import { svgNode } from './SVGNode'
import { loadSvg, serializeSvg, loadPreviewSvg } from './svgLoader'
import SVGPropertiesPanel from './SVGPropertiesPanel.vue'

export default {
    install(registry) {
        registry.register("svg", {
            nodeClass: svgNode,
            loader: loadSvg,
            previewLoader: loadPreviewSvg,
            serialize: serializeSvg,
            propertyComponent: markRaw(SVGPropertiesPanel),
            create: (src, options) => new svgNode(src, options),
            import: async (importItem) => {
                const { fileResourceManager } = await import('@/services/resources/FileResourceManager')
                const fileItem = importItem.associatedFiles.media;
                const loadPath = await fileItem.getLoadUrl();
                fileResourceManager.addFileToGroup(importItem.id, loadPath);

                const svgSrcs = [{
                    path: [loadPath],
                    name: importItem.config.name,
                    type: 'svg',
                    resourceId: importItem.id
                }];
                const nodes = await FennecView.addSvgNode(svgSrcs);
                if (nodes && nodes[0]) {
                    nodes[0].name = importItem.config.name;
                    nodes[0].originalFileName = fileItem.name;
                }
                return nodes;
            }
        });

        FennecView.addSvgNode = async function (list, options = {}) {
            let listToLoad = list;
            let finalOptions = options;

            if (list && !Array.isArray(list)) {
                if (list.path) {
                    listToLoad = [list];
                } else {
                    listToLoad = [{ path: [""], type: "svg" }];
                    finalOptions = list;
                }
            }

            if (!listToLoad || listToLoad.length === 0) {
                return [];
            }

            let box = this.canvas.box;
            let loadList = [];
            let nodes = [];

            listToLoad.forEach((e) => {
                loadList.push(sceneResourceManager.load(e, finalOptions));
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
