import { floorToEven, hexToRgba } from '@/utils/baseScript'
import { MessagePlugin } from 'tdesign-vue-next'
import { blobRegistry } from '@/services/resources/BlobRegistry'

import { Rectangle } from 'pixi.js'

const screenshotMethods = {
    downloadScreenshotImg: async function () {
        let blob = await this.getScreenshotImg("选取截图区域，单击截取整个场景");
        if (!blob) return;
        const link = document.createElement("a");
        link.href = blobRegistry.createURL(blob);
        link.download = `screenshot_${new Date().toISOString().slice(0, 10)}.png`;
        link.click();
        this.setUI(true);
        setTimeout(() => {
            blobRegistry.revokeURL(link.href);
        }, 1000);
    },
    
    getScreenshotImg: async function (text) {
        let rect = await this.getUserRect(text);
        let worldRect = rect ? this.getWindowRectToWorldRect(rect) : rect;
        let mRect = worldRect || this.canvas.box.getLocalBounds();
        if (mRect.width * mRect.height > 10000 * 10000) {
            MessagePlugin.warning("尺寸过大，无法截取,请重新截取区域！");
            return;
        }
        if (mRect.width * mRect.height > 3000 * 3000) {
            MessagePlugin.info(
                "场景尺寸：" +
                    Math.round(mRect.width) +
                    "x" +
                    Math.round(mRect.height) +
                    "较大，请稍适等待"
            );
        }
        let blob = await this.getCanvasImg("blob", rect);
        return blob;
    },
    
    getCanvasImg: async function (type = "blob", rect) {
        let canvas = this.canvas;
        let app = canvas.app;
        let background = canvas.background;
        const activeNode = this.click.current;
        this.setUI(false);
        let box = canvas.box;
        let world = canvas.world;
        const localPos = rect ? world.toLocal({ x: rect.x, y: rect.y }) : null;
        let scale = world.scale.x;
        world.scale.set(1);
        app.render();
        box.children.forEach((node) => {
            if (node.setDebug) {
                node.setDebug(false);
            }
        });
        let screenshot = null;
        if (rect) {
            screenshot = await app.renderer.extract.canvas({
                target: box,
                frame: new Rectangle(
                    localPos.x,
                    localPos.y,
                    floorToEven(rect.width / scale),
                    floorToEven(rect.height / scale)
                )
            });
        } else {
            screenshot = await app.renderer.extract.canvas({ target: box });
        }
        if (background && background.alpha) {
            const finalCanvas = document.createElement("canvas");
            finalCanvas.width = screenshot.width;
            finalCanvas.height = screenshot.height;
            const ctx = finalCanvas.getContext("2d");
            ctx.fillStyle = hexToRgba(background.backgroundColor, background.alpha);
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            ctx.drawImage(screenshot, 0, 0);
            screenshot = finalCanvas;
        }
        world.scale.set(scale);
        if (activeNode && activeNode.setDebug) {
            activeNode.setDebug(true);
        }
        this.setUI(true);
        switch (type) {
            case "blob":
                return new Promise((resolve) => {
                    screenshot.toBlob((blob) => {
                        resolve(blob);
                    }, "image/png");
                });
            case "canvas":
                return screenshot;
            case "img":
                const base64 = screenshot.toDataURL("image/png");
                const img = document.createElement("img");
                img.src = base64;
                return img;
            case "base64":
                return screenshot.toDataURL("image/png");
        }
    }
};

export default screenshotMethods;
