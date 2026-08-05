import { markRaw } from 'vue'
import FennecView from '@/fennec-view/FennecView'
import { standDiffNode } from './StandDiffNode'
import { loadStandDiff, serializeStandDiff, loadPreviewStandDiff } from './standDiffLoader'
import StandDiffPropertiesPanel from './StandDiffPropertiesPanel.vue'

export default {
    install(registry) {
        registry.register("standDiff", {
            nodeClass: standDiffNode,
            loader: loadStandDiff,
            previewLoader: loadPreviewStandDiff,
            serialize: serializeStandDiff,
            propertyComponent: markRaw(StandDiffPropertiesPanel),
            create: (src, options) => new standDiffNode(options.bgInfo, options.fgList, options),
            import: async (importItem) => {
                const { fileResourceManager } = await import('@/services/resources/FileResourceManager')
                const files = importItem.associatedFiles?.files || [];
                const bgFile = files.find(f => f.name === importItem.config.backgroundName) || files[0];
                const fgFiles = files.filter(f => f.name !== bgFile.name);

                const bgUrl = await bgFile.getLoadUrl();
                if (bgFile.isNative) {
                    fileResourceManager.registerFile(bgFile.name, null, { path: bgUrl });
                }
                fileResourceManager.addFileToGroup(importItem.id, bgUrl);

                const bgInfo = {
                    name: bgFile.name,
                    url: bgUrl
                };

                const fgList = [];
                for (const fileItem of fgFiles) {
                    const url = await fileItem.getLoadUrl();
                    if (fileItem.isNative) {
                        fileResourceManager.registerFile(fileItem.name, null, { path: url });
                    }
                    fileResourceManager.addFileToGroup(importItem.id, url);

                    const fgConfig = importItem.config.foregroundConfigs?.find(c => c.name === fileItem.name);
                    fgList.push({
                        name: fileItem.name,
                        url: url,
                        x: (fgConfig?.x !== undefined && fgConfig?.x !== null && fgConfig?.x !== '') ? Number(fgConfig.x) : null,
                        y: (fgConfig?.y !== undefined && fgConfig?.y !== null && fgConfig?.y !== '') ? Number(fgConfig.y) : null
                    });
                }

                if (typeof FennecView.addStandDiffNode === 'function') {
                    return await FennecView.addStandDiffNode(bgInfo, fgList, {
                        name: importItem.config.name,
                        bgAnchorPreset: importItem.config.bgAnchorPreset || 'both',
                        bgAnchorX: importItem.config.bgAnchorX !== undefined ? importItem.config.bgAnchorX : 0.5,
                        bgAnchorY: importItem.config.bgAnchorY !== undefined ? importItem.config.bgAnchorY : 0.5,
                        fgAnchorPreset: importItem.config.fgAnchorPreset || 'both',
                        fgAnchorX: importItem.config.fgAnchorX !== undefined ? importItem.config.fgAnchorX : 0.5,
                        fgAnchorY: importItem.config.fgAnchorY !== undefined ? importItem.config.fgAnchorY : 0.5,
                        activeFgKey: fgList[0]?.name || '',
                        defaultFgX: importItem.config.defaultFgX !== undefined ? importItem.config.defaultFgX : 0,
                        defaultFgY: importItem.config.defaultFgY !== undefined ? importItem.config.defaultFgY : 0,
                        resourceId: importItem.id
                    });
                }
                return [];
            }
        });

        // Dynamically register the creator operation on FennecView core engine
        FennecView.addStandDiffNode = async function (bgInfo, fgList, options = {}) {
            let box = this.canvas.box;
            let nodeInstance = new standDiffNode(bgInfo, fgList, options);
            let pixiNode = await nodeInstance;
            if (pixiNode) {
                this.click.current = pixiNode;
                box.addChild(pixiNode);
                this.refreshPropertyPanel();
                this.attachNodeEvents(pixiNode);
                this.refreshList();
                return [pixiNode];
            }
            return [];
        };
    }
};
