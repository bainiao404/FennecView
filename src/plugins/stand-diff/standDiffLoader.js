import { blobRegistry } from '@/services/resources/BlobRegistry'
import { fileResourceManager } from '@/services/resources/FileResourceManager'

export async function loadStandDiff(nodeConfig, zip) {
    const baseZipDir = "assets/" + nodeConfig.path + "/";
    const resourceId = nodeConfig.resourceId || `standDiff_${Math.random().toString(36).substring(2, 9)}`;

    // 1. Load Background File
    const bgZipFile = zip.file(baseZipDir + nodeConfig.bgInfo.savedName);
    if (!bgZipFile) return;
    const bgBuffer = await bgZipFile.async("arraybuffer");
    const bgBlob = new Blob([bgBuffer], { type: "image/png" });
    const bgBlobUrl = blobRegistry.createURL(bgBlob, nodeConfig.bgInfo.name);
    fileResourceManager.addFileToGroup(resourceId, bgBlobUrl);

    const bgInfo = {
        name: nodeConfig.bgInfo.name,
        url: bgBlobUrl
    };

    // 2. Load Foreground Files
    const fgList = [];
    for (let fgConfig of nodeConfig.fgList) {
        const fgZipFile = zip.file(baseZipDir + fgConfig.savedName);
        if (!fgZipFile) continue;
        const fgBuffer = await fgZipFile.async("arraybuffer");
        const fgBlob = new Blob([fgBuffer], { type: "image/png" });
        const fgBlobUrl = blobRegistry.createURL(fgBlob, fgConfig.name);
        fileResourceManager.addFileToGroup(resourceId, fgBlobUrl);

        fgList.push({
            name: fgConfig.name,
            url: fgBlobUrl,
            x: (fgConfig.x !== undefined && fgConfig.x !== null && fgConfig.x !== '') ? Number(fgConfig.x) : null,
            y: (fgConfig.y !== undefined && fgConfig.y !== null && fgConfig.y !== '') ? Number(fgConfig.y) : null
        });
    }

    // 3. Instantiate node
    if (typeof this.addStandDiffNode === 'function') {
        const nodes = await this.addStandDiffNode(bgInfo, fgList, {
            name: nodeConfig.name,
            bgAnchorPreset: nodeConfig.bgAnchorPreset || 'custom',
            bgAnchorX: nodeConfig.bgAnchorX !== undefined ? nodeConfig.bgAnchorX : 0.5,
            bgAnchorY: nodeConfig.bgAnchorY !== undefined ? nodeConfig.bgAnchorY : 0.5,
            fgAnchorPreset: nodeConfig.fgAnchorPreset || 'custom',
            fgAnchorX: nodeConfig.fgAnchorX !== undefined ? nodeConfig.fgAnchorX : 0.5,
            fgAnchorY: nodeConfig.fgAnchorY !== undefined ? nodeConfig.fgAnchorY : 0.5,
            activeFgKey: nodeConfig.activeFgKey || '',
            defaultFgX: nodeConfig.defaultFgX !== undefined ? nodeConfig.defaultFgX : 0,
            defaultFgY: nodeConfig.defaultFgY !== undefined ? nodeConfig.defaultFgY : 0,
            resourceId: resourceId
        });

        const mNode = nodes[0];
        if (mNode) {
            mNode.scale.set(
                nodeConfig.scaleX !== undefined ? nodeConfig.scaleX : nodeConfig.scale,
                nodeConfig.scaleY !== undefined ? nodeConfig.scaleY : nodeConfig.scale
            );
            mNode.x = nodeConfig.x;
            mNode.y = nodeConfig.y;
            if (nodeConfig.rotation !== undefined) mNode.rotation = nodeConfig.rotation;
            if (nodeConfig.alpha !== undefined) mNode.alpha = nodeConfig.alpha;
        }
    }
}

export async function serializeStandDiff(node, dest, randomDir, zipPrefix, addFileToZip) {
    let data = {
        type: "standDiff",
        path: randomDir,
        name: node.name,
        bgInfo: {
            name: node.nodeData.bgInfo.name,
            savedName: "bg_" + node.nodeData.bgInfo.name
        },
        fgList: node.nodeData.fgList.map((fg, idx) => ({
            name: fg.name,
            savedName: `fg_${idx}_` + fg.name,
            x: fg.x,
            y: fg.y
        })),
        activeFgKey: node.nodeData.activeFgKey,
        defaultFgX: node.nodeData.defaultFgX,
        defaultFgY: node.nodeData.defaultFgY,
        bgAnchorPreset: node.nodeData.bgAnchorPreset,
        bgAnchorX: node.nodeData.bgAnchorX,
        bgAnchorY: node.nodeData.bgAnchorY,
        fgAnchorPreset: node.nodeData.fgAnchorPreset,
        fgAnchorX: node.nodeData.fgAnchorX,
        fgAnchorY: node.nodeData.fgAnchorY,
        scale: node.scale.x,
        scaleX: node.scale.x,
        scaleY: node.scale.y,
        x: node.x,
        y: node.y,
        rotation: node.rotation,
        alpha: node.alpha
    };

    // Add background image to zip
    await addFileToZip(dest, zipPrefix + randomDir + "/" + data.bgInfo.savedName, node.nodeData.bgInfo.url);

    // Add foreground images to zip
    for (let i = 0; i < node.nodeData.fgList.length; i++) {
        const fg = node.nodeData.fgList[i];
        const savedName = `fg_${i}_` + fg.name;
        await addFileToZip(dest, zipPrefix + randomDir + "/" + savedName, fg.url);
    }

    return data;
}

export async function loadPreviewStandDiff(nodeConfig, mCacheNode) {
    const bgInfo = {
        name: nodeConfig.bgInfo.name,
        url: 'export/' + nodeConfig.path + '/' + nodeConfig.bgInfo.savedName
    };

    const fgList = [];
    for (let fgConfig of nodeConfig.fgList) {
        fgList.push({
            name: fgConfig.name,
            url: 'export/' + nodeConfig.path + '/' + fgConfig.savedName,
            x: (fgConfig.x !== undefined && fgConfig.x !== null && fgConfig.x !== '') ? Number(fgConfig.x) : null,
            y: (fgConfig.y !== undefined && fgConfig.y !== null && fgConfig.y !== '') ? Number(fgConfig.y) : null
        });
    }

    if (typeof this.addStandDiffNode === 'function') {
        const nodes = await this.addStandDiffNode(bgInfo, fgList, {
            name: nodeConfig.name,
            bgAnchorPreset: nodeConfig.bgAnchorPreset || 'custom',
            bgAnchorX: nodeConfig.bgAnchorX !== undefined ? nodeConfig.bgAnchorX : 0.5,
            bgAnchorY: nodeConfig.bgAnchorY !== undefined ? nodeConfig.bgAnchorY : 0.5,
            fgAnchorPreset: nodeConfig.fgAnchorPreset || 'custom',
            fgAnchorX: nodeConfig.fgAnchorX !== undefined ? nodeConfig.fgAnchorX : 0.5,
            fgAnchorY: nodeConfig.fgAnchorY !== undefined ? nodeConfig.fgAnchorY : 0.5,
            activeFgKey: nodeConfig.activeFgKey || '',
            defaultFgX: nodeConfig.defaultFgX !== undefined ? nodeConfig.defaultFgX : 0,
            defaultFgY: nodeConfig.defaultFgY !== undefined ? nodeConfig.defaultFgY : 0
        });

        const mNode = nodes[0];
        if (mNode) {
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
}
