import { blobRegistry } from '@/services/resources/BlobRegistry'
import { fileResourceManager } from '@/services/resources/FileResourceManager'

export async function loadImage(nodeConfig, zip) {
    const baseZipDir = "assets/" + nodeConfig.path + "/";
    const imgZipFile = zip.file(baseZipDir + nodeConfig.name);
    if (!imgZipFile) return;
    
    const imgBuffer = await imgZipFile.async("arraybuffer");
    let mimeType = "image/png";
    if (nodeConfig.name.endsWith(".jpg") || nodeConfig.name.endsWith(".jpeg")) {
        mimeType = "image/jpeg";
    } else if (nodeConfig.name.endsWith(".gif")) {
        mimeType = "image/gif";
    } else if (nodeConfig.name.endsWith(".webp")) {
        mimeType = "image/webp";
    }
    const imgBlob = new Blob([imgBuffer], { type: mimeType });
    const imgBlobUrl = blobRegistry.createURL(imgBlob, nodeConfig.name);
    
    const resourceId = nodeConfig.resourceId || `img_${Math.random().toString(36).substring(2, 9)}`;
    fileResourceManager.addFileToGroup(resourceId, imgBlobUrl);

    let imgNodes = await this.addImageNode([{
        path: [imgBlobUrl],
        name: nodeConfig.name,
        type: nodeConfig.name.split('.').pop().toLowerCase(),
        resourceId: resourceId
    }]);
    let mNode = imgNodes[0];
    if (mNode) {
        mNode.name = nodeConfig.name;
        mNode.originalFileName = nodeConfig.name;
        mNode.url = imgBlobUrl;
        mNode.scale.set(nodeConfig.scale);
        mNode.x = nodeConfig.x;
        mNode.y = nodeConfig.y;
        if (nodeConfig.rotation !== undefined) mNode.rotation = nodeConfig.rotation;
        if (nodeConfig.alpha !== undefined) mNode.alpha = nodeConfig.alpha;
    }
}

export async function serializeImg(node, dest, randomDir, zipPrefix, addFileToZip) {
    let imgExt = '.png';
    const lowerImgUrl = node.url.toLowerCase();
    if (lowerImgUrl.endsWith('.jpg') || lowerImgUrl.endsWith('.jpeg')) imgExt = '.jpg';
    else if (lowerImgUrl.endsWith('.webp')) imgExt = '.webp';
    else if (lowerImgUrl.endsWith('.gif')) imgExt = '.gif';
    
    let exportName = node.originalFileName || node.name;
    const hasImgExt = /\.(png|jpg|jpeg|webp|gif)$/i.test(exportName);
    if (!hasImgExt) {
        exportName += imgExt;
    }

    let data = {
        type: "img",
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
    
    await addFileToZip(dest, zipPrefix + randomDir + "/" + exportName, node.url);
    return data;
}

export async function loadPreviewImage(nodeConfig, mCacheNode) {
    const imgUrl = 'export/' + nodeConfig.path + '/' + nodeConfig.name;
    let imgNodes = await this.addImageNode([{
        path: [imgUrl],
        name: nodeConfig.name,
        type: nodeConfig.name.split('.').pop().toLowerCase(),
    }]);
    let mNode = imgNodes[0];
    if (mNode) {
        mNode.name = nodeConfig.name;
        mNode.originalFileName = nodeConfig.name;
        mNode.url = imgUrl;
        mNode.scale.set(
            nodeConfig.scaleX !== undefined ? nodeConfig.scaleX : nodeConfig.scale,
            nodeConfig.scaleY !== undefined ? nodeConfig.scaleY : nodeConfig.scale
        );
        mNode.x = nodeConfig.x;
        mNode.y = nodeConfig.y;
        if (nodeConfig.rotation !== undefined) mNode.rotation = nodeConfig.rotation;
        if (nodeConfig.alpha !== undefined) mNode.alpha = nodeConfig.alpha;
        mCacheNode.push(mNode);
    }
}
