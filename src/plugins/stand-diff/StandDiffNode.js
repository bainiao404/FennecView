import { useUIStore } from '@/stores/uiStore'
import { node } from '../../fennec-view/nodes/BaseNode'

export class standDiffNode extends node {
    static exposedAttributes = ["node"];
    type = "standDiff";

    constructor(bgInfo, fgList, options = {}) {
        super();
        return this.start(bgInfo, fgList, options);
    }

    async start(bgInfo, fgList, options) {
        try {
            const PIXI = window.PIXI;
            const container = new PIXI.Container();

            // Load background texture
            const bgTexture = await PIXI.Assets.load(bgInfo.url);
            const bgSprite = new PIXI.Sprite(bgTexture);
            container.addChild(bgSprite);

            // Load all foreground textures in parallel for instant switching
            const fgTextures = {};
            const fgListWithOffset = [];

            await Promise.all(fgList.map(async fg => {
                try {
                    const tex = await PIXI.Assets.load(fg.url);
                    fgTextures[fg.name] = tex;
                    fgListWithOffset.push({
                        name: fg.name,
                        url: fg.url,
                        x: (fg.x !== undefined && fg.x !== null && fg.x !== '') ? Number(fg.x) : null,
                        y: (fg.y !== undefined && fg.y !== null && fg.y !== '') ? Number(fg.y) : null
                    });
                } catch (err) {
                    console.error("加载立绘前景图片失败:", fg.name, err);
                }
            }));

            // Initialize foreground sprite
            const fgSprite = new PIXI.Sprite();
            container.addChild(fgSprite);

            // Set instance variables
            this.bgSprite = bgSprite;
            this.fgSprite = fgSprite;
            this.fgTextures = fgTextures;
            this.bgInfo = bgInfo;
            this.fgList = fgListWithOffset;
            this.activeFgKey = options.activeFgKey || (fgListWithOffset[0]?.name || "");

            // Default foreground offsets
            this.defaultFgX = options.defaultFgX !== undefined ? Number(options.defaultFgX) : 0;
            this.defaultFgY = options.defaultFgY !== undefined ? Number(options.defaultFgY) : 0;

            // Anchors
            this.bgAnchorPreset = options.bgAnchorPreset || "custom";
            this.fgAnchorPreset = options.fgAnchorPreset || "custom";
            this.bgAnchorX = options.bgAnchorX !== undefined ? Number(options.bgAnchorX) : 0;
            this.bgAnchorY = options.bgAnchorY !== undefined ? Number(options.bgAnchorY) : 0;
            this.fgAnchorX = options.fgAnchorX !== undefined ? Number(options.fgAnchorX) : 0;
            this.fgAnchorY = options.fgAnchorY !== undefined ? Number(options.fgAnchorY) : 0;

            // Apply presets and anchors
            this.applyBgAnchorPreset();
            this.applyFgAnchorPreset();
            this.applyActiveForeground();

            container.name = options.name || bgInfo.name.replace(/\.[^/.]+$/, "") + "_stand";
            container.url = bgInfo.url;
            
            this.setNode(container);

            // Setup border for debug selection
            const border = new PIXI.Graphics()
                .rect(0, 0, container.width || 100, container.height || 100)
                .stroke({ width: 4, color: 0xff0000 });
            border.visible = false;
            container.addChild(border);
            
            container.setDebug = function (state = false) {
                const uiStore = useUIStore();
                border.clear().rect(0, 0, container.width || 100, container.height || 100).stroke({ width: 4, color: 0xff0000 });
                border.visible = state && uiStore.debug.enabled;
            };

            return container;
        } catch (err) {
            console.error("初始化立绘差分节点异常:", err);
        }
    }

    applyActiveForeground() {
        if (!this.activeFgKey || !this.fgTextures[this.activeFgKey]) {
            this.fgSprite.visible = false;
            return;
        }
        
        this.fgSprite.texture = this.fgTextures[this.activeFgKey];
        this.fgSprite.visible = true;

        // Apply corresponding offset or default
        const fg = this.fgList.find(f => f.name === this.activeFgKey);
        if (fg) {
            const posX = (fg.x !== undefined && fg.x !== null && fg.x !== '') ? Number(fg.x) : this.defaultFgX;
            const posY = (fg.y !== undefined && fg.y !== null && fg.y !== '') ? Number(fg.y) : this.defaultFgY;
            this.fgSprite.position.set(posX, posY);
        }
    }

    setActiveForeground(key) {
        this.activeFgKey = key;
        this.applyActiveForeground();
    }

    setActiveFgKey(key) {
        this.setActiveForeground(key);
    }

    updateForegroundOffset(name, x, y) {
        const fg = this.fgList.find(f => f.name === name);
        if (fg) {
            fg.x = (x !== undefined && x !== null && x !== '') ? Number(x) : null;
            fg.y = (y !== undefined && y !== null && y !== '') ? Number(y) : null;
            this.applyActiveForeground();
        }
    }

    setFgOffset(offsetArray) {
        this.updateForegroundOffset(offsetArray[0], offsetArray[1], offsetArray[2]);
    }

    setDefaultFgOffset(x, y) {
        this.defaultFgX = Number(x);
        this.defaultFgY = Number(y);
        this.applyActiveForeground();
    }

    setDefaultFgX(x) {
        this.setDefaultFgOffset(x, this.defaultFgY);
    }

    setDefaultFgY(y) {
        this.setDefaultFgOffset(this.defaultFgX, y);
    }

    applyBgAnchorPreset() {
        const preset = this.bgAnchorPreset;
        if (preset === "h-center") {
            this.bgAnchorX = 0.5;
        } else if (preset === "v-center") {
            this.bgAnchorY = 0.5;
        } else if (preset === "both") {
            this.bgAnchorX = 0.5;
            this.bgAnchorY = 0.5;
        }
        this.bgSprite.anchor.set(this.bgAnchorX, this.bgAnchorY);
    }

    applyFgAnchorPreset() {
        const preset = this.fgAnchorPreset;
        if (preset === "h-center") {
            this.fgAnchorX = 0.5;
        } else if (preset === "v-center") {
            this.fgAnchorY = 0.5;
        } else if (preset === "both") {
            this.fgAnchorX = 0.5;
            this.fgAnchorY = 0.5;
        }
        this.fgSprite.anchor.set(this.fgAnchorX, this.fgAnchorY);
    }

    setBgAnchorPreset(preset) {
        this.bgAnchorPreset = preset;
        this.applyBgAnchorPreset();
    }

    setFgAnchorPreset(preset) {
        this.fgAnchorPreset = preset;
        this.applyFgAnchorPreset();
    }

    setBgAnchor(x, y) {
        this.bgAnchorX = Number(x);
        this.bgAnchorY = Number(y);
        this.bgSprite.anchor.set(this.bgAnchorX, this.bgAnchorY);
    }

    setBgAnchorX(x) {
        this.setBgAnchor(x, this.bgAnchorY);
    }

    setBgAnchorY(y) {
        this.setBgAnchor(this.bgAnchorX, y);
    }

    setFgAnchor(x, y) {
        this.fgAnchorX = Number(x);
        this.fgAnchorY = Number(y);
        this.fgSprite.anchor.set(this.fgAnchorX, this.fgAnchorY);
    }

    setFgAnchorX(x) {
        this.setFgAnchor(x, this.fgAnchorY);
    }

    setFgAnchorY(y) {
        this.setFgAnchor(this.fgAnchorX, y);
    }

    getAttributes() {
        const attributes = this.getBaseAttributes();
        return {
            attributes,
            bgInfo: this.bgInfo,
            fgList: this.fgList,
            activeFgKey: this.activeFgKey,
            defaultFgX: this.defaultFgX,
            defaultFgY: this.defaultFgY,
            bgAnchorPreset: this.bgAnchorPreset,
            fgAnchorPreset: this.fgAnchorPreset,
            bgAnchorX: this.bgAnchorX,
            bgAnchorY: this.bgAnchorY,
            fgAnchorX: this.fgAnchorX,
            fgAnchorY: this.fgAnchorY
        };
    }

    getSerializableState() {
        const state = super.getSerializableState();
        if (!state) return null;
        state.type = "standDiff";
        state.bgInfo = this.bgInfo;
        state.fgList = this.fgList;
        state.activeFgKey = this.activeFgKey;
        state.defaultFgX = this.defaultFgX;
        state.defaultFgY = this.defaultFgY;
        state.bgAnchorPreset = this.bgAnchorPreset;
        state.fgAnchorPreset = this.fgAnchorPreset;
        state.bgAnchorX = this.bgAnchorX;
        state.bgAnchorY = this.bgAnchorY;
        state.fgAnchorX = this.fgAnchorX;
        state.fgAnchorY = this.fgAnchorY;
        return state;
    }
    setFgKey(key) {
        this.setActiveForeground(key);
    }
    setBgAnchor(preset) {
        this.setBgAnchorPreset(preset);
    }
    setFgAnchor(preset) {
        this.setFgAnchorPreset(preset);
    }
}
