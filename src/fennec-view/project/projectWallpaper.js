import { isElectron } from '@/assets/gkd-js-0.2/env.js'
import GKD from '@/assets/gkd-js-0.2'
import { MessagePlugin } from 'tdesign-vue-next'
import { useUIStore } from '@/stores/uiStore'
import { blobRegistry } from '@/services/resources/BlobRegistry'

let electronShell = null;
let fse = null;

if (isElectron()) {
    try {
        if (typeof window !== 'undefined' && window.require) {
            electronShell = window.require('electron').shell;
            fse = window.require('fs-extra');
        } else if (typeof require !== 'undefined') {
            electronShell = require('electron').shell;
            fse = require('fs-extra');
        }
    } catch (e) {
        console.error("Failed to load electron shell/fs-extra in projectWallpaper:", e);
    }
}

function openPath(path) {
    if (electronShell) {
        electronShell.openPath(path.replace(/\//g, "\\"));
    }
}

const projectWallpaper = {
    exportWallpaperEngineConfig: {
        title: "FennecViewExport",
        fps: 30,
        resolution: 1,
        iconArrayBuffer: null,
        rect: null,
    },
    
    setExportWallpaperEngineRect: async function () {
        try {
            const rect = await this.getUserRect("请选择壁纸显示区域，将在壁纸模式下自动适配填满屏幕");
            if (!rect) return;
            const worldRect = this.getWindowRectToWorldRect(rect);
            
            this.exportWallpaperEngineConfig.rect = worldRect;
            const uiStore = useUIStore();
            uiStore.updateExportConfig('wallpaperEngine', { rect: worldRect });
        } catch (error) {
            console.error("设置显示区域失败:", error);
        }
    },

    clearExportWallpaperEngineRect: function () {
        this.exportWallpaperEngineConfig.rect = null;
        const uiStore = useUIStore();
        uiStore.updateExportConfig('wallpaperEngine', { rect: null });
    },
    
    setExportWallpaperEngineIcon: async function () {
        try {
            const blob = await this.getScreenshotImg("请选择截取位置，用于设置项目图标");
            if (!blob) return;
            const iconArrayBuffer = await blob.arrayBuffer();
            this.exportWallpaperEngineConfig.iconArrayBuffer = iconArrayBuffer;
            
            const uiStore = useUIStore();
            uiStore.updateExportConfig('wallpaperEngine', { iconArrayBuffer });
            
            const iconElement = document.getElementById("exportWallpaperEngineIcon");
            if (iconElement) {
                const src = blobRegistry.createURL(blob);
                iconElement.src = src;
                setTimeout(() => {
                    blobRegistry.revokeURL(src);
                }, 1000);
            }
        } catch (error) {
            console.error("设置导出图标失败:", error);
        }
    },

    exportWallpaperEngine: async function () {
        if (!fse) {
            console.error("fse is not available. Export is only supported in Electron.");
            return;
        }
        let world = this.canvas.world;
        let box = this.canvas.box;
        let background = this.canvas.background;
        let config = {
            world: {
                scale: world.scale.x,
                x: world.x,
                y: world.y,
            },
            rect: this.exportWallpaperEngineConfig.rect || null,
            box: {
                node: [],
            },
            background: {
                color: background.backgroundColor,
                alpha: background.alpha,
            },
            fps: this.exportWallpaperEngineConfig.fps,
            resolution: this.exportWallpaperEngineConfig.resolution,
        };
        let boxConfi = config.box;
        let path = this.path.data + "/Export/" + GKD.time.getCurrentDate("YYYYMMDDHHmmss") + "/";
        let dirName = typeof __dirname !== 'undefined' ? __dirname : (window.__dirname || '');
        fse.copySync(dirName, path);
        let exportPath = path + "export/";
        let project = {
            file: "index.html",
            preview: "preview.png",
            title: this.exportWallpaperEngineConfig.title,
            visibility: "public",
        };
        if (this.exportWallpaperEngineConfig.iconArrayBuffer) {
            GKD.fs.saveFile(path + "preview.png", this.exportWallpaperEngineConfig.iconArrayBuffer);
        }
        for (var i = 0; i < box.children.length; i++) {
            let node = box.children[i];
            if (node.nodeData) {
                let data = await this.copyNodeAssets(node, exportPath, false);
                if (data) {
                    boxConfi.node.push(data);
                }
            }
        }
        fse.outputJsonSync(exportPath + "config.json", config);
        fse.outputJsonSync(path + "project.json", project);
        openPath(path);
        MessagePlugin.success("导出项目完成");
    }
};

export default projectWallpaper;
