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
        mNode.rotation = nodeConfig.rotation;
        mNode.alpha = nodeConfig.alpha;
    }
}
export default loadText;
