export async function loadRect(nodeConfig) {
    let rectNodes = await this.addRectNode({
        width: nodeConfig.width,
        height: nodeConfig.height,
        fill: nodeConfig.fill,
        radius: nodeConfig.radius,
        borderWidth: nodeConfig.borderWidth,
        borderColor: nodeConfig.borderColor,
        name: nodeConfig.name
    });
    let mNode = rectNodes[0];
    if (mNode) {
        mNode.scale.set(nodeConfig.scale);
        mNode.x = nodeConfig.x;
        mNode.y = nodeConfig.y;
        if (nodeConfig.rotation !== undefined) mNode.rotation = nodeConfig.rotation;
        if (nodeConfig.alpha !== undefined) mNode.alpha = nodeConfig.alpha;
    }
}

export async function serializeRect(node, dest, randomDir, zipPrefix, addFileToZip) {
    let data = {
        type: "rect",
        name: node.name,
        width: node._rectWidth,
        height: node._rectHeight,
        fill: node._rectFill,
        radius: node._rectRadius,
        borderWidth: node._rectBorderWidth,
        borderColor: node._rectBorderColor,
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

export async function loadPreviewRect(nodeConfig, mCacheNode) {
    let rectNodes = await this.addRectNode({
        width: nodeConfig.width,
        height: nodeConfig.height,
        fill: nodeConfig.fill,
        radius: nodeConfig.radius,
        borderWidth: nodeConfig.borderWidth,
        borderColor: nodeConfig.borderColor,
        name: nodeConfig.name
    });
    let mNode = rectNodes[0];
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
