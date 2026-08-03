import { BaseProcessor } from './BaseProcessor'
import FennecView from '@/fennec-view/FennecView'
import { blobRegistry } from '@/services/resources/BlobRegistry'
import { fileResourceManager } from '@/services/resources/FileResourceManager'

export class Live2dProcessor extends BaseProcessor {
    /**
     * Detect if this file is a Live2D model entry point.
     */
    async detect(fileItem) {
        const name = fileItem.name.toLowerCase();
        if (name.endsWith('.model3.json') || name.endsWith('.model.json')) {
            return true;
        }
        if (name.endsWith('.json') && name.includes('model')) {
            try {
                const text = await this.readFileAsText(fileItem);
                const parsed = JSON.parse(text);
                if (parsed.model || parsed.FileReferences) {
                    return true;
                }
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    /**
     * Group Live2D files and evaluate completeness.
     */
    async group(entryFile, pool) {
        const baseName = entryFile.name.substring(0, entryFile.name.lastIndexOf('.'));
        const dirPath = entryFile.relativePath.substring(0, entryFile.relativePath.lastIndexOf('/') + 1);

        const crucialMissing = [];
        const optionalMissing = [];
        const associatedFiles = {
            modelJson: entryFile,
            crucial: [],
            optional: []
        };

        let parsedJson = null;
        try {
            const text = await this.readFileAsText(entryFile);
            parsedJson = JSON.parse(text);

            const collectedPaths = [];
            // Recursively collect all paths from model json
            function collectPaths(obj) {
                for (let key in obj) {
                    if (typeof obj[key] === 'string') {
                        const val = obj[key];
                        // If it looks like a relative file path (contains an extension, not a URL/data URI)
                        if (
                            /\.[a-zA-Z0-9]+$/.test(val) &&
                            !val.startsWith('http') &&
                            !val.startsWith('data:') &&
                            !val.startsWith('blob:')
                        ) {
                            collectedPaths.push(val);
                        }
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        collectPaths(obj[key]);
                    }
                }
            }
            collectPaths(parsedJson);

            // Group paths by priority
            for (const relPath of collectedPaths) {
                const isCrucial = 
                    relPath.endsWith('.moc3') || 
                    relPath.endsWith('.moc') || 
                    /\.(png|jpg|jpeg|webp)$/i.test(relPath) ||
                    relPath.toLowerCase().includes('textures/');

                // Try to find the file in pool matching relPath
                let match = pool.find(f => {
                    const fDir = f.relativePath.substring(0, f.relativePath.lastIndexOf('/') + 1);
                    return f.name.toLowerCase() === relPath.substring(relPath.lastIndexOf('/') + 1).toLowerCase() && fDir === dirPath;
                });

                if (!match) {
                    match = this.findMatchingFile(pool, relPath);
                }

                if (match) {
                    if (isCrucial) {
                        associatedFiles.crucial.push(match);
                    } else {
                        associatedFiles.optional.push(match);
                    }
                } else {
                    const missingInfo = {
                        name: relPath,
                        description: `Live2D 依赖文件 ${relPath}`
                    };
                    if (isCrucial) {
                        crucialMissing.push(missingInfo);
                    } else {
                        optionalMissing.push(missingInfo);
                    }
                }
            }
        } catch (e) {
            console.error('Failed to parse Live2D JSON:', entryFile.name, e);
            crucialMissing.push({
                name: entryFile.name,
                description: '无法读取模型 JSON 配置文件'
            });
        }

        const status = crucialMissing.length === 0 ? 'complete' : 'incomplete';
        const missingFiles = [...crucialMissing.map(m => ({ ...m, type: 'crucial' })), ...optionalMissing.map(m => ({ ...m, type: 'optional' }))];

        return {
            id: 'live2d_' + entryFile.relativePath,
            type: 'live2d',
            name: baseName,
            status,
            entryFile,
            associatedFiles,
            missingFiles,
            config: {
                name: baseName
            }
        };
    }

    /**
     * Import Live2D model into the PIXI scene.
     */
    async import(importItem) {
        if (importItem.status !== 'complete') {
            throw new Error(`Live2D model ${importItem.name} is incomplete and cannot be imported.`);
        }

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
        const dirPath = entryFile.relativePath.substring(0, entryFile.relativePath.lastIndexOf('/') + 1);

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
                                
                                // Map normalized path
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
}
