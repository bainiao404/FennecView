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
            },
            import: async (importItem) => {
                const { fileResourceManager } = await import('@/services/resources/FileResourceManager')
                const { blobRegistry } = await import('@/services/resources/BlobRegistry')

                const skelFile = importItem.associatedFiles.skeleton;
                const atlasFile = importItem.associatedFiles.atlas;
                const foundTexturesMap = importItem.associatedFiles.foundTexturesMap || {};

                let spineSrcObj;
                if (skelFile.isNative) {
                    const localPath = await skelFile.getLoadUrl();
                    fileResourceManager.registerFile(skelFile.name, null, { path: localPath });
                    fileResourceManager.addFileToGroup(importItem.id, localPath);

                    let atlasPath = '';
                    if (atlasFile) {
                        atlasPath = await atlasFile.getLoadUrl();
                        fileResourceManager.registerFile(atlasFile.name, null, { path: atlasPath });
                        fileResourceManager.addFileToGroup(importItem.id, atlasPath);
                    }

                    if (importItem.associatedFiles.textures) {
                        for (const texFile of importItem.associatedFiles.textures) {
                            const texPath = await texFile.getLoadUrl();
                            fileResourceManager.registerFile(texFile.name, null, { path: texPath });
                            fileResourceManager.addFileToGroup(importItem.id, texPath);
                        }
                    }

                    spineSrcObj = {
                        type: skelFile.name.toLowerCase().endsWith('.skel') ? 'skel' : 'json',
                        path: [localPath, atlasPath, ''],
                        resourceId: importItem.id
                    };
                } else {
                    const skelBlobUrl = await skelFile.getBlobUrl();
                    fileResourceManager.addFileToGroup(importItem.id, skelBlobUrl);

                    const atlasText = await atlasFile.readAsText();
                    const atlasBlob = new Blob([atlasText], { type: 'text/plain' });
                    const atlasBlobUrl = blobRegistry.createURL(atlasBlob, atlasFile.name);
                    fileResourceManager.addFileToGroup(importItem.id, atlasBlobUrl);

                    const imageBlobMaps = {};
                    await Promise.all(
                        Object.entries(foundTexturesMap).map(async ([texName, fileItem]) => {
                            const texBlobUrl = await fileItem.getBlobUrl();
                            fileResourceManager.addFileToGroup(importItem.id, texBlobUrl);
                            imageBlobMaps[texName] = texBlobUrl;
                        })
                    );

                    const isSkel = skelFile.name.toLowerCase().endsWith('.skel');
                    spineSrcObj = {
                        type: isSkel ? 'skel' : 'json',
                        path: [skelBlobUrl, atlasBlobUrl, ''],
                        atlasPath: atlasBlobUrl,
                        texturePath: '',
                        textures: imageBlobMaps,
                        name: importItem.config.name || skelFile.name,
                        originalAtlasName: atlasFile.name,
                        resourceId: importItem.id
                    };
                }

                const nodes = await FennecView.addSpineNode([spineSrcObj], Number(importItem.config.textureMode));
                if (nodes && nodes[0]) {
                    nodes[0].name = importItem.config.name;
                    nodes[0].originalFileName = skelFile.name;
                }
                return nodes;
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
