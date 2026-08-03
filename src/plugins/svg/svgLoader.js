export async function loadSvg(nodeConfig) {
    let svgNodes = await this.addSvgNode({
        name: nodeConfig.name,
        svgCode: nodeConfig.svgCode
    });
    let mNode = svgNodes[0];
    if (mNode) {
        if (nodeConfig.scaleX !== undefined && nodeConfig.scaleY !== undefined) {
            mNode.scale.set(nodeConfig.scaleX, nodeConfig.scaleY);
        } else if (nodeConfig.scale !== undefined) {
            mNode.scale.set(nodeConfig.scale);
        }
        mNode.x = nodeConfig.x;
        mNode.y = nodeConfig.y;
        if (nodeConfig.rotation !== undefined) mNode.rotation = nodeConfig.rotation;
        if (nodeConfig.alpha !== undefined) mNode.alpha = nodeConfig.alpha;
    }
}

export async function serializeSvg(node, dest, randomDir, zipPrefix, addFileToZip) {
    let data = {
        type: "svg",
        name: node.name,
        svgCode: node.nodeData ? node.nodeData.svgCode : "",
        scaleX: node.scale.x,
        scaleY: node.scale.y,
        x: node.x,
        y: node.y,
        rotation: node.rotation,
        alpha: node.alpha
    };
    return data;
}

export async function loadPreviewSvg(nodeConfig, mCacheNode) {
    let svgNodes = await this.addSvgNode({
        name: nodeConfig.name,
        svgCode: nodeConfig.svgCode
    });
    let mNode = svgNodes[0];
    if (mNode) {
        if (nodeConfig.scaleX !== undefined && nodeConfig.scaleY !== undefined) {
            mNode.scale.set(nodeConfig.scaleX, nodeConfig.scaleY);
        } else if (nodeConfig.scale !== undefined) {
            mNode.scale.set(nodeConfig.scale);
        }
        mNode.x = nodeConfig.x;
        mNode.y = nodeConfig.y;
        if (nodeConfig.rotation !== undefined) mNode.rotation = nodeConfig.rotation;
        if (nodeConfig.alpha !== undefined) mNode.alpha = nodeConfig.alpha;
        mCacheNode.push(mNode);
    }
}
