import FennecView from '@/fennec-view/FennecView'
import { sceneResourceManager } from '@/fennec-view/node'
import { imgNode } from './ImgNode'
import { loadImage, serializeImg, loadPreviewImage } from './imgLoader'

export default {
    install(registry) {
        registry.register("img", {
            nodeClass: imgNode,
            loader: loadImage,
            previewLoader: loadPreviewImage,
            serialize: serializeImg,
            create: (src) => new imgNode(src),
            import: async (importItem) => {
                const { fileResourceManager } = await import('@/services/resources/FileResourceManager')
                const fileItem = importItem.associatedFiles.media;
                const ext = fileItem.name.split('.').pop().toLowerCase();
                const loadPath = await fileItem.getLoadUrl();
                fileResourceManager.addFileToGroup(importItem.id, loadPath);

                const imgSrcs = [{
                    path: [loadPath],
                    name: importItem.config.name,
                    type: ext,
                    resourceId: importItem.id
                }];
                const nodes = await FennecView.addImageNode(imgSrcs);
                if (nodes && nodes[0]) {
                    nodes[0].name = importItem.config.name;
                    nodes[0].originalFileName = fileItem.name;
                }
                return nodes;
            }
        });

        FennecView.addImageNode = async function (list) {
            if (!list || list.length === 0) {
                return [];
            }
            let box = this.canvas.box;
            let loadList = [];
            let nodes = [];
            list.forEach((e) => {
                loadList.push(sceneResourceManager.load(e));
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
