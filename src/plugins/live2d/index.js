import FennecView from '@/fennec-view/FennecView'
import { live2dNode } from './Live2dNode'
import { loadLive2D, serializeLive2D, loadPreviewLive2D } from './live2dLoader'

export default {
    install(registry) {
        registry.register("live2d", {
            nodeClass: live2dNode,
            loader: loadLive2D,
            previewLoader: loadPreviewLive2D,
            // Wrap serialize to pass helper methods properly
            serialize: async (node, dest, randomDir, zipPrefix, addFileToZip) => {
                const { readFileAsArrayBuffer } = await import('@/utils/helpers');
                return await serializeLive2D(node, dest, randomDir, zipPrefix, addFileToZip, readFileAsArrayBuffer);
            },
            create: (src, options) => {
                const finalSrc = (src && typeof src === 'object' && src.path && src.path[0]) ? src.path[0] : src;
                return new live2dNode(finalSrc, options);
            },
            import: async (importItem) => {
                const { fileResourceManager } = await import('@/services/resources/FileResourceManager')
                const { blobRegistry } = await import('@/services/resources/BlobRegistry')
                
                const entryFile = importItem.entryFile;

                if (entryFile.isNative) {
                    const localPath = await entryFile.getLoadUrl();
                    fileResourceManager.registerFile(entryFile.name, null, { path: localPath });
                    fileResourceManager.addFileToGroup(importItem.id, localPath);

                    const pool = [...importItem.associatedFiles.crucial, ...importItem.associatedFiles.optional];
                    for (const file of pool) {
                        const fPath = await file.getLoadUrl();
                        fileResourceManager.registerFile(file.name, null, { path: fPath });
                        fileResourceManager.addFileToGroup(importItem.id, fPath);
                    }

                    const live2dSrcObj = {
                        type: 'live2d',
                        path: [localPath],
                        resourceId: importItem.id
                    };

                    const nodes = await FennecView.addSpineNode([live2dSrcObj]);
                    const mNode = nodes[0];
                    if (mNode) {
                        mNode.name = importItem.config.name;
                        mNode.originalFileName = entryFile.name;
                    }
                    return nodes;
                }

                // Web mode: use Blob URLs and path mapping
                const text = await entryFile.readAsText();
                const modelJson = JSON.parse(text);
                const originalModelJson = JSON.parse(JSON.stringify(modelJson));

                const pool = [...importItem.associatedFiles.crucial, ...importItem.associatedFiles.optional];

                // Helper to find file in associated pool
                const findInGroup = (relPath) => {
                    const norm = relPath.replace(/\\/g, '/').toLowerCase();
                    const fileName = norm.substring(norm.lastIndexOf('/') + 1);
                    let found = pool.find(f => f.name.toLowerCase() === fileName);
                    if (found) return found;
                    found = pool.find(f => {
                        const fNorm = f.relativePath.replace(/\\/g, '/').toLowerCase();
                        return fNorm.endsWith(norm);
                    });
                    return found;
                };

                const pathMap = {};
                const mappedPromises = [];

                function collectAndMapPaths(obj) {
                    for (let key in obj) {
                        if (typeof obj[key] === 'string') {
                            const val = obj[key];
                            if (
                                /\.[a-zA-Z0-9]+$/.test(val) &&
                                !val.startsWith('http') &&
                                !val.startsWith('data:') &&
                                !val.startsWith('blob:')
                            ) {
                                const matchFile = findInGroup(val);
                                if (matchFile) {
                                    const p = (async () => {
                                        const blobUrl = await matchFile.getBlobUrl();
                                        fileResourceManager.addFileToGroup(importItem.id, blobUrl);
                                        
                                        let normVal = val.replace(/\\/g, '/');
                                        if (normVal.startsWith('./')) {
                                            normVal = normVal.substring(2);
                                        }
                                        pathMap[normVal] = blobUrl;
                                    })();
                                    mappedPromises.push(p);
                                }
                            }
                        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                            collectAndMapPaths(obj[key]);
                        }
                    }
                }

                collectAndMapPaths(modelJson);
                await Promise.all(mappedPromises);

                function findBlobUrl(relPath) {
                    let norm = relPath.replace(/\\/g, '/');
                    if (norm.startsWith('./')) {
                        norm = norm.substring(2);
                    }
                    if (pathMap[norm]) return pathMap[norm];
                    const lowerNorm = norm.toLowerCase();
                    for (let key in pathMap) {
                        if (key.toLowerCase() === lowerNorm) {
                            return pathMap[key];
                        }
                    }
                    return null;
                }

                // Rewrite paths to point to Blob URLs
                function rewritePaths(obj) {
                    for (let key in obj) {
                        if (typeof obj[key] === 'string') {
                            const mappedUrl = findBlobUrl(obj[key]);
                            if (mappedUrl) {
                                obj[key] = mappedUrl;
                            }
                        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                            rewritePaths(obj[key]);
                        }
                    }
                }
                rewritePaths(modelJson);

                const rewrittenJsonBlob = new Blob([JSON.stringify(modelJson, null, 4)], {
                    type: 'application/json',
                });
                const rewrittenJsonBlobUrl = blobRegistry.createURL(rewrittenJsonBlob, entryFile.name);
                fileResourceManager.addFileToGroup(importItem.id, rewrittenJsonBlobUrl);

                const live2dSrcObj = {
                    type: 'live2d',
                    path: [rewrittenJsonBlobUrl],
                    resourceId: importItem.id
                };

                const nodes = await FennecView.addSpineNode([live2dSrcObj]);
                const mNode = nodes[0];
                if (mNode) {
                    mNode.name = importItem.config.name;
                    mNode.url = rewrittenJsonBlobUrl;
                    mNode.live2dData = {
                        originalModelJson: originalModelJson,
                        pathMap: pathMap,
                    };
                    mNode.originalFileName = entryFile.name;
                }
                return nodes;
            }
        });
    }
};
