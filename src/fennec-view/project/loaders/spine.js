import { blobRegistry } from '@/services/resources/BlobRegistry'

export async function loadSpine(nodeConfig, zip, mCacheNode) {
    const baseZipDir = "assets/" + nodeConfig.path + "/";
    const skelZipFile = zip.file(baseZipDir + nodeConfig.name);
    if (!skelZipFile) return;
    const skelBuffer = await skelZipFile.async("arraybuffer");
    const skelBlob = new Blob([skelBuffer]);
    const skelBlobUrl = blobRegistry.createURL(skelBlob);
    
    const atlasFileName = Object.keys(zip.files).find(
        name => name.startsWith(baseZipDir) && name.endsWith(".atlas")
    );
    if (!atlasFileName) return;
    const originalAtlasName = atlasFileName.substring(atlasFileName.lastIndexOf("/") + 1);
    const atlasZipFile = zip.file(atlasFileName);
    let atlasText = await atlasZipFile.async("string");
    
    const pageFiles = Object.keys(zip.files).filter(
        name => name.startsWith(baseZipDir) && (name.endsWith(".png") || name.endsWith(".jpg"))
    );
    
    const pageBlobMaps = {};
    for (let pageFile of pageFiles) {
        const pageName = pageFile.substring(pageFile.lastIndexOf("/") + 1);
        const imgBuffer = await zip.file(pageFile).async("arraybuffer");
        const imgBlob = new Blob([imgBuffer], { type: "image/png" });
        const imgBlobUrl = blobRegistry.createURL(imgBlob);
        pageBlobMaps[pageName] = imgBlobUrl;
    }
    
    const atlasBlob = new Blob([atlasText], { type: "text/plain" });
    const atlasBlobUrl = blobRegistry.createURL(atlasBlob);
    
    const isSkel = nodeConfig.name.endsWith('.skel');
    const spineSrcObj = {
        type: isSkel ? 'skel' : 'json',
        path: [
            skelBlobUrl,
            atlasBlobUrl,
            ""
        ],
        atlasPath: atlasBlobUrl,
        texturePath: "",
        textures: pageBlobMaps
    };
    
    let alphaMode = nodeConfig.textureMode !== undefined ? nodeConfig.textureMode : (nodeConfig.isPremultiplied ? 2 : 0);
    let spineNodes = await this.addSpineNode([spineSrcObj], alphaMode);
    let mNode = spineNodes[0];
    if (mNode) {
        mNode.name = nodeConfig.name;
        mNode.url = skelBlobUrl;
        mNode.spineData.info = {
            type: isSkel ? 'skel' : 'json',
            path: [
                skelBlobUrl,
                atlasBlobUrl,
                ""
            ],
            atlasPath: atlasBlobUrl,
            texturePath: "",
            textures: pageBlobMaps,
            originalAtlasName: originalAtlasName
        };
        mNode.scale.set(nodeConfig.scale);
        mNode.x = nodeConfig.x;
        mNode.y = nodeConfig.y;
        
        this.updateNodeProperty("skin", nodeConfig.skin);
        this.updateNodeProperty("animation", nodeConfig.animation);
        if (nodeConfig.slots) {
            nodeConfig.slots.forEach((e) => {
                this.updateNodeProperty("slotsAlpha", e);
            });
        }
        if (nodeConfig.slotsAttachment) {
            nodeConfig.slotsAttachment.forEach((e) => {
                this.updateNodeProperty("attachment", [e.slotName, e.attachmentName]);
            });
        }
        mCacheNode.push(mNode);
    }
}
export default loadSpine;
