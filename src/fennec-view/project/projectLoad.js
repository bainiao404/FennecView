import { isElectron } from '@/assets/gkd-js-0.2/env.js'
import { MessagePlugin } from 'tdesign-vue-next'
import JSZip from 'jszip'
import { useUIStore } from '@/stores/uiStore'
import { ioManager } from '@/services/io/IOManager'
import loaders from './loaders'

const projectLoad = {
    loadProject: async function (buffer = null) {
        if (!buffer) {
            try {
                const driver = ioManager.getDriver();
                const result = await driver.pickFile({
                    title: '选择 FennecView 项目文件',
                    filters: [
                        { name: 'FennecView Project', extensions: ['fv'] }
                    ]
                });
                if (!result || result.length === 0) return;
                const file = result[0];
                if (typeof file === 'string') {
                    buffer = await driver.read(file);
                } else {
                    buffer = await file.arrayBuffer();
                }
            } catch (err) {
                console.error("Open project error:", err);
            }
        }
        if (!buffer) return;
        await this.loadProjectFromBuffer(buffer);
    },

    loadProjectFromBuffer: async function (buffer) {
        try {
            MessagePlugin.loading("正在解析项目文件...");
            const zip = await JSZip.loadAsync(buffer);
            
            const projectJsonFile = zip.file("project.json");
            if (!projectJsonFile) {
                throw new Error("无效的项目文件：未找到 project.json");
            }
            const projectJsonStr = await projectJsonFile.async("string");
            const projectData = JSON.parse(projectJsonStr);
            
            if (projectData.versionKey !== "FennecViewProject_v1") {
                throw new Error("不支持的项目版本或验证 Key 不匹配");
            }
            
            this.clearAllNodes();
            
            let world = this.canvas.world;
            let background = this.canvas.background;
            if (projectData.background) {
                background.alpha = projectData.background.alpha;
                background.redraw(projectData.background.color);
            }
            if (projectData.world) {
                world.scale.set(projectData.world.scale);
                world.x = projectData.world.x;
                world.y = projectData.world.y;
                const uiStore = useUIStore();
                uiStore.updateScale(projectData.world.scale);
                uiStore.updateWorldPosition(projectData.world.x, projectData.world.y);
            }
            
            let mCacheNode = [];
            
            for (let nodeConfig of projectData.nodes) {
                const loader = loaders[nodeConfig.type];
                if (loader) {
                    try {
                        await loader.call(this, nodeConfig, zip, mCacheNode);
                    } catch (loadErr) {
                        console.error(`Error loading node of type ${nodeConfig.type}:`, loadErr);
                    }
                } else {
                    console.warn(`No loader found for node type: ${nodeConfig.type}`);
                }
            }
            
            setTimeout(() => {
                for (var j = 0; j < mCacheNode.length; j++) {
                    if (mCacheNode[j].state && mCacheNode[j].state.tracks && mCacheNode[j].state.tracks[0]) {
                        mCacheNode[j].state.tracks[0].time = 0;
                    }
                }
            }, 200);
            
            MessagePlugin.closeAll();
            MessagePlugin.success("读取项目成功");
        } catch (e) {
            MessagePlugin.closeAll();
            MessagePlugin.error("读取项目失败: " + e.message);
            console.error("Load Project Error:", e);
        }
    }
};

export default projectLoad;
