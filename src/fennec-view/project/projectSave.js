import { isElectron } from '@/assets/gkd-js-0.2/env.js'
import GKD from '@/assets/gkd-js-0.2'
import { MessagePlugin } from 'tdesign-vue-next'
import JSZip from 'jszip'
import { ioManager } from '@/services/io/IOManager'

const projectSave = {
    saveProject: async function () {
        const driver = ioManager.getDriver();
        let targetFilePath = "project_" + GKD.time.getCurrentDate("YYYYMMDDHHmmss") + ".fv";
        
        if (isElectron() || window.cordova || (typeof window !== 'undefined' && window.cordova)) {
            try {
                const pickedPath = await driver.pickSaveFile({
                    title: '保存 FennecView 项目',
                    defaultPath: targetFilePath,
                    filters: [
                        { name: 'FennecView Project', extensions: ['fv'] }
                    ]
                });
                if (!pickedPath) return;
                targetFilePath = pickedPath;
            } catch (err) {
                console.error("Save file selection error:", err);
                if (isElectron()) return;
            }
        }
        
        try {
            MessagePlugin.loading("正在打包项目...");
            const zip = new JSZip();
            
            let world = this.canvas.world;
            let box = this.canvas.box;
            let background = this.canvas.background;
            
            let projectData = {
                versionKey: "FennecViewProject_v1",
                world: {
                    scale: world.scale.x,
                    x: world.x,
                    y: world.y,
                },
                background: {
                    color: background.backgroundColor,
                    alpha: background.alpha,
                },
                nodes: []
            };
            
            for (let i = 0; i < box.children.length; i++) {
                let node = box.children[i];
                if (node.nodeData) {
                    let data = await this.copyNodeAssets(node, zip, true);
                    if (data) {
                        data.resourceId = node.resourceId || "";
                        projectData.nodes.push(data);
                    }
                }
            }
            
            zip.file("project.json", JSON.stringify(projectData, null, 4));
            const zipContent = await zip.generateAsync({ type: "uint8array" });
            
            await driver.write(targetFilePath, zipContent);
            
            MessagePlugin.closeAll();
            MessagePlugin.success("保存项目成功");
        } catch (e) {
            MessagePlugin.closeAll();
            MessagePlugin.error("保存项目失败: " + e.message);
            console.error("Save Project Error:", e);
        }
    }
};

export default projectSave;
