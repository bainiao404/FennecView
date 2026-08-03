import { useUIStore } from '@/stores/uiStore'
import { node } from '@/fennec-view/nodes/BaseNode'

export class textNode extends node {
    static exposedAttributes = ["node"];
    type = "text";
    constructor(text = "Hello World", options = {}) {
        super();
        return this.start(text, options);
    }
    async start(text, options) {
        try {
            const style = new PIXI.TextStyle({
                fontFamily: options.fontFamily || 'Arial',
                fontSize: options.fontSize || 36,
                fill: options.fill || '#ffffff',
                align: options.align || 'left',
            });
            const node = new PIXI.Text({ text, style });
            node.name = options.name || "Text Node";
            node.position.set(0, 0);
            this.setNode(node);
  
            const border = new PIXI.Graphics()
                .rect(0, 0, node.width, node.height)
                .stroke({ width: 4, color: 0xff0000 });
            border.visible = false;
            node.addChild(border);
            node.setDebug = function (state = false) {
                const uiStore = useUIStore();
                border.clear()
                    .rect(0, 0, node.width, node.height)
                    .stroke({ width: 4, color: 0xff0000 });
                border.visible = state && uiStore.debug.enabled;
            };
            return node;
        } catch (err) {
            console.error("创建文本节点异常:", err);
        }
    }
    getAttributes() {
        let node = this.node;
        let base = this.getBaseAttributes();
        let attributes = base.attributes;
        attributes.text = node.text;
        attributes.fontFamily = node.style.fontFamily;
        attributes.fontSize = node.style.fontSize;
        attributes.fill = node.style.fill;
        attributes.align = node.style.align;
        return { 
            attributes,
            schema: {
                align: {
                    type: 'select',
                    options: [
                        { value: 'left', label: 'Left / 左对齐' },
                        { value: 'center', label: 'Center / 居中' },
                        { value: 'right', label: 'Right / 右对齐' }
                    ]
                },
                fontFamily: {
                    type: 'select',
                    options: [
                        { value: 'Arial', label: 'Arial' },
                        { value: 'Times New Roman', label: 'Times New Roman' },
                        { value: 'Courier New', label: 'Courier New' },
                        { value: 'Microsoft YaHei', label: '微软雅黑 / Microsoft YaHei' },
                        { value: 'SimSun', label: '宋体 / SimSun' }
                    ]
                }
            }
        };
    }
    getSerializableState() {
        let state = super.getSerializableState();
        if (!state) return null;
        let node = this.node;
        state.type = 'text';
        state.text = node.text;
        state.fontFamily = node.style.fontFamily;
        state.fontSize = node.style.fontSize;
        state.fill = node.style.fill;
        state.align = node.style.align;
        return state;
    }
    setText(t) {
        if (this.node) {
            this.node.text = t;
            if (this.node.children[0]) {
                this.node.children[0].clear().rect(0, 0, this.node.width, this.node.height).stroke({ width: 4, color: 0xff0000 });
            }
        }
    }
    setFontSize(t) {
        if (this.node) {
            this.node.style.fontSize = parseFloat(t);
            if (this.node.children[0]) {
                this.node.children[0].clear().rect(0, 0, this.node.width, this.node.height).stroke({ width: 4, color: 0xff0000 });
            }
        }
    }
    setFontFamily(t) {
        if (this.node) {
            this.node.style.fontFamily = t;
            if (this.node.children[0]) {
                this.node.children[0].clear().rect(0, 0, this.node.width, this.node.height).stroke({ width: 4, color: 0xff0000 });
            }
        }
    }
    setFill(t) {
        if (this.node) {
            this.node.style.fill = t;
        }
    }
    setAlign(t) {
        if (this.node) {
            this.node.style.align = t;
        }
    }
}
