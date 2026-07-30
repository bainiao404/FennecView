/**
 * FennecView Canvas Engine - Modular ES6 version
 * Setup PixiJS application, world container, and ruler elements.
 */

export function createFennecViewCanvas(userOptions = {}) {
    let canvas = {};
    canvas.world = null;
    canvas.app = null;
    canvas.box = null;

    /**
     * Create canvas scale ruler
     */
    canvas.createCanvasRuler = function (options) {
        const {
            unitSize = 100,
            fontSize = 15,
            color = "0x666666",
            update = 100,
            tickLength = 5,
        } = options;
        const rulerContainer = new PIXI.Container();
        const xAxis = new PIXI.Graphics();
        const yAxis = new PIXI.Graphics();
        const xLabels = new PIXI.Container();
        const yLabels = new PIXI.Container();
 
        let saveConfig = null;
 
        rulerContainer.addChild(xAxis, yAxis, xLabels, yLabels);
 
        let lastUpdate = 0;
 
        rulerContainer.updateRuler = (config = {}) => {
            if (deepCompare(config, saveConfig)) {
                return;
            }
            const now = Date.now();
            if (now - lastUpdate < update) return;
            lastUpdate = now;
            saveConfig = config;
            const { startX = 0, startY = 0, scale = 1, width = 100, height = 100 } = config;
            
            [xAxis, yAxis, xLabels, yLabels].forEach((c) => c.removeChildren());
            const Params = {
                unit: unitSize,
                tickLen: tickLength,
                fontSize: fontSize,
            };
            
            xAxis.clear();
            xAxis.moveTo(0, 0).lineTo(width, 0);
 
            for (let x = Params.unit; x <= width; x += Params.unit) {
                const value = (x - startX) / scale;
                xAxis.moveTo(x, 0).lineTo(x, Params.tickLen);
 
                const text = new PIXI.Text({
                    text: value.toFixed(),
                    style: {
                        fontSize: Params.fontSize,
                        fill: color,
                    }
                });
                text.position.set(x - text.width / 2, Params.tickLen + 2);
                xLabels.addChild(text);
            }
            xAxis.stroke({ width: 1, color });
 
            yAxis.clear();
            yAxis.moveTo(0, 0).lineTo(0, height);
 
            for (let y = Params.unit; y <= height; y += Params.unit) {
                const value = (y - startY) / scale;
                yAxis.moveTo(0, y).lineTo(Params.tickLen, y);
 
                const text = new PIXI.Text({
                    text: value.toFixed(),
                    style: {
                        fontSize: Params.fontSize,
                        fill: color,
                    }
                });
                text.rotation = 90 * (Math.PI / 180);
                text.position.set(Params.tickLen + text.height, y - text.width / 2);
                yLabels.addChild(text);
            }
            yAxis.stroke({ width: 1, color });
 
            function deepCompare(obj1, obj2) {
                if (obj1 === obj2) return true;
                if (
                    typeof obj1 !== "object" ||
                    typeof obj2 !== "object" ||
                    obj1 === null ||
                    obj2 === null
                ) {
                    return false;
                }
                const keys1 = Object.keys(obj1);
                const keys2 = Object.keys(obj2);
                if (keys1.length !== keys2.length) return false;
                for (const key of keys1) {
                    if (!keys2.includes(key) || !deepCompare(obj1[key], obj2[key])) {
                        return false;
                    }
                }
                return true;
            }
        };
        
        rulerContainer.updateRuler();
        return rulerContainer;
    };
 
    /**
     * Create origin crosshair
     */
    canvas.createOriginCrosshair = function (options = {}) {
        const graphics = new PIXI.Graphics();
        graphics.redraw = function (options) {
            const {
                startX = 0,
                startY = 0,
                width = 50,
                height = 50,
                scale = 1,
            } = options;
 
            this.clear();
 
            this.moveTo(-startX / scale, 0)
                .lineTo((-startX + width) / scale, 0)
                .stroke({ width: 1 / scale, color: 0xff0000, alpha: 1 });
 
            this.moveTo(0, -startY / scale)
                .lineTo(0, (-startY + height) / scale)
                .stroke({ width: 1 / scale, color: 0x00ff00, alpha: 1 });
        };
        return graphics;
    };
 
    canvas.initialize = async function (userOptions = {}) {
        let options = {
            canvas: {
                background: "#535353",
                antialias: false,
                resolution: 1,
                width: 1280,
                height: 720,
                hello: true,
                useContextAlpha: false,
            },
            ruler: false,
            ...userOptions,
        };
        canvas.options = options;
        let app = new PIXI.Application();
        await app.init(options.canvas);
        if (PIXI.Assets) {
            PIXI.Assets.setPreferences({
                preferCreateImageBitmap: false
            });
        }
        app.ticker.maxFPS = 60;
        canvas.app = app;
        
        const background = new PIXI.Graphics();
        background.backgroundColor = "#ffffff";
        background.alpha = 0;
        background.redraw = function (color) {
            if (color) {
                this.backgroundColor = color;
            }
            this.clear()
                .rect(0, 0, app.screen.width, app.screen.height)
                .fill({ color: this.backgroundColor });
        };
        app.ticker.add(() => {
            if (background.width != app.screen.width || background.height != app.screen.height) {
                background.redraw();
            }
        });
        app.stage.addChild(background);
        canvas.background = background;
        
        let world = new PIXI.Container();
        let box = new PIXI.Container();
        world.name = "world";
        canvas.world = world;
        canvas.box = box;
        world.addChild(box);
        app.stage.addChild(world);
        
        if (options.ruler) {
            let ruler = canvas.createCanvasRuler({
                app: app,
                unitSize: 50,
                tickLength: 6,
                fontSize: 12,
                color: "0x1e1e1e",
            });
            canvas.ruler = ruler;
            app.stage.addChild(ruler);
        }
    };
 
    return canvas;
}
