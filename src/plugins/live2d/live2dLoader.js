import { blobRegistry } from '@/services/resources/BlobRegistry'
import { fileResourceManager } from '@/services/resources/FileResourceManager'

export async function loadLive2D(nodeConfig, zip) {
    const baseZipDir = "assets/" + nodeConfig.path + "/";
    const modelJsonFile = zip.file(baseZipDir + nodeConfig.name);
    if (!modelJsonFile) return;
    
    let modelJsonBuffer = await modelJsonFile.async("arraybuffer");
    const textDecoder = new TextDecoder();
    const modelJsonStr = textDecoder.decode(modelJsonBuffer);
    let modelJson = JSON.parse(modelJsonStr);
    
    const allFiles = Object.keys(zip.files).filter(
        name => name.startsWith(baseZipDir) && name !== (baseZipDir + nodeConfig.name)
    );
    
    function normalizePath(p) {
        if (typeof p !== 'string') return '';
        let np = p.replace(/\\/g, '/');
        if (np.startsWith('./')) {
            np = np.substring(2);
        }
        return np;
    }
    
    const resourceId = nodeConfig.resourceId || `live2d_${Math.random().toString(36).substring(2, 9)}`;

    const pathMap = {};
    for (let file of allFiles) {
        const zipFile = zip.file(file);
        if (!zipFile) continue;
        const relPath = file.substring(baseZipDir.length);
        const fileBuffer = await zipFile.async("arraybuffer");
        let mimeType = "application/octet-stream";
        if (file.endsWith(".png")) mimeType = "image/png";
        else if (file.endsWith(".json")) mimeType = "application/json";
        
        const blob = new Blob([fileBuffer], { type: mimeType });
        const fileNameOnly = relPath.substring(relPath.lastIndexOf('/') + 1);
        const blobUrl = blobRegistry.createURL(blob, fileNameOnly);
        pathMap[normalizePath(relPath)] = blobUrl;
        fileResourceManager.addFileToGroup(resourceId, blobUrl);
    }
    
    function findBlobUrl(relPath) {
        const norm = normalizePath(relPath);
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
    const originalModelJson = JSON.parse(JSON.stringify(modelJson));
    rewritePaths(modelJson);
    
    const rewrittenJsonBlob = new Blob([JSON.stringify(modelJson, null, 4)], { type: "application/json" });
    const rewrittenJsonBlobUrl = blobRegistry.createURL(rewrittenJsonBlob, nodeConfig.name);
    fileResourceManager.addFileToGroup(resourceId, rewrittenJsonBlobUrl);
    
    const live2dSrcObj = {
        type: 'live2d',
        path: [rewrittenJsonBlobUrl],
        resourceId: resourceId
    };
    let live2dNodes = await this.addSpineNode([live2dSrcObj]);
    let mNode = live2dNodes[0];
    if (mNode) {
        mNode.name = nodeConfig.name;
        mNode.originalFileName = nodeConfig.name;
        mNode.url = rewrittenJsonBlobUrl;
        mNode.live2dData = {
            originalModelJson: originalModelJson,
            pathMap: pathMap
        };
        mNode.scale.set(nodeConfig.scale);
        mNode.x = nodeConfig.x;
        mNode.y = nodeConfig.y;
        if (nodeConfig.rotation !== undefined) mNode.rotation = nodeConfig.rotation;
        if (nodeConfig.alpha !== undefined) mNode.alpha = nodeConfig.alpha;
        if (nodeConfig.skin) {
            this.updateNodeProperty("skin", nodeConfig.skin);
        }
        if (nodeConfig.animation) {
            this.updateNodeProperty("animation", nodeConfig.animation);
        }
        if (nodeConfig.transitionMode && mNode.nodeData) {
            mNode.nodeData.transitionMode = nodeConfig.transitionMode;
        }
        if (nodeConfig.live2dFadeIn !== undefined && mNode.nodeData) {
            mNode.nodeData.live2dFadeIn = nodeConfig.live2dFadeIn;
        }
        if (nodeConfig.live2dFadeOut !== undefined && mNode.nodeData) {
            mNode.nodeData.live2dFadeOut = nodeConfig.live2dFadeOut;
        }
        if (nodeConfig.live2dTracking !== undefined && mNode.nodeData) {
            mNode.nodeData.live2dTracking = nodeConfig.live2dTracking;
        }
    }
}

export async function serializeLive2D(node, dest, randomDir, zipPrefix, addFileToZip, readFileAsArrayBuffer) {
    let live2dExt = '.model3.json';
    if (node.url.toLowerCase().endsWith('.model.json')) {
        live2dExt = '.model.json';
    }
    let exportName = node.originalFileName || node.name;
    if (!exportName.toLowerCase().endsWith('.json')) {
        exportName += live2dExt;
    }

    let data = {
        type: "live2d",
        path: randomDir,
        name: exportName,
        src: node.url,
        scale: node.scale.x,
        scaleX: node.scale.x,
        scaleY: node.scale.y,
        x: node.x,
        y: node.y,
        rotation: node.rotation,
        alpha: node.alpha,
    };
    if (node.nodeData) {
        data.skin = node.nodeData.activeSkinName || "";
        data.animation = node.nodeData.activeAnimationName || "";
        data.transitionMode = node.nodeData.transitionMode || "loop";
        data.live2dFadeIn = node.nodeData.live2dFadeIn !== undefined ? node.nodeData.live2dFadeIn : 0.1;
        data.live2dFadeOut = node.nodeData.live2dFadeOut !== undefined ? node.nodeData.live2dFadeOut : 0.1;
        data.live2dTracking = !!node.nodeData.live2dTracking;
        
        if (node.nodeData._live2DParameters) {
            data.live2dParameters = Object.keys(node.nodeData._live2DParameters).map(key => {
                let p = node.nodeData._live2DParameters[key];
                return { name: key, state: p.state, value: p.targetValue };
            });
        }
        if (node.nodeData._live2DParts) {
            data.live2dParts = Object.keys(node.nodeData._live2DParts).map(key => {
                let p = node.nodeData._live2DParts[key];
                return { name: key, state: p.state, value: p.targetValue };
            });
        }
    }
    
    try {
        let modelJson;
        let filesToCopy = [];
        let modelDir = node.url.substring(0, node.url.lastIndexOf("/") + 1);
        
        if (node.live2dData && node.live2dData.originalModelJson) {
            modelJson = node.live2dData.originalModelJson;
            dest.file(zipPrefix + randomDir + "/" + exportName, JSON.stringify(modelJson, null, 4));
        } else {
            const modelJsonBuffer = await readFileAsArrayBuffer(node.url);
            dest.file(zipPrefix + randomDir + "/" + exportName, modelJsonBuffer);
            const textDecoder = new TextDecoder();
            const modelJsonStr = textDecoder.decode(modelJsonBuffer);
            modelJson = JSON.parse(modelJsonStr);
        }
        
        if (modelJson.FileReferences) {
            let fr = modelJson.FileReferences;
            if (fr.Moc) filesToCopy.push(fr.Moc);
            if (Array.isArray(fr.Textures)) {
                fr.Textures.forEach(t => filesToCopy.push(t));
            }
            if (fr.Physics) filesToCopy.push(fr.Physics);
            if (fr.DisplayInfo) filesToCopy.push(fr.DisplayInfo);
            if (fr.UserData) filesToCopy.push(fr.UserData);
            if (fr.Pose) filesToCopy.push(fr.Pose);
            if (Array.isArray(fr.Expressions)) {
                fr.Expressions.forEach(e => {
                    if (e.File) filesToCopy.push(e.File);
                });
            }
            if (fr.Motions && typeof fr.Motions === 'object') {
                Object.keys(fr.Motions).forEach(group => {
                    let motions = fr.Motions[group];
                    if (Array.isArray(motions)) {
                        motions.forEach(m => {
                            if (m.File) filesToCopy.push(m.File);
                        });
                    }
                });
            }
        } else {
            if (modelJson.model) filesToCopy.push(modelJson.model);
            if (Array.isArray(modelJson.textures)) {
                modelJson.textures.forEach(t => filesToCopy.push(t));
            }
            if (modelJson.physics) filesToCopy.push(modelJson.physics);
            if (Array.isArray(modelJson.expressions)) {
                modelJson.expressions.forEach(e => {
                    if (e.file) filesToCopy.push(e.file);
                });
            }
            if (modelJson.motions && typeof modelJson.motions === 'object') {
                Object.keys(modelJson.motions).forEach(group => {
                    let motions = modelJson.motions[group];
                    if (Array.isArray(motions)) {
                        motions.forEach(m => {
                            if (m.file) filesToCopy.push(m.file);
                        });
                    }
                });
            }
        }
        
        function normalizePath(p) {
            if (typeof p !== 'string') return '';
            let np = p.replace(/\\/g, '/');
            if (np.startsWith('./')) {
                np = np.substring(2);
            }
            return np;
        }
        
        for (let relPath of filesToCopy) {
            if (typeof relPath === 'string') {
                let srcFilePath;
                if (node.live2dData && node.live2dData.pathMap) {
                    const norm = normalizePath(relPath);
                    srcFilePath = node.live2dData.pathMap[norm];
                    if (!srcFilePath) {
                        const lowerNorm = norm.toLowerCase();
                        for (let key in node.live2dData.pathMap) {
                            if (key.toLowerCase() === lowerNorm) {
                                srcFilePath = node.live2dData.pathMap[key];
                                break;
                            }
                        }
                    }
                }
                
                if (!srcFilePath) {
                    if (relPath.startsWith('blob:') || relPath.startsWith('data:') || relPath.startsWith('http:') || relPath.startsWith('https:')) {
                        srcFilePath = relPath;
                    } else {
                        srcFilePath = modelDir + relPath;
                    }
                }
                
                await addFileToZip(dest, zipPrefix + randomDir + "/" + relPath, srcFilePath);
            }
        }
    } catch (err) {
        console.warn("Could not copy Live2D model files:", err);
    }
    return data;
}

export async function loadPreviewLive2D(nodeConfig, mCacheNode) {
    let spineNodes = await this.addSpineNode(['export/' + nodeConfig.path + '/' + nodeConfig.name]);
    let mNode = spineNodes[0];
    if (mNode) {
        if (nodeConfig.scaleX !== undefined && nodeConfig.scaleY !== undefined) {
            mNode.scale.set(nodeConfig.scaleX, nodeConfig.scaleY);
        } else {
            mNode.scale.set(nodeConfig.scale);
        }
        mNode.x = nodeConfig.x;
        mNode.y = nodeConfig.y;
        if (nodeConfig.rotation !== undefined) mNode.rotation = nodeConfig.rotation;
        if (nodeConfig.alpha !== undefined) mNode.alpha = nodeConfig.alpha;
        if (nodeConfig.skin) {
            this.updateNodeProperty('skin', nodeConfig.skin);
        }
        if (nodeConfig.animation) {
            this.updateNodeProperty('animation', nodeConfig.animation);
        }
        if (nodeConfig.transitionMode && mNode.nodeData) {
            mNode.nodeData.transitionMode = nodeConfig.transitionMode;
        }
        if (nodeConfig.live2dFadeIn !== undefined && mNode.nodeData) {
            mNode.nodeData.live2dFadeIn = nodeConfig.live2dFadeIn;
        }
        if (nodeConfig.live2dFadeOut !== undefined && mNode.nodeData) {
            mNode.nodeData.live2dFadeOut = nodeConfig.live2dFadeOut;
        }
        if (nodeConfig.live2dTracking !== undefined && mNode.nodeData) {
            mNode.nodeData.live2dTracking = nodeConfig.live2dTracking;
        }
        if (nodeConfig.live2dParameters) {
            nodeConfig.live2dParameters.forEach((p) => {
                this.updateNodeProperty('live2dParameter', [p.name, p.value]);
                this.updateNodeProperty('live2dParameterState', [p.name, p.state]);
            });
        }
        if (nodeConfig.live2dParts) {
            nodeConfig.live2dParts.forEach((p) => {
                this.updateNodeProperty('live2dPart', [p.name, p.value]);
                this.updateNodeProperty('live2dPartState', [p.name, p.state]);
            });
        }
        mCacheNode.push(mNode);
    }
}
