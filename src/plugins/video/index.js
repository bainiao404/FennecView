import FennecView from '@/fennec-view/FennecView'
import { sceneResourceManager } from '@/fennec-view/node'
import { videoNode } from './VideoNode'
import { loadVideo, serializeVideo, loadPreviewVideo } from './videoLoader'

export default {
    install(registry) {
        registry.register("video", {
            nodeClass: videoNode,
            loader: loadVideo,
            previewLoader: loadPreviewVideo,
            serialize: serializeVideo,
            create: (src, options) => new videoNode(src, options),
            import: async (importItem) => {
                const { fileResourceManager } = await import('@/services/resources/FileResourceManager')
                const fileItem = importItem.associatedFiles.media;
                const ext = fileItem.name.split('.').pop().toLowerCase();
                const loadPath = await fileItem.getLoadUrl();
                fileResourceManager.addFileToGroup(importItem.id, loadPath);

                const videoSrcs = [{
                    path: [loadPath],
                    name: importItem.config.name,
                    type: ext,
                    resourceId: importItem.id
                }];
                const nodes = await FennecView.addVideoNode(videoSrcs);
                if (nodes && nodes[0]) {
                    nodes[0].name = importItem.config.name;
                    nodes[0].originalFileName = fileItem.name;
                }
                return nodes;
            }
        });

        FennecView.addVideoNode = async function (list) {
            if (!list || list.length === 0) {
                return [];
            }
            let box = this.canvas.box;
            let loadList = [];
            let nodes = [];
            list.forEach((e) => {
                loadList.push(sceneResourceManager.load(e, { type: 'video' }));
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
