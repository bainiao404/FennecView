import { blobRegistry } from '@/services/resources/BlobRegistry'
import { MimeUtil } from '@/utils/MimeUtil'
import { fileResourceManager } from '@/services/resources/FileResourceManager'

export async function loadVideo(nodeConfig, zip) {
    const baseZipDir = "assets/" + nodeConfig.path + "/";
    const videoZipFile = zip.file(baseZipDir + nodeConfig.name);
    if (!videoZipFile) return;
    
    const videoBuffer = await videoZipFile.async("arraybuffer");
    const mimeType = MimeUtil.getMimeType(nodeConfig.name);
    const videoBlob = new Blob([videoBuffer], { type: mimeType });
    const videoBlobUrl = blobRegistry.createURL(videoBlob, nodeConfig.name);
    
    const resourceId = nodeConfig.resourceId || `video_${Math.random().toString(36).substring(2, 9)}`;
    fileResourceManager.addFileToGroup(resourceId, videoBlobUrl);

    let videoNodes = await this.addVideoNode([{
        path: [videoBlobUrl],
        name: nodeConfig.name,
        type: nodeConfig.name.split('.').pop().toLowerCase(),
        resourceId: resourceId
    }]);
    let mNode = videoNodes[0];
    if (mNode) {
        mNode.name = nodeConfig.name;
        mNode.originalFileName = nodeConfig.name;
        mNode.url = videoBlobUrl;
        mNode.scale.set(nodeConfig.scale);
        mNode.x = nodeConfig.x;
        mNode.y = nodeConfig.y;
        if (nodeConfig.rotation !== undefined) mNode.rotation = nodeConfig.rotation;
        if (nodeConfig.alpha !== undefined) mNode.alpha = nodeConfig.alpha;
        
        mNode._videoLoop = nodeConfig.videoLoop !== undefined ? nodeConfig.videoLoop : true;
        mNode._videoMuted = nodeConfig.videoMuted !== undefined ? nodeConfig.videoMuted : false;
        mNode._videoVolume = nodeConfig.videoVolume !== undefined ? nodeConfig.videoVolume : 1.0;
        mNode._videoPlaying = nodeConfig.videoPlaying !== undefined ? nodeConfig.videoPlaying : true;
        
        const videoEl = mNode.nodeData.getVideoElement();
        if (videoEl) {
            videoEl.loop = mNode._videoLoop;
            videoEl.muted = mNode._videoMuted;
            videoEl.volume = mNode._videoVolume;
            if (mNode._videoPlaying) {
                videoEl.play();
            } else {
                videoEl.pause();
            }
        }
    }
}

export async function serializeVideo(node, dest, randomDir, zipPrefix, addFileToZip) {
    if (node.nodeData && typeof node.nodeData.getVideoElement === 'function') {
        const videoEl = node.nodeData.getVideoElement();
        if (videoEl) {
            node._videoLoop = videoEl.loop;
            node._videoMuted = videoEl.muted;
            node._videoVolume = videoEl.volume;
            node._videoPlaying = !videoEl.paused;
        }
    }

    let videoExt = '.mp4';
    const lowerVideoUrl = node.url.toLowerCase();
    if (lowerVideoUrl.endsWith('.webm')) videoExt = '.webm';
    else if (lowerVideoUrl.endsWith('.ogg')) videoExt = '.ogg';
    
    let exportName = node.originalFileName || node.name;
    const hasVideoExt = /\.(mp4|webm|ogg)$/i.test(exportName);
    if (!hasVideoExt) {
        exportName += videoExt;
    }

    let data = {
        type: "video",
        path: randomDir,
        name: exportName,
        src: node.url,
        scale: node.scale.x,
        scaleX: node.scale.x,
        scaleY: node.scale.y,
        x: node.x,
        y: node.y,
        rotation: node.rotation,
        alpha: node.alpha,
        videoLoop: node._videoLoop !== undefined ? node._videoLoop : true,
        videoMuted: node._videoMuted !== undefined ? node._videoMuted : false,
        videoVolume: node._videoVolume !== undefined ? node._videoVolume : 1.0,
        videoPlaying: node._videoPlaying !== undefined ? node._videoPlaying : true,
    };
    
    await addFileToZip(dest, zipPrefix + randomDir + "/" + exportName, node.url);
    return data;
}

export async function loadPreviewVideo(nodeConfig, mCacheNode) {
    let videoNodes = await this.addVideoNode([{
        path: ['export/' + nodeConfig.path + '/' + nodeConfig.name],
        name: nodeConfig.name,
        type: nodeConfig.name.split('.').pop().toLowerCase()
    }]);
    let mNode = videoNodes[0];
    if (mNode) {
        if (nodeConfig.scaleX !== undefined && nodeConfig.scaleY !== undefined) {
            mNode.scale.set(nodeConfig.scaleX, nodeConfig.scaleY);
        } else {
            mNode.scale.set(nodeConfig.scale);
        }
        mNode.x = nodeConfig.x;
        mNode.y = nodeConfig.y;
        if (nodeConfig.rotation !== undefined) mNode.rotation = nodeConfig.rotation;
        if (nodeConfig.alpha !== undefined) mNode.alpha = nodeConfig.alpha;
        
        mNode._videoLoop = nodeConfig.videoLoop !== undefined ? nodeConfig.videoLoop : true;
        mNode._videoMuted = nodeConfig.videoMuted !== undefined ? nodeConfig.videoMuted : false;
        mNode._videoVolume = nodeConfig.videoVolume !== undefined ? nodeConfig.videoVolume : 1.0;
        mNode._videoPlaying = nodeConfig.videoPlaying !== undefined ? nodeConfig.videoPlaying : true;
        
        const videoEl = mNode.nodeData.getVideoElement();
        if (videoEl) {
            videoEl.loop = mNode._videoLoop;
            videoEl.muted = mNode._videoMuted;
            videoEl.volume = mNode._videoVolume;
            if (mNode._videoPlaying) {
                videoEl.play();
            } else {
                videoEl.pause();
            }
        }
        mCacheNode.push(mNode);
    }
}
