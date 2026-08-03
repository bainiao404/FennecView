import { isElectron } from '@/assets/gkd-js-0.2/env.js'
import GKD from '@/assets/gkd-js-0.2'
import { MessagePlugin } from 'tdesign-vue-next'
import { useUIStore } from '@/stores/uiStore'
import { blobRegistry } from '@/services/resources/BlobRegistry'
import JSZip from 'jszip'
import { ioManager } from '@/services/io/IOManager'

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
        MessagePlugin.loading("正在导出 Wallpaper Engine 项目...");
        
        try {
            const driver = ioManager.getDriver();
            const zip = new JSZip();
            
            // 1. 获取打包生成的所有前端代码文件清单 (assets-manifest.json)
            let manifestFiles = [];
            try {
                let manifestPath = 'assets-manifest.json';
                if (isElectron()) {
                    const dirName = typeof __dirname !== 'undefined' ? __dirname : (window.__dirname || '');
                    manifestPath = (dirName + "/" + manifestPath).replace(/\/+/g, '/').replace(/^\/([a-zA-Z]:)/, '$1');
                }
                const manifestBuffer = await driver.read(manifestPath);
                const textDecoder = new TextDecoder();
                manifestFiles = JSON.parse(textDecoder.decode(manifestBuffer));
            } catch (e) {
                console.error("加载 assets-manifest.json 失败:", e);
                throw new Error("未找到资源清单 (assets-manifest.json)，请确保运行在编译发布版本中");
            }
            
            // 2. 将编译后的前端程序资源文件写入 Zip
            for (const file of manifestFiles) {
                let filePath = file;
                if (isElectron()) {
                    const dirName = typeof __dirname !== 'undefined' ? __dirname : (window.__dirname || '');
                    filePath = (dirName + "/" + file).replace(/\/+/g, '/').replace(/^\/([a-zA-Z]:)/, '$1');
                }
                try {
                    const fileData = await driver.read(filePath);
                    zip.file(file, fileData);
                } catch (err) {
                    console.warn(`无法加载前端文件 ${file}:`, err);
                }
            }
            
            // 3. 构建场景配置及导出模型节点
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
            
            let boxConfig = config.box;
            
            for (let i = 0; i < box.children.length; i++) {
                let node = box.children[i];
                if (node.nodeData) {
                    // 使用 zipPrefix = "export/" 将模型的资源打包输出到 zip 内的 export/assets/randomDir 目录中
                    let data = await this.copyNodeAssets(node, zip, true, "export/");
                    if (data) {
                        data.resourceId = node.resourceId || "";
                        boxConfig.node.push(data);
                    }
                }
            }
            
            zip.file("export/config.json", JSON.stringify(config, null, 4));
            
            // 4. 创建 Wallpaper Engine 专属元数据配置文件
            let project = {
                file: "index.html",
                preview: "preview.png",
                title: this.exportWallpaperEngineConfig.title,
                visibility: "public",
            };
            zip.file("project.json", JSON.stringify(project, null, 4));
            
            if (this.exportWallpaperEngineConfig.iconArrayBuffer) {
                zip.file("preview.png", this.exportWallpaperEngineConfig.iconArrayBuffer);
            }
            
            // 5. 生成 Zip 压缩包数据
            const zipContent = await zip.generateAsync({ type: "uint8array" });
            
            // 6. 保存或下载项目
            let targetFilePath = this.exportWallpaperEngineConfig.title + "_WallpaperEngine.zip";
            if (isElectron() || window.cordova || (typeof window !== 'undefined' && window.cordova)) {
                try {
                    const pickedPath = await driver.pickSaveFile({
                        title: '导出 Wallpaper Engine 项目',
                        defaultPath: targetFilePath,
                        filters: [
                            { name: 'Zip Archive', extensions: ['zip'] }
                        ]
                    });
                    if (!pickedPath) {
                        MessagePlugin.closeAll();
                        return;
                    }
                    targetFilePath = pickedPath;
                } catch (err) {
                    console.error("选择保存文件失败:", err);
                }
            }
            
            await driver.write(targetFilePath, zipContent);
            
            MessagePlugin.closeAll();
            MessagePlugin.success("导出项目 Zip 成功");
        } catch (e) {
            MessagePlugin.closeAll();
            MessagePlugin.error("导出项目失败: " + e.message);
            console.error("Export Wallpaper Engine Error:", e);
        }
    }
};

export default projectWallpaper;
