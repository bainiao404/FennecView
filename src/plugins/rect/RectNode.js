import { useUIStore } from '@/stores/uiStore'
import { node } from '@/fennec-view/nodes/BaseNode'

export class rectNode extends node {
    static exposedAttributes = ["node"];
    type = "rect";
    constructor(options = {}) {
        super();
        return this.start(options);
    }
    async start(options) {
        try {
            const graphics = new PIXI.Graphics();
            graphics.name = options.name || "Rectangle Node";
            graphics.position.set(0, 0);
            
            graphics._rectWidth = options.width || 200;
            graphics._rectHeight = options.height || 150;
            graphics._rectFill = options.fill || '#0052d9';
            graphics._rectRadius = options.radius !== undefined ? options.radius : 0;
            graphics._rectBorderWidth = options.borderWidth !== undefined ? options.borderWidth : 0;
            graphics._rectBorderColor = options.borderColor || '#ffffff';
            
            this.setNode(graphics);
            this.redraw();

            const border = new PIXI.Graphics();
            border.visible = false;
            graphics.addChild(border);
            
            graphics.setDebug = (state = false) => {
                const uiStore = useUIStore();
                border.clear();
                if (graphics._rectRadius > 0) {
                    border.roundRect(0, 0, graphics._rectWidth, graphics._rectHeight, graphics._rectRadius);
                } else {
                    border.rect(0, 0, graphics._rectWidth, graphics._rectHeight);
                }
                border.stroke({ width: 4, color: 0xff0000 });
                border.visible = state && uiStore.debug.enabled;
            };

            return graphics;
        } catch (err) {
            console.error("创建矩形节点异常:", err);
        }
    }

    redraw() {
        const graphics = this.node;
        if (!graphics) return;
        
        graphics.clear();
        if (graphics._rectRadius > 0) {
            graphics.roundRect(0, 0, graphics._rectWidth, graphics._rectHeight, graphics._rectRadius);
        } else {
            graphics.rect(0, 0, graphics._rectWidth, graphics._rectHeight);
        }
        
        const color = parseInt(graphics._rectFill.replace('#', '0x'), 16);
        graphics.fill({ color });
        
        if (graphics._rectBorderWidth > 0) {
            const strokeColor = parseInt(graphics._rectBorderColor.replace('#', '0x'), 16);
            graphics.stroke({ width: graphics._rectBorderWidth, color: strokeColor });
        }

        if (graphics.children[0]) {
            const border = graphics.children[0];
            border.clear();
            if (graphics._rectRadius > 0) {
                border.roundRect(0, 0, graphics._rectWidth, graphics._rectHeight, graphics._rectRadius);
            } else {
                border.rect(0, 0, graphics._rectWidth, graphics._rectHeight);
            }
            border.stroke({ width: 4, color: 0xff0000 });
        }
    }

    getAttributes() {
        let graphics = this.node;
        let base = this.getBaseAttributes();
        let attributes = base.attributes;
        attributes.width = graphics._rectWidth;
        attributes.height = graphics._rectHeight;
        attributes.fill = graphics._rectFill;
        attributes.radius = graphics._rectRadius;
        attributes.borderWidth = graphics._rectBorderWidth;
        attributes.borderColor = graphics._rectBorderColor;
        return { 
            attributes,
            schema: {
                radius: {
                    type: 'slider',
                    min: 0,
                    max: 200,
                    step: 1
                },
                borderWidth: {
                    type: 'slider',
                    min: 0,
                    max: 50,
                    step: 1
                }
            }
        };
    }

    getSerializableState() {
        let state = super.getSerializableState();
        if (!state) return null;
        let graphics = this.node;
        state.type = 'rect';
        state.width = graphics._rectWidth;
        state.height = graphics._rectHeight;
        state.fill = graphics._rectFill;
        state.radius = graphics._rectRadius;
        state.borderWidth = graphics._rectBorderWidth;
        state.borderColor = graphics._rectBorderColor;
        return state;
    }

    get width() {
        return this.node ? this.node._rectWidth : 0;
    }
    set width(val) {
        if (this.node) {
            this.node._rectWidth = parseFloat(val);
            this.redraw();
        }
    }
    get height() {
        return this.node ? this.node._rectHeight : 0;
    }
    set height(val) {
        if (this.node) {
            this.node._rectHeight = parseFloat(val);
            this.redraw();
        }
    }

    setRectWidth(t) {
        if (this.node) {
            this.node._rectWidth = parseFloat(t);
            this.redraw();
        }
    }
    setRectHeight(t) {
        if (this.node) {
            this.node._rectHeight = parseFloat(t);
            this.redraw();
        }
    }
    setRectFill(t) {
        if (this.node) {
            this.node._rectFill = t;
            this.redraw();
        }
    }
    setRectRadius(t) {
        if (this.node) {
            this.node._rectRadius = parseFloat(t);
            this.redraw();
        }
    }
    setRectBorderWidth(t) {
        if (this.node) {
            this.node._rectBorderWidth = parseFloat(t);
            this.redraw();
        }
    }
    setRectBorderColor(t) {
        if (this.node) {
            this.node._rectBorderColor = t;
            this.redraw();
        }
    }
}
