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
        mNode.rotation = nodeConfig.rotation;
        mNode.alpha = nodeConfig.alpha;
    }
}
export default loadRect;
