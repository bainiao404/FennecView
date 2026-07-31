import { BaseProcessor } from './BaseProcessor'
import FennecView from '@/fennec-view/FennecView'
import { isElectron } from '@/assets/gkd-js-0.2/env.js'

export class MediaProcessor extends BaseProcessor {
    /**
     * Detect if this file is an image or video.
     */
    async detect(fileItem) {
        const name = fileItem.name.toLowerCase();
        return /\.(png|jpg|jpeg|webp|gif|mp4|webm|ogg)$/i.test(name);
    }

    /**
     * Group Media files. Standalone media is always 1-to-1 and complete.
     */
    async group(entryFile, pool) {
        const name = entryFile.name;
        const ext = name.split('.').pop().toLowerCase();
        const isVideo = ['mp4', 'webm', 'ogg'].includes(ext);

        return {
            id: 'media_' + entryFile.relativePath,
            type: isVideo ? 'video' : 'image',
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

        // If we are in Electron and using native paths, load from disk directly
        if (isElectron() && fileItem.isNative) {
            const localPath = fileItem.path;
            if (importItem.type === 'video') {
                const videoSrcs = [{
                    path: [localPath],
                    name: importItem.config.name,
                    type: ext
                }];
                await FennecView.addVideoNode(videoSrcs);
            } else {
                const imgSrcs = [{
                    path: [localPath],
                    name: importItem.config.name,
                    type: ext
                }];
                await FennecView.addImageNode(imgSrcs);
            }
            return;
        }

        // Web mode: use Blob URLs
        const blobUrl = await this.getFileBlobUrl(fileItem);
        if (importItem.type === 'video') {
            const videoSrcs = [{
                path: [blobUrl],
                name: importItem.config.name,
                type: ext
            }];
            await FennecView.addVideoNode(videoSrcs);
        } else {
            const imgSrcs = [{
                path: [blobUrl],
                name: importItem.config.name,
                type: ext
            }];
            await FennecView.addImageNode(imgSrcs);
        }
    }
}
