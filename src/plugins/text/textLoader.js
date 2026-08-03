export async function loadText(nodeConfig) {
    let textNodes = await this.addTextNode(nodeConfig.text, {
        fontFamily: nodeConfig.fontFamily,
        fontSize: nodeConfig.fontSize,
        fill: nodeConfig.fill,
        align: nodeConfig.align,
        name: nodeConfig.name
    });
    let mNode = textNodes[0];
    if (mNode) {
        mNode.scale.set(nodeConfig.scale);
        mNode.x = nodeConfig.x;
        mNode.y = nodeConfig.y;
        if (nodeConfig.rotation !== undefined) mNode.rotation = nodeConfig.rotation;
        if (nodeConfig.alpha !== undefined) mNode.alpha = nodeConfig.alpha;
    }
}

export async function serializeText(node, dest, randomDir, zipPrefix, addFileToZip) {
    let data = {
        type: "text",
        name: node.name,
        text: node.text,
        fontFamily: node.style.fontFamily,
        fontSize: node.style.fontSize,
        fill: node.style.fill,
        align: node.style.align,
        scale: node.scale.x,
        scaleX: node.scale.x,
        scaleY: node.scale.y,
        x: node.x,
        y: node.y,
        rotation: node.rotation,
        alpha: node.alpha,
    };
    return data;
}

export async function loadPreviewText(nodeConfig, mCacheNode) {
    let textNodes = await this.addTextNode(nodeConfig.text, {
        fontFamily: nodeConfig.fontFamily,
        fontSize: nodeConfig.fontSize,
        fill: nodeConfig.fill,
        align: nodeConfig.align,
        name: nodeConfig.name
    });
    let mNode = textNodes[0];
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
        mCacheNode.push(mNode);
    }
}
