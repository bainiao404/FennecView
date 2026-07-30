import { blobRegistry } from '@/services/resources/BlobRegistry'

export async function loadVideo(nodeConfig, zip) {
    const baseZipDir = "assets/" + nodeConfig.path + "/";
    const videoZipFile = zip.file(baseZipDir + nodeConfig.name);
    if (!videoZipFile) return;
    
    const videoBuffer = await videoZipFile.async("arraybuffer");
    let mimeType = "video/mp4";
    if (nodeConfig.name.endsWith(".webm")) {
        mimeType = "video/webm";
    } else if (nodeConfig.name.endsWith(".ogg")) {
        mimeType = "video/ogg";
    }
    const videoBlob = new Blob([videoBuffer], { type: mimeType });
    const videoBlobUrl = blobRegistry.createURL(videoBlob);
    
    let videoNodes = await this.addVideoNode([{
        path: [videoBlobUrl],
        name: nodeConfig.name,
        type: nodeConfig.name.split('.').pop().toLowerCase()
    }]);
    let mNode = videoNodes[0];
    if (mNode) {
        mNode.name = nodeConfig.name;
        mNode.url = videoBlobUrl;
        mNode.scale.set(nodeConfig.scale);
        mNode.x = nodeConfig.x;
        mNode.y = nodeConfig.y;
        mNode.rotation = nodeConfig.rotation;
        mNode.alpha = nodeConfig.alpha;
        
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
export default loadVideo;
