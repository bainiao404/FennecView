import { blobRegistry } from '@/services/resources/BlobRegistry'

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
        const blobUrl = blobRegistry.createURL(blob);
        pathMap[normalizePath(relPath)] = blobUrl;
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
    const rewrittenJsonBlobUrl = blobRegistry.createURL(rewrittenJsonBlob);
    
    const live2dSrcObj = {
        type: 'live2d',
        path: [rewrittenJsonBlobUrl]
    };
    let live2dNodes = await this.addSpineNode([live2dSrcObj]);
    let mNode = live2dNodes[0];
    if (mNode) {
        mNode.name = nodeConfig.name;
        mNode.url = rewrittenJsonBlobUrl;
        mNode.live2dData = {
            originalModelJson: originalModelJson,
            pathMap: pathMap
        };
        mNode.scale.set(nodeConfig.scale);
        mNode.x = nodeConfig.x;
        mNode.y = nodeConfig.y;
        if (nodeConfig.skin) {
            this.updateNodeProperty("skin", nodeConfig.skin);
        }
        if (nodeConfig.animation) {
            this.updateNodeProperty("animation", nodeConfig.animation);
        }
        if (nodeConfig.transitionMode && mNode.nodeData) {
            mNode.nodeData.transitionMode = nodeConfig.transitionMode;
        }
        if (nodeConfig.hasOwnProperty('live2dFadeIn') && mNode.nodeData) {
            mNode.nodeData.live2dFadeIn = nodeConfig.live2dFadeIn;
        }
        if (nodeConfig.hasOwnProperty('live2dFadeOut') && mNode.nodeData) {
            mNode.nodeData.live2dFadeOut = nodeConfig.live2dFadeOut;
        }
        if (nodeConfig.hasOwnProperty('live2dTracking') && mNode.nodeData) {
            mNode.nodeData.live2dTracking = nodeConfig.live2dTracking;
        }
    }
}
export default loadLive2D;
