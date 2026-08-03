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
    get name() {
        return this.node ? this.node.name : '';
    }
    set name(val) {
        if (this.node) this.node.name = val;
    }
    get x() {
        return this.node ? this.node.x : 0;
    }
    set x(val) {
        if (this.node) this.node.x = parseFloat(val);
    }
    get y() {
        return this.node ? this.node.y : 0;
    }
    set y(val) {
        if (this.node) this.node.y = parseFloat(val);
    }
    get scaleX() {
        return this.node ? this.node.scale.x : 1;
    }
    set scaleX(val) {
        if (this.node) this.node.scale.x = parseFloat(val);
    }
    get scaleY() {
        return this.node ? this.node.scale.y : 1;
    }
    set scaleY(val) {
        if (this.node) this.node.scale.y = parseFloat(val);
    }
    get rotation() {
        return this.node ? (this.node.rotation * 180) / Math.PI : 0;
    }
    set rotation(val) {
        if (this.node) this.node.rotation = (parseFloat(val) * Math.PI) / 180;
    }
    get alpha() {
        return this.node ? this.node.alpha : 1;
    }
    set alpha(val) {
        if (this.node) this.node.alpha = Math.max(0, Math.min(1, parseFloat(val)));
    }
    get width() {
        return this.node ? this.node.width : 0;
    }
    set width(val) {
        if (this.node) this.node.width = parseFloat(val);
    }
    get height() {
        return this.node ? this.node.height : 0;
    }
    set height(val) {
        if (this.node) this.node.height = parseFloat(val);
    }
    updateProperty(key, value) {
        const setterName = `set${key.charAt(0).toUpperCase() + key.slice(1)}`;
        let handled = false;
        if (typeof this[setterName] === 'function') {
            this[setterName](value);
            handled = true;
        } else if (key in this) {
            this[key] = value;
            handled = true;
        }

        if (handled && window.FennecView?.canvas?.app) {
            window.FennecView.canvas.app.render();
        }
        return handled;
    }
}
