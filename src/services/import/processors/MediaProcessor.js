import { BaseProcessor } from './BaseProcessor'
import FennecView from '@/fennec-view/FennecView'
import { fileResourceManager } from '@/services/resources/FileResourceManager'

export class MediaProcessor extends BaseProcessor {
    /**
     * Detect if this file is an image or video.
     */
    async detect(fileItem) {
        const name = fileItem.name.toLowerCase();
        return /\.(png|jpg|jpeg|webp|gif|mp4|webm|ogg|svg)$/i.test(name);
    }

    /**
     * Group Media files. Standalone media is always 1-to-1 and complete.
     */
    async group(entryFile, pool) {
        const name = entryFile.name;
        const ext = name.split('.').pop().toLowerCase();
        const isVideo = ['mp4', 'webm', 'ogg'].includes(ext);
        const isSvg = ext === 'svg';

        return {
            id: 'media_' + entryFile.relativePath,
            type: isVideo ? 'video' : (isSvg ? 'svg' : 'image'),
            name: name,
            status: 'complete',
            entryFile,
            associatedFiles: {
                media: entryFile
            },
            missingFiles: [],
            config: {
                name: name
            }
        };
    }

    /**
     * Import Media asset into the PIXI scene.
     */
    async import(importItem) {
        const fileItem = importItem.associatedFiles.media;
        const ext = fileItem.name.split('.').pop().toLowerCase();

        const loadPath = await fileItem.getLoadUrl();
        fileResourceManager.addFileToGroup(importItem.id, loadPath);

        if (importItem.type === 'video') {
            const videoSrcs = [{
                path: [loadPath],
                name: importItem.config.name,
                type: ext,
                resourceId: importItem.id
            }];
            const nodes = await FennecView.addVideoNode(videoSrcs);
            if (nodes && nodes[0]) {
                nodes[0].name = importItem.config.name;
                nodes[0].originalFileName = fileItem.name;
            }
        } else if (importItem.type === 'svg') {
            const svgSrcs = [{
                path: [loadPath],
                name: importItem.config.name,
                type: 'svg',
                resourceId: importItem.id
            }];
            const nodes = await FennecView.addSvgNode(svgSrcs);
            if (nodes && nodes[0]) {
                nodes[0].name = importItem.config.name;
                nodes[0].originalFileName = fileItem.name;
            }
        } else {
            const imgSrcs = [{
                path: [loadPath],
                name: importItem.config.name,
                type: ext,
                resourceId: importItem.id
            }];
            const nodes = await FennecView.addImageNode(imgSrcs);
            if (nodes && nodes[0]) {
                nodes[0].name = importItem.config.name;
                nodes[0].originalFileName = fileItem.name;
            }
        }
    }
}
