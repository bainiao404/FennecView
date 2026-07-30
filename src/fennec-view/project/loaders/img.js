import { blobRegistry } from '@/services/resources/BlobRegistry'

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
    const imgBlobUrl = blobRegistry.createURL(imgBlob);
    
    let imgNodes = await this.addImageNode([imgBlobUrl]);
    let mNode = imgNodes[0];
    if (mNode) {
        mNode.name = nodeConfig.name;
        mNode.url = imgBlobUrl;
        mNode.scale.set(nodeConfig.scale);
        mNode.x = nodeConfig.x;
        mNode.y = nodeConfig.y;
    }
}
export default loadImage;
