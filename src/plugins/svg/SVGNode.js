import { useUIStore } from '@/stores/uiStore'
import { node } from '@/fennec-view/nodes/BaseNode'

const DEFAULT_SVG_TEMPLATE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <circle cx="100" cy="100" r="80" fill="#0052d9" stroke="#ffffff" stroke-width="4" />
</svg>`;

function getScaledSvgCode(svgCode, scale) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgCode, 'image/svg+xml');
        const svgEl = doc.querySelector('svg');
        if (!svgEl) return svgCode;

        let viewBox = svgEl.getAttribute('viewBox');
        let widthStr = svgEl.getAttribute('width');
        let heightStr = svgEl.getAttribute('height');

        let width = parseFloat(widthStr);
        let height = parseFloat(heightStr);

        if (viewBox && (isNaN(width) || isNaN(height))) {
            const parts = viewBox.split(/\s+/).map(parseFloat);
            if (parts.length === 4) {
                width = parts[2];
                height = parts[3];
            }
        }

        if (isNaN(width) || isNaN(height)) {
            width = 200;
            height = 200;
        }

        if (!viewBox) {
            svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }

        svgEl.setAttribute('width', String(width * scale));
        svgEl.setAttribute('height', String(height * scale));

        const serializer = new XMLSerializer();
        return serializer.serializeToString(doc);
    } catch (e) {
        console.error("Scale SVG failed:", e);
        return svgCode;
    }
}

function sanitizeSvgGradients(svgCode) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgCode, 'image/svg+xml');
        
        // 1. Sanitize stop offsets (e.g. "100%" -> "1", "0%" -> "0")
        const stops = doc.querySelectorAll('stop');
        stops.forEach(stop => {
            const offsetAttr = stop.getAttribute('offset');
            if (offsetAttr && offsetAttr.trim().endsWith('%')) {
                const val = parseFloat(offsetAttr);
                if (!isNaN(val)) {
                    stop.setAttribute('offset', String(val / 100));
                }
            }
        });

        // 2. Sanitize linearGradient coordinates if they are percentages
        const linearGradients = doc.querySelectorAll('linearGradient');
        linearGradients.forEach(grad => {
            ['x1', 'y1', 'x2', 'y2'].forEach(attr => {
                const valStr = grad.getAttribute(attr);
                if (valStr && valStr.trim().endsWith('%')) {
                    const val = parseFloat(valStr);
                    if (!isNaN(val)) {
                        grad.setAttribute(attr, String(val / 100));
                    }
                }
            });
        });

        // 3. Sanitize radialGradient coordinates if they are percentages
        const radialGradients = doc.querySelectorAll('radialGradient');
        radialGradients.forEach(grad => {
            ['cx', 'cy', 'r', 'fx', 'fy'].forEach(attr => {
                const valStr = grad.getAttribute(attr);
                if (valStr && valStr.trim().endsWith('%')) {
                    const val = parseFloat(valStr);
                    if (!isNaN(val)) {
                        grad.setAttribute(attr, String(val / 100));
                    }
                }
            });
        });

        const serializer = new XMLSerializer();
        return serializer.serializeToString(doc);
    } catch (e) {
        console.error("Sanitize SVG gradients failed:", e);
        return svgCode;
    }
}

export class svgNode extends node {
    static exposedAttributes = ["node"];
    type = "svg";

    constructor(src, options = {}) {
        super();
        this._svgCode = DEFAULT_SVG_TEMPLATE;
        this._renderMode = options.renderMode || 'texture'; // default to Texture Mode
        this._resolution = options.resolution || 1; // default to 1x resolution for texture fallback mode
        this.currentBlobUrl = null;
        this._svgSprite = null;
        this._svgGraphics = null;
        return this.start(src, options);
    }

    async start(src, options = {}) {
        try {
            let url = "";
            if (typeof src === 'string') {
                url = src;
            } else if (Array.isArray(src)) {
                const item = src[0];
                if (typeof item === 'string') {
                    url = item;
                } else if (item && typeof item === 'object') {
                    url = (item.path && item.path[0]) ? item.path[0] : "";
                }
            } else if (src && typeof src === 'object') {
                url = (src.path && src.path[0]) ? src.path[0] : "";
            }

            if (url) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        this._svgCode = await response.text();
                    }
                } catch (e) {
                    console.error("加载外部 SVG 文件内容失败:", e);
                }
            } else if (options.svgCode) {
                this._svgCode = options.svgCode;
            }

            const container = new PIXI.Container();
            container.name = (options.name) || (src && typeof src === 'object' && src.name) || "SVG Node";
            container.url = url.replace(/\\/g, "/");
            container.position.set(0, 0);

            this.setNode(container);

            const border = new PIXI.Graphics();
            border.visible = false;

            // Wait for node attachment then perform initial rendering draw
            await this.redraw();
            container.addChild(border);

            container.setDebug = (state = false) => {
                const uiStore = useUIStore();
                let w = container.width;
                let h = container.height;
                if (this._renderMode === 'texture' && this._svgSprite) {
                    w = this._svgSprite.width;
                    h = this._svgSprite.height;
                } else if (this._renderMode === 'vector' && this._svgGraphics) {
                    w = this._svgGraphics.width;
                    h = this._svgGraphics.height;
                }
                border.clear()
                    .rect(0, 0, w, h)
                    .stroke({ width: 4, color: 0xff0000 });
                border.visible = state && uiStore.debug.enabled;
            };

            return container;
        } catch (err) {
            console.error("创建 SVG 节点异常:", err);
        }
    }

    async redraw() {
        if (!this.node || this.node.destroyed) return;
        const container = this.node;

        if (this._svgSprite) {
            this._svgSprite.destroy();
            this._svgSprite = null;
        }
        if (this._svgGraphics) {
            this._svgGraphics.destroy();
            this._svgGraphics = null;
        }

        try {
            if (this._renderMode === 'vector') {
                try {
                    const sanitizedSvg = sanitizeSvgGradients(this._svgCode);
                    const context = new PIXI.GraphicsContext();
                    context.svg(sanitizedSvg);

                    const graphics = new PIXI.Graphics(context);
                    container.addChildAt(graphics, 0);
                    this._svgGraphics = graphics;
                } catch (vectorError) {
                    console.warn("PixiJS Vector SVG parser failed, auto-falling back to Texture mode:", vectorError);
                    this._renderMode = 'texture';
                    await this.drawAsTexture(container);
                    if (window.FennecView?.refreshPropertyPanel) {
                        window.FennecView.refreshPropertyPanel();
                    }
                }
            } else {
                await this.drawAsTexture(container);
            }

            this.redrawDebugBorder();

            if (window.FennecView?.canvas?.app) {
                window.FennecView.canvas.app.render();
            }
        } catch (e) {
            console.error("绘制 SVG 节点图形异常:", e);
        }
    }

    async drawAsTexture(container) {
        if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl);
        }

        const scaledSvg = getScaledSvgCode(this._svgCode, this._resolution);
        const blob = new Blob([scaledSvg], { type: 'image/svg+xml;charset=utf-8' });
        this.currentBlobUrl = URL.createObjectURL(blob);

        const texture = await PIXI.Assets.load({
            src: this.currentBlobUrl,
            loadParser: 'loadTextures'
        });

        const sprite = new PIXI.Sprite(texture);
        sprite.scale.set(1 / this._resolution);
        container.addChildAt(sprite, 0);
        this._svgSprite = sprite;
    }

    async updateSvgCode(newCode) {
        this._svgCode = newCode;
        await this.redraw();
    }

    redrawDebugBorder() {
        if (this.node && this.node.children[1]) {
            const border = this.node.children[1];
            let w = this.node.width;
            let h = this.node.height;
            if (this._renderMode === 'texture' && this._svgSprite) {
                w = this._svgSprite.width;
                h = this._svgSprite.height;
            } else if (this._renderMode === 'vector' && this._svgGraphics) {
                w = this._svgGraphics.width;
                h = this._svgGraphics.height;
            }
            border.clear()
                .rect(0, 0, w, h)
                .stroke({ width: 4, color: 0xff0000 });
        }
    }

    get svgCode() {
        return this._svgCode;
    }

    set svgCode(val) {
        this.updateSvgCode(val);
    }

    get renderMode() {
        return this._renderMode;
    }

    set renderMode(val) {
        if (val === 'vector' || val === 'texture') {
            if (this._renderMode !== val) {
                this._renderMode = val;
                this.redraw();
            }
        }
    }

    get resolution() {
        return this._resolution;
    }

    set resolution(val) {
        const num = parseInt(val);
        if (num >= 1 && num <= 8 && num !== this._resolution) {
            this._resolution = num;
            if (this._renderMode === 'texture') {
                this.redraw();
            }
        }
    }

    getAttributes() {
        let node = this.node;
        let base = this.getBaseAttributes();
        let attributes = base.attributes;
        attributes.width = this._renderMode === 'texture' && this._svgSprite ? this._svgSprite.width : node.width;
        attributes.height = this._renderMode === 'texture' && this._svgSprite ? this._svgSprite.height : node.height;
        attributes.renderMode = this._renderMode;
        attributes.resolution = this._resolution;
        return { 
            attributes,
            schema: {
                renderMode: {
                    type: 'select',
                    options: [
                        { value: 'vector', label: '矢量渲染 (Graphics Context)' },
                        { value: 'texture', label: '纹理渲染 (Sprite)' }
                    ]
                },
                resolution: {
                    type: 'slider',
                    min: 1,
                    max: 8,
                    step: 1
                }
            }
        };
    }

    getSerializableState() {
        let state = super.getSerializableState();
        if (!state) return null;
        state.type = 'svg';
        state.svgCode = this._svgCode;
        state.renderMode = this._renderMode;
        state.resolution = this._resolution;
        return state;
    }

    destroy() {
        if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl);
        }
        super.destroy();
    }
}
