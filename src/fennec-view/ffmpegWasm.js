import FennecView from './FennecView'
import { floorToEven } from '@/utils/baseScript'
import GKD from '@/assets/gkd-js-0.2'
import { MessagePlugin } from 'tdesign-vue-next'
import { useUIStore } from '@/stores/uiStore'

export const exportMp4Config = {
    width: 1920,
    height: 1080,
    fps: 60,
    avc: { format: "avc" },
    rect: null,
    title: "FennecViewExport",
    duration: 1000,
    codec: "avc1.640028",
    maxSize: null,
};

export async function setMp4RecordArea() {
    let rect = await FennecView.getUserRect("请选择录制区域");
    if (!rect) {
        MessagePlugin.warning("生成MP4必须指定录制区域,请重新截取区域！");
        return;
    }
    let worldRect = rect ? FennecView.getWindowRectToWorldRect(rect) : rect;
    
    const uiStore = useUIStore();
    uiStore.updateExportMp4Status({
        sizeInfo: Math.floor(worldRect.width) + "x" + Math.floor(worldRect.height)
    });
    
    let result = await checkMaxSupportedCodec(
        exportMp4Config.codec,
        worldRect.width,
        worldRect.height
    );
    let txt = "支持情况:不支持";
    if (result) {
        txt = "编码器:" + exportMp4Config.codec + "/";
        txt += "最大尺寸：" + exportMp4Config.maxSize[0] + "x" + exportMp4Config.maxSize[1] + "/";
        txt += " 支持情况:" + (result.supported ? "是" : "否") + "/";
        txt += " 流畅度:" + (result.smooth ? "流畅" : "可能卡顿") + "/";
        txt += " 功耗:" + (result.powerEfficient ? "高效" : "耗电");
    }
    
    uiStore.updateExportMp4Status({
        codecInfo: txt
    });
    
    if (
        !result ||
        !result.supported ||
        worldRect.width * worldRect.height > exportMp4Config.maxSize[0] * exportMp4Config.maxSize[1]
    ) {
        MessagePlugin.warning("尺寸过大，无法录制,请重新录制区域！");
        return;
    }
    let blob = await FennecView.getCanvasImg("blob", rect);
    if (blob) {
        const iconArrayBuffer = await blob.arrayBuffer();
        const uiStore = useUIStore();
        uiStore.updateExportConfig('mp4', { iconArrayBuffer });
    }
    exportMp4Config.rect = rect;
}

export async function startMp4Export() {
    let rect = exportMp4Config.rect;
    if (!rect) {
        MessagePlugin.warning("请先设置录制区域");
        return;
    }
    const uiStore = useUIStore();
    const mp4Config = uiStore.exportConfig.mp4;
    exportMp4Config.fps = mp4Config.fps || 30;
    
    let app = FennecView.canvas.app;
    app.stop();
    let box = FennecView.canvas.box;
    let worldRect = FennecView.getWindowRectToWorldRect(rect);
    exportMp4Config.width = floorToEven(worldRect.width);
    exportMp4Config.height = floorToEven(worldRect.height);
    
    let maxTime = 0;
    if (mp4Config.autoDuration) {
        box.children.forEach((node) => {
            if (node.nodeData) {
                if (node.nodeData.type === 'spine' && node.state) {
                    node.state.tracks[0].animationLast = 0;
                    if (node.state.tracks[0].animationEnd > maxTime) {
                        maxTime = node.state.tracks[0].animationEnd;
                    }
                } else if (node.nodeData.type === 'live2d' && node.nodeData.getActiveAnimationDuration) {
                    const dur = node.nodeData.getActiveAnimationDuration();
                    if (dur > maxTime) {
                        maxTime = dur;
                    }
                }
            }
        });
        if (maxTime <= 0) {
            maxTime = 5; // 如果时长为0，自动设置为5秒时长
        }
    } else {
        maxTime = mp4Config.duration || 5;
    }
    
    let totalFrames = 1000 / exportMp4Config.fps;
    exportMp4Config.duration = Math.floor(maxTime * 1000);
    const encoder = new MP4VideoEncoder(exportMp4Config);
    await encoder.initialize();
    let maxCount = Math.floor((maxTime * 1000) / totalFrames);
    uiStore.updateExportMp4Status({ progressInfo: "0%" });
    console.time('MP4ExportLoop');
    for (let i = 0; i < maxCount; i++) {
        let time = (i * totalFrames) / 1000;
        box.children.forEach((node) => {
            if (node.state) {
                if (node.state.tracks[0].animationEnd < time) {
                    return;
                }
                node.state.tracks[0].animationLast = time;
                node.state.tracks[0].trackTime = time;
            }
        });
        let canvas = await FennecView.getCanvasImg("canvas", rect);
        try {
            encoder.encodeFrame(canvas, (i / maxCount) * exportMp4Config.duration);
        } catch (error) {
            MessagePlugin.error("帧编码失败，请尝试降低录制分辨率");
            uiStore.updateExportMp4Status({ progressInfo: "Failed" });
            app.start();
            break;
        }
        await GKD.delay(0);
        uiStore.updateExportMp4Status({ progressInfo: Math.floor((i / maxCount) * 1000) / 10 + "%" });
    }
    console.timeEnd('MP4ExportLoop');
    await encoder.finalize(exportMp4Config.title + ".mp4");
    uiStore.updateExportMp4Status({ progressInfo: "Done" });
    app.start();
}

class MP4VideoEncoder {
    constructor(config) {
        this.config = {
            fps: 60,
            codec: "avc1.420028",
            hardwareAcceleration: false,
            ...config,
        };

        this.timescale = 1000;
        this.chunkCount = 0;
        this.encoderClosed = false;
        this.totalFrames = Math.floor(this.config.duration / (1000 / this.config.fps));

        // MP4Box initialization
        this.file = MP4Box.createFile();
        this.track = null;
        this._setupTrackOptions();
    }

    _setupTrackOptions() {
        this.trackOptions = {
            timescale: 1000 * this.timescale,
            width: this.config.width,
            height: this.config.height,
            nb_samples: this.totalFrames,
        };

        this.sampleOptions = {
            duration: (1000 / this.config.fps) * this.timescale,
        };
    }

    async initialize() {
        this.videoEncoder = new VideoEncoder({
            output: this._handleEncodedChunk.bind(this),
            error: (e) => console.error("Encoder error:", e),
        });

        this.videoEncoder.configure({
            codec: this.config.codec,
            width: this.config.width,
            height: this.config.height,
            hardwareAcceleration: this.config.hardwareAcceleration
                ? "prefer-hardware"
                : "no-preference",
            avc: { format: "avc" },
        });

        return this;
    }

    _handleEncodedChunk(chunk, config) {
        const ab = new ArrayBuffer(chunk.byteLength);
        chunk.copyTo(ab);

        if (!this.track) {
            this.trackOptions.avcDecoderConfigRecord = config.decoderConfig.description;
            this.track = this.file.addTrack(this.trackOptions);
        }

        this.sampleOptions.dts = chunk.timestamp * this.timescale;
        this.sampleOptions.cts = chunk.timestamp * this.timescale;
        this.sampleOptions.is_sync = chunk.type === "key";

        this.file.addSample(this.track, ab, this.sampleOptions);
        this.chunkCount++;

        if (this.config.maxChunks && this.chunkCount >= this.config.maxChunks) {
            this.close();
        }
    }

    encodeFrame(frameData, timestamp) {
        if (this.encoderClosed) return;

        const frame =
            frameData instanceof VideoFrame ? frameData : new VideoFrame(frameData, { timestamp });

        this.videoEncoder.encode(frame);
        frame.close();
    }

    async finalize(filename = "output.mp4") {
        await this.videoEncoder.flush();
        this.file.save(filename);
        console.log(`Encoding completed! Saved as ${filename}`);
    }

    close() {
        if (!this.encoderClosed) {
            this.videoEncoder.close();
            this.encoderClosed = true;
        }
    }
}

async function checkMaxSupportedCodec(codec = "avc1.640028", width = 720, height = 480) {
    const config = {
        type: "file",
        video: {
            contentType: `video/mp4; codecs="` + codec + `"`,
            width: width,
            height: height,
            bitrate: 5000000,
            framerate: 30,
        },
    };
    try {
        const result = await navigator.mediaCapabilities.decodingInfo(config);
        return result;
    } catch (e) {
        console.error("MediaCapabilities API 不支持:", e);
        return false;
    }
}

export async function detectSupportedCodec() {
    const codecsToTest = [
        "avc1.42E01E",
        "avc1.420028",
        "avc1.420029",
        "avc1.420032",
        "avc1.420033",
        "avc1.420034",
    ];
    const maxSize = [
        [1620, 1152],
        [2048, 1536],
        [2048, 1536],
        [4096, 2304],
        [4096, 2304],
        [4096, 2304],
    ];
    for (let i = 0; i < codecsToTest.length; i++) {
        let codec = codecsToTest[i];
        let a = await checkMaxSupportedCodec(codec);
        if (a && a.supported) {
            exportMp4Config.codec = codec;
            exportMp4Config.maxSize = maxSize[i];
        }
    }
}

detectSupportedCodec();

export const exportGifConfig = {
    width: 1920,
    height: 1080,
    fps: 15,
    rect: null,
    title: "FennecViewExport",
    duration: 1000,
    quality: 10
};

export async function setGifRecordArea() {
    let rect = await FennecView.getUserRect("请选择录制区域");
    if (!rect) {
        MessagePlugin.warning("生成GIF必须指定录制区域,请重新截取区域！");
        return;
    }
    let worldRect = rect ? FennecView.getWindowRectToWorldRect(rect) : rect;
    
    const uiStore = useUIStore();
    uiStore.updateExportGifStatus({
        sizeInfo: Math.floor(worldRect.width) + "x" + Math.floor(worldRect.height)
    });
    
    let blob = await FennecView.getCanvasImg("blob", rect);
    if (blob) {
        const iconArrayBuffer = await blob.arrayBuffer();
        uiStore.updateExportConfig('gif', { iconArrayBuffer });
    }
    exportGifConfig.rect = rect;
}

export async function startGifExport() {
    let rect = exportGifConfig.rect;
    if (!rect) {
        MessagePlugin.warning("请先设置录制区域");
        return;
    }
    const uiStore = useUIStore();
    const gifConfig = uiStore.exportConfig.gif;
    exportGifConfig.fps = gifConfig.fps || 15;
    exportGifConfig.quality = gifConfig.quality || 10;
    
    let app = FennecView.canvas.app;
    app.stop();
    let box = FennecView.canvas.box;
    let worldRect = FennecView.getWindowRectToWorldRect(rect);
    exportGifConfig.width = floorToEven(worldRect.width);
    exportGifConfig.height = floorToEven(worldRect.height);
    
    let maxTime = 0;
    if (gifConfig.autoDuration) {
        box.children.forEach((node) => {
            if (node.nodeData) {
                if (node.nodeData.type === 'spine' && node.state) {
                    node.state.tracks[0].animationLast = 0;
                    if (node.state.tracks[0].animationEnd > maxTime) {
                        maxTime = node.state.tracks[0].animationEnd;
                    }
                } else if (node.nodeData.type === 'live2d' && node.nodeData.getActiveAnimationDuration) {
                    const dur = node.nodeData.getActiveAnimationDuration();
                    if (dur > maxTime) {
                        maxTime = dur;
                    }
                }
            }
        });
        if (maxTime <= 0) {
            maxTime = 5; // 如果时长为0，自动设置为5秒时长
        }
    } else {
        maxTime = gifConfig.duration || 5;
    }
    
    let totalFrames = 1000 / exportGifConfig.fps;
    exportGifConfig.duration = Math.floor(maxTime * 1000);
    
    if (typeof window.GIF === 'undefined') {
        MessagePlugin.error("GIF.js 库未加载，请检查！");
        app.start();
        return;
    }
    
    const gifOptions = {
        workers: 4,
        quality: exportGifConfig.quality,
        workerScript: 'assets/libs/gif/gif.worker.js',
        width: exportGifConfig.width,
        height: exportGifConfig.height
    };
    
    if (gifConfig.transparentBg) {
        gifOptions.transparent = 0x00ff00; // Pure green chroma key
        gifOptions.background = 'rgba(0,0,0,0)';
    }
    
    const gif = new window.GIF(gifOptions);
    
    let maxCount = Math.floor((maxTime * 1000) / totalFrames);
    uiStore.updateExportGifStatus({ progressInfo: "0%" });
    
    try {
        let originalAlpha = 1;
        let background = FennecView.canvas.background;
        
        for (let i = 0; i < maxCount; i++) {
            let time = (i * totalFrames) / 1000;
            box.children.forEach((node) => {
                if (node.state) {
                    if (node.state.tracks[0].animationEnd < time) {
                        return;
                    }
                    node.state.tracks[0].animationLast = time;
                    node.state.tracks[0].trackTime = time;
                }
            });
            
            // Temporarily hide background color if transparent background is enabled
            if (gifConfig.transparentBg && background) {
                originalAlpha = background.alpha;
                background.alpha = 0;
            }
            
            let canvas = await FennecView.getCanvasImg("canvas", rect);
            
            // Restore background color
            if (gifConfig.transparentBg && background) {
                background.alpha = originalAlpha;
            }
            
            // Map transparent canvas pixels to the green chroma key
            if (gifConfig.transparentBg) {
                const ctx = canvas.getContext('2d');
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;
                for (let j = 0; j < data.length; j += 4) {
                    if (data[j + 3] < 128) {
                        data[j] = 0;       // R
                        data[j + 1] = 255; // G
                        data[j + 2] = 0;   // B
                        data[j + 3] = 255; // Opaque green
                    }
                }
                ctx.putImageData(imgData, 0, 0);
            }
            
            gif.addFrame(canvas, { delay: totalFrames });
            
            await GKD.delay(0);
            uiStore.updateExportGifStatus({ progressInfo: `Recording: ${Math.floor((i / maxCount) * 100)}%` });
        }
        
        uiStore.updateExportGifStatus({ progressInfo: "Rendering..." });
        
        gif.on('progress', function(p) {
            uiStore.updateExportGifStatus({ progressInfo: `Rendering: ${Math.floor(p * 100)}%` });
        });
        
        gif.on('finished', function(blob) {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = (gifConfig.title || "export") + ".gif";
            link.click();
            
            uiStore.updateExportGifStatus({ progressInfo: "Done" });
            app.start();
            
            setTimeout(() => {
                URL.revokeObjectURL(link.href);
            }, 1000);
        });
        
        gif.render();
    } catch (error) {
        MessagePlugin.error("GIF 编码失败，请尝试降低录制分辨率");
        uiStore.updateExportGifStatus({ progressInfo: "Failed" });
        app.start();
    }
}

