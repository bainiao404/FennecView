import { blobRegistry } from '@/services/resources/BlobRegistry'
import { fileResourceManager } from '@/services/resources/FileResourceManager'

export async function loadSpine(nodeConfig, zip, mCacheNode) {
    const baseZipDir = "assets/" + nodeConfig.path + "/";
    const skelZipFile = zip.file(baseZipDir + nodeConfig.name);
    if (!skelZipFile) return;
    const skelBuffer = await skelZipFile.async("arraybuffer");
    const skelBlob = new Blob([skelBuffer]);
    const skelBlobUrl = blobRegistry.createURL(skelBlob, nodeConfig.name);
    
    const resourceId = nodeConfig.resourceId || `spine_${Math.random().toString(36).substring(2, 9)}`;
    fileResourceManager.addFileToGroup(resourceId, skelBlobUrl);

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
        const imgBlobUrl = blobRegistry.createURL(imgBlob, pageName);
        pageBlobMaps[pageName] = imgBlobUrl;
        fileResourceManager.addFileToGroup(resourceId, imgBlobUrl);
    }
    
    const atlasBlob = new Blob([atlasText], { type: "text/plain" });
    const atlasBlobUrl = blobRegistry.createURL(atlasBlob, originalAtlasName);
    fileResourceManager.addFileToGroup(resourceId, atlasBlobUrl);
    
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
        textures: pageBlobMaps,
        resourceId: resourceId
    };
    
    let alphaMode = nodeConfig.textureMode !== undefined ? nodeConfig.textureMode : (nodeConfig.isPremultiplied ? 2 : 0);
    let spineNodes = await this.addSpineNode([spineSrcObj], alphaMode);
    let mNode = spineNodes[0];
    if (mNode) {
        mNode.name = nodeConfig.name;
        mNode.originalFileName = nodeConfig.name;
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
        if (nodeConfig.rotation !== undefined) mNode.rotation = nodeConfig.rotation;
        if (nodeConfig.alpha !== undefined) mNode.alpha = nodeConfig.alpha;
        
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

export async function serializeSpine(node, dest, randomDir, zipPrefix, addFileToZip) {
    const spineExt = node.spineData.info.type === 'skel' ? '.skel' : '.json';
    let exportName = node.originalFileName || node.name;
    if (!exportName.toLowerCase().endsWith(spineExt)) {
        exportName += spineExt;
    }

    let data = {
        type: "spine",
        path: randomDir,
        info: node.spineData.info,
        imgFile: [],
        animation: node.state.tracks[0]?.animation?.name || "",
        skin: node.skeleton.skin?.name || "",
        slots: [],
        slotsAttachment: [],
        name: exportName,
        scale: node.scale.x,
        scaleX: node.scale.x,
        scaleY: node.scale.y,
        x: node.x,
        y: node.y,
        rotation: node.rotation,
        alpha: node.alpha,
        textureMode: node.spineData.textureMode !== undefined ? node.spineData.textureMode : 0,
        isPremultiplied: (() => {
            if (node.spineData.texture && node.spineData.texture[0]) {
                const tex = node.spineData.texture[0];
                const source = tex.source || tex.baseTexture;
                const pmaMode = window.PIXI ? (window.PIXI.ALPHA_MODES ? window.PIXI.ALPHA_MODES.PREMULTIPLIED_ALPHA : 'premultiplied-alpha') : 1;
                return source ? source.alphaMode === pmaMode : false;
            }
            return node.spineData.isPremultiplied;
        })(),
    };
    
    node.spineData.atlas.atlas.pages.forEach((e) => {
        data.imgFile.push(e.name);
    });
    
    node.skeleton.slots.forEach((e, idx) => {
        if (e.color.a != 1) {
            data.slots.push([idx, e.color.a]);
        }
    });
    
    let attributes = node.nodeData.getAttributes();
    let slots = attributes["slots"] || [];
    slots.forEach((e) => {
        let currentAttachment = null;
        if (e.attachment && e.attachment.name) {
            currentAttachment = e.attachment.name;
        }
        data.slotsAttachment.push({
            slotName: e.data.name,
            attachmentName: currentAttachment,
        });
    });
    
    await addFileToZip(dest, zipPrefix + randomDir + "/" + exportName, node.spineData.info.path[0]);
    let atlasFileNameOnly = node.spineData.info.originalAtlasName;
    if (!atlasFileNameOnly || atlasFileNameOnly.startsWith('blob:') || !/\.atlas$/i.test(atlasFileNameOnly)) {
        let mPath = window.GKD.path.parsePath(node.spineData.info.path[1]);
        atlasFileNameOnly = mPath.fileName;
        if (!atlasFileNameOnly || atlasFileNameOnly.startsWith('blob:') || !/\.atlas$/i.test(atlasFileNameOnly)) {
            atlasFileNameOnly = exportName.replace(/\.(skel|json)$/i, '') + '.atlas';
        }
    }
    await addFileToZip(dest, zipPrefix + randomDir + "/" + atlasFileNameOnly, node.spineData.info.path[1]);
    for (let page of node.spineData.atlas.atlas.pages) {
        const pageSrc = (node.spineData.info.textures && node.spineData.info.textures[page.name]) || (node.spineData.info.path[2] + page.name);
        await addFileToZip(dest, zipPrefix + randomDir + "/" + page.name, pageSrc);
    }
    return data;
}

export async function loadPreviewSpine(nodeConfig, mCacheNode) {
    let alphaMode = nodeConfig.textureMode !== undefined ? nodeConfig.textureMode : (nodeConfig.isPremultiplied ? 2 : 0);
    
    const isSkel = nodeConfig.info && nodeConfig.info.type === 'skel';
    let atlasFileNameOnly = '';
    if (nodeConfig.info) {
        atlasFileNameOnly = nodeConfig.info.originalAtlasName;
        if (!atlasFileNameOnly && nodeConfig.info.path && nodeConfig.info.path[1]) {
            const p = nodeConfig.info.path[1];
            atlasFileNameOnly = p.substring(p.lastIndexOf('/') + 1);
        }
    }
    if (!atlasFileNameOnly) {
        atlasFileNameOnly = nodeConfig.name + '.atlas';
    }
    
    const rewrittenTextures = {};
    if (nodeConfig.info && nodeConfig.info.textures) {
        Object.keys(nodeConfig.info.textures).forEach(texName => {
            rewrittenTextures[texName] = 'export/' + nodeConfig.path + '/' + texName;
        });
    } else if (nodeConfig.imgFile) {
        nodeConfig.imgFile.forEach(texName => {
            rewrittenTextures[texName] = 'export/' + nodeConfig.path + '/' + texName;
        });
    }

    const spineSrcObj = {
        type: isSkel ? 'skel' : 'json',
        path: [
            'export/' + nodeConfig.path + '/' + nodeConfig.name,
            'export/' + nodeConfig.path + '/' + atlasFileNameOnly,
            ""
        ],
        atlasPath: 'export/' + nodeConfig.path + '/' + atlasFileNameOnly,
        texturePath: 'export/' + nodeConfig.path + '/',
        textures: rewrittenTextures
    };

    let spineNodes = await this.addSpineNode([spineSrcObj], alphaMode);
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
        this.updateNodeProperty('skin', nodeConfig.skin);
        this.updateNodeProperty('animation', nodeConfig.animation);
        if (nodeConfig.slots) {
            nodeConfig.slots.forEach((e) => {
                this.updateNodeProperty('slotsAlpha', e);
            });
        }
        if (nodeConfig.slotsAttachment) {
            nodeConfig.slotsAttachment.forEach((e) => {
                this.updateNodeProperty('attachment', [e.slotName, e.attachmentName]);
            });
        }
        mCacheNode.push(mNode);
    }
}
