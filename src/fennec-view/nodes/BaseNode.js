/**
 * FennecView Nodes - Base Node
 */
export class node {
    static exposedAttributes = ["node"];
    constructor() {}
    setNode(pixiNode) {
        this.node = pixiNode;
        pixiNode.nodeData = this;
        return pixiNode;
    }
    getBaseAttributes() {
        let node = this.node;
        let attributes = {
            name: node.name,
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            scaleX: node.scale.x,
            scaleY: node.scale.y,
            rotation: node.rotation,
            alpha: node.alpha
        };
        return {
            attributes,
        };
    }
    getSerializableState() {
        let node = this.node;
        if (!node) return null;
        return {
            name: node.name,
            type: this.type || 'img',
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            scaleX: node.scale.x,
            scaleY: node.scale.y,
            rotation: node.rotation,
            alpha: node.alpha,
            visible: node.visible,
            paused: this.paused
        };
    }
    destroy() {
        if (this.node && !this.node.destroyed) {
            this.node.destroy(true);
        }
        this.node = null;
    }
    get paused() {
        return false;
    }
    set paused(val) {}
    get visible() {
        return this.node ? this.node.visible : false;
    }
    set visible(val) {
        if (this.node) this.node.visible = val;
    }
}
