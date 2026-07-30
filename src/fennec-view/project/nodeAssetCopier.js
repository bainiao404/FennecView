import { isElectron } from '@/assets/gkd-js-0.2/env.js'
import GKD from '@/assets/gkd-js-0.2'
import { addFileToZip, copyFileOrBlobToDisk, readFileAsArrayBuffer } from '../helpers'

let fse = null;

if (isElectron()) {
    try {
        if (typeof window !== 'undefined' && window.require) {
            fse = window.require('fs-extra');
        } else if (typeof require !== 'undefined') {
            fse = require('fs-extra');
        }
    } catch (e) {
        console.error("Failed to load fs-extra in nodeAssetCopier:", e);
    }
}

const nodeAssetCopier = {
    copyNodeAssets: async function (node, dest, isZip = false) {
        let randomDir = this.generateRandomString();
        
        switch (node.nodeData.type) {
            case "spine": {
                let data = {
                    type: "spine",
                    path: randomDir,
                    info: node.spineData.info,
                    imgFile: [],
                    animation: node.state.tracks[0]?.animation?.name || "",
                    skin: node.skeleton.skin?.name || "",
                    slots: [],
                    slotsAttachment: [],
                    name: node.name,
                    scale: node.scale.x,
                    scaleX: node.scale.x,
                    scaleY: node.scale.y,
                    x: node.x,
                    y: node.y,
                    rotation: node.rotation,
                    alpha: node.alpha,
                    textureMode: node.spineData.textureMode !== undefined ? node.spineData.textureMode : 0,
                    isPremultiplied: (() => {
                        if (node.spineData.texture && node.spineData.texture[0]) {
                            const tex = node.spineData.texture[0];
                            const source = tex.source || tex.baseTexture;
                            const pmaMode = window.PIXI ? (window.PIXI.ALPHA_MODES ? window.PIXI.ALPHA_MODES.PREMULTIPLIED_ALPHA : 'premultiplied-alpha') : 1;
                            return source ? source.alphaMode === pmaMode : false;
                        }
                        return node.spineData.isPremultiplied;
                    })(),
                };
                
                node.spineData.atlas.atlas.pages.forEach((e) => {
                    data.imgFile.push(e.name);
                });
                
                node.skeleton.slots.forEach((e, idx) => {
                    if (e.color.a != 1) {
                        data.slots.push([idx, e.color.a]);
                    }
                });
                
                let attributes = node.nodeData.getAttributes();
                let slots = attributes["slots"] || [];
                slots.forEach(function (e) {
                    let currentAttachment = null;
                    if (e.attachment && e.attachment.name) {
                        currentAttachment = e.attachment.name;
                    }
                    data.slotsAttachment.push({
                        slotName: e.data.name,
                        attachmentName: currentAttachment,
                    });
                });
                
                if (isZip) {
                    await addFileToZip(dest, "assets/" + randomDir + "/" + node.name, node.spineData.info.path[0]);
                    let atlasFileNameOnly = node.spineData.info.originalAtlasName;
                    if (!atlasFileNameOnly) {
                        let mPath = GKD.path.parsePath(node.spineData.info.path[1]);
                        atlasFileNameOnly = mPath.fileName;
                    }
                    await addFileToZip(dest, "assets/" + randomDir + "/" + atlasFileNameOnly, node.spineData.info.path[1]);
                    for (let page of node.spineData.atlas.atlas.pages) {
                        const pageSrc = (node.spineData.info.textures && node.spineData.info.textures[page.name]) || (node.spineData.info.path[2] + page.name);
                        await addFileToZip(dest, "assets/" + randomDir + "/" + page.name, pageSrc);
                    }
                } else {
                    let targetDir = dest + randomDir + "/";
                    fse.ensureDirSync(targetDir);
                    for (let page of node.spineData.atlas.atlas.pages) {
                        const pageSrc = (node.spineData.info.textures && node.spineData.info.textures[page.name]) || (node.spineData.info.path[2] + page.name);
                        await copyFileOrBlobToDisk(pageSrc, targetDir + page.name);
                    }
                    await copyFileOrBlobToDisk(node.spineData.info.path[0], targetDir + node.name);
                    let atlasFileNameOnly = node.spineData.info.originalAtlasName;
                    if (!atlasFileNameOnly) {
                        let mPath = GKD.path.parsePath(node.spineData.info.path[1]);
                        atlasFileNameOnly = mPath.fileName;
                    }
                    await copyFileOrBlobToDisk(node.spineData.info.path[1], targetDir + atlasFileNameOnly);
                }
                return data;
            }
            case "live2d": {
                let data = {
                    type: "live2d",
                    path: randomDir,
                    name: node.name,
                    src: node.url,
                    scale: node.scale.x,
                    scaleX: node.scale.x,
                    scaleY: node.scale.y,
                    x: node.x,
                    y: node.y,
                    rotation: node.rotation,
                    alpha: node.alpha,
                };
                if (node.nodeData) {
                    data.skin = node.nodeData.activeSkinName || "";
                    data.animation = node.nodeData.activeAnimationName || "";
                    data.transitionMode = node.nodeData.transitionMode || "loop";
                    data.live2dFadeIn = node.nodeData.live2dFadeIn !== undefined ? node.nodeData.live2dFadeIn : 0.1;
                    data.live2dFadeOut = node.nodeData.live2dFadeOut !== undefined ? node.nodeData.live2dFadeOut : 0.1;
                    data.live2dTracking = !!node.nodeData.live2dTracking;
                    
                    if (node.nodeData._live2DParameters) {
                        data.live2dParameters = Object.keys(node.nodeData._live2DParameters).map(key => {
                            let p = node.nodeData._live2DParameters[key];
                            return { name: key, state: p.state, value: p.targetValue };
                        });
                    }
                    if (node.nodeData._live2DParts) {
                        data.live2dParts = Object.keys(node.nodeData._live2DParts).map(key => {
                            let p = node.nodeData._live2DParts[key];
                            return { name: key, state: p.state, value: p.targetValue };
                        });
                    }
                }
                
                try {
                    let modelJson;
                    let filesToCopy = [];
                    let modelDir = node.url.substring(0, node.url.lastIndexOf("/") + 1);
                    
                    if (node.live2dData && node.live2dData.originalModelJson) {
                        modelJson = node.live2dData.originalModelJson;
                        if (isZip) {
                            dest.file("assets/" + randomDir + "/" + node.name, JSON.stringify(modelJson, null, 4));
                        } else {
                            let targetDir = dest + randomDir + "/";
                            fse.ensureDirSync(targetDir);
                            fse.outputJsonSync(targetDir + node.name, modelJson);
                        }
                    } else {
                        if (isZip) {
                            const modelJsonBuffer = await readFileAsArrayBuffer(node.url);
                            dest.file("assets/" + randomDir + "/" + node.name, modelJsonBuffer);
                            const textDecoder = new TextDecoder();
                            const modelJsonStr = textDecoder.decode(modelJsonBuffer);
                            modelJson = JSON.parse(modelJsonStr);
                        } else {
                            let targetDir = dest + randomDir + "/";
                            fse.ensureDirSync(targetDir);
                            let destJsonPath = targetDir + node.name;
                            await copyFileOrBlobToDisk(node.url, destJsonPath);
                            if (isElectron()) {
                                modelJson = fse.readJsonSync(destJsonPath);
                            } else {
                                const modelJsonBuffer = await readFileAsArrayBuffer(node.url);
                                const textDecoder = new TextDecoder();
                                modelJson = JSON.parse(textDecoder.decode(modelJsonBuffer));
                            }
                        }
                    }
                    
                    if (modelJson.FileReferences) {
                        let fr = modelJson.FileReferences;
                        if (fr.Moc) filesToCopy.push(fr.Moc);
                        if (Array.isArray(fr.Textures)) {
                            fr.Textures.forEach(t => filesToCopy.push(t));
                        }
                        if (fr.Physics) filesToCopy.push(fr.Physics);
                        if (fr.DisplayInfo) filesToCopy.push(fr.DisplayInfo);
                        if (fr.UserData) filesToCopy.push(fr.UserData);
                        if (fr.Pose) filesToCopy.push(fr.Pose);
                        if (Array.isArray(fr.Expressions)) {
                            fr.Expressions.forEach(e => {
                                if (e.File) filesToCopy.push(e.File);
                            });
                        }
                        if (fr.Motions && typeof fr.Motions === 'object') {
                            Object.keys(fr.Motions).forEach(group => {
                                let motions = fr.Motions[group];
                                if (Array.isArray(motions)) {
                                    motions.forEach(m => {
                                        if (m.File) filesToCopy.push(m.File);
                                    });
                                }
                            });
                        }
                    } else {
                        if (modelJson.model) filesToCopy.push(modelJson.model);
                        if (Array.isArray(modelJson.textures)) {
                            modelJson.textures.forEach(t => filesToCopy.push(t));
                        }
                        if (modelJson.physics) filesToCopy.push(modelJson.physics);
                        if (Array.isArray(modelJson.expressions)) {
                            modelJson.expressions.forEach(e => {
                                if (e.file) filesToCopy.push(e.file);
                            });
                        }
                        if (modelJson.motions && typeof modelJson.motions === 'object') {
                            Object.keys(modelJson.motions).forEach(group => {
                                let motions = modelJson.motions[group];
                                if (Array.isArray(motions)) {
                                    motions.forEach(m => {
                                        if (m.file) filesToCopy.push(m.file);
                                    });
                                }
                            });
                        }
                    }
                    
                    function normalizePath(p) {
                        if (typeof p !== 'string') return '';
                        let np = p.replace(/\\/g, '/');
                        if (np.startsWith('./')) {
                            np = np.substring(2);
                        }
                        return np;
                    }
                    
                    for (let relPath of filesToCopy) {
                        if (typeof relPath === 'string') {
                            let srcFilePath;
                            if (node.live2dData && node.live2dData.pathMap) {
                                const norm = normalizePath(relPath);
                                srcFilePath = node.live2dData.pathMap[norm];
                                if (!srcFilePath) {
                                    const lowerNorm = norm.toLowerCase();
                                    for (let key in node.live2dData.pathMap) {
                                        if (key.toLowerCase() === lowerNorm) {
                                            srcFilePath = node.live2dData.pathMap[key];
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            if (!srcFilePath) {
                                if (relPath.startsWith('blob:') || relPath.startsWith('data:') || relPath.startsWith('http:') || relPath.startsWith('https:')) {
                                    srcFilePath = relPath;
                                } else {
                                    srcFilePath = modelDir + relPath;
                                }
                            }
                            
                            if (isZip) {
                                await addFileToZip(dest, "assets/" + randomDir + "/" + relPath, srcFilePath);
                            } else {
                                let targetDir = dest + randomDir + "/";
                                let destFilePath = targetDir + relPath;
                                if (isElectron()) {
                                    const path = window.require('path');
                                    fse.ensureDirSync(path.dirname(destFilePath));
                                }
                                await copyFileOrBlobToDisk(srcFilePath, destFilePath);
                            }
                        }
                    }
                } catch (err) {
                    console.warn("Could not copy Live2D model files:", err);
                }
                return data;
            }
            case "img": {
                let data = {
                    type: "img",
                    path: randomDir,
                    name: node.name,
                    src: node.url,
                    scale: node.scale.x,
                    scaleX: node.scale.x,
                    scaleY: node.scale.y,
                    x: node.x,
                    y: node.y,
                    rotation: node.rotation,
                    alpha: node.alpha,
                };
                
                if (isZip) {
                    await addFileToZip(dest, "assets/" + randomDir + "/" + node.name, node.url);
                } else {
                    let targetDir = dest + randomDir + "/";
                    fse.ensureDirSync(targetDir);
                    await copyFileOrBlobToDisk(node.url, targetDir + node.name);
                }
                return data;
            }
            case "video": {
                if (node.nodeData && typeof node.nodeData.getVideoElement === 'function') {
                    const videoEl = node.nodeData.getVideoElement();
                    if (videoEl) {
                        node._videoLoop = videoEl.loop;
                        node._videoMuted = videoEl.muted;
                        node._videoVolume = videoEl.volume;
                        node._videoPlaying = !videoEl.paused;
                    }
                }
                let data = {
                    type: "video",
                    path: randomDir,
                    name: node.name,
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
                
                if (isZip) {
                    await addFileToZip(dest, "assets/" + randomDir + "/" + node.name, node.url);
                } else {
                    let targetDir = dest + randomDir + "/";
                    fse.ensureDirSync(targetDir);
                    await copyFileOrBlobToDisk(node.url, targetDir + node.name);
                }
                return data;
            }
            case "text": {
                let data = {
                    type: "text",
                    name: node.name,
                    text: node.text,
                    fontFamily: node.style.fontFamily,
                    fontSize: node.style.fontSize,
                    fill: node.style.fill,
                    align: node.style.align,
                    scale: node.scale.x,
                    scaleX: node.scale.x,
                    scaleY: node.scale.y,
                    x: node.x,
                    y: node.y,
                    rotation: node.rotation,
                    alpha: node.alpha,
                };
                return data;
            }
            case "rect": {
                let data = {
                    type: "rect",
                    name: node.name,
                    width: node._rectWidth,
                    height: node._rectHeight,
                    fill: node._rectFill,
                    radius: node._rectRadius,
                    borderWidth: node._rectBorderWidth,
                    borderColor: node._rectBorderColor,
                    scale: node.scale.x,
                    scaleX: node.scale.x,
                    scaleY: node.scale.y,
                    x: node.x,
                    y: node.y,
                    rotation: node.rotation,
                    alpha: node.alpha,
                };
                return data;
            }
            case "animatedSprite": {
                let data = {
                    type: "animatedSprite",
                    path: randomDir,
                    name: node.name,
                    sourceType: node.nodeData.sourceType,
                    scale: node.scale.x,
                    scaleX: node.scale.x,
                    scaleY: node.scale.y,
                    x: node.x,
                    y: node.y,
                    rotation: node.rotation,
                    alpha: node.alpha,
                    animationSpeed: node.nodeData.animationSpeed,
                    loop: node.nodeData.loop,
                    playing: node.nodeData.playing,
                };
                
                if (node.nodeData.sourceType === 'spritesheet') {
                    data.jsonName = node.nodeData.extraInfo.jsonName || (node.name + '.json');
                    data.imageName = node.nodeData.extraInfo.imageName || 'sheet.png';
                    data.originalJson = node.nodeData.extraInfo.originalJson;
                    
                    if (isZip) {
                        dest.file("assets/" + randomDir + "/" + data.jsonName, JSON.stringify(node.nodeData.extraInfo.originalJson, null, 4));
                        await addFileToZip(dest, "assets/" + randomDir + "/" + data.imageName, node.nodeData.extraInfo.imageSrc);
                    } else {
                        let targetDir = dest + randomDir + "/";
                        fse.ensureDirSync(targetDir);
                        fse.outputJsonSync(targetDir + data.jsonName, node.nodeData.extraInfo.originalJson);
                        await copyFileOrBlobToDisk(node.nodeData.extraInfo.imageSrc, targetDir + data.imageName);
                    }
                } else if (node.nodeData.sourceType === 'grid') {
                    data.imageName = node.nodeData.extraInfo.imageName || 'sheet.png';
                    data.rows = node.nodeData.extraInfo.rows;
                    data.cols = node.nodeData.extraInfo.cols;
                    
                    if (isZip) {
                        await addFileToZip(dest, "assets/" + randomDir + "/" + data.imageName, node.nodeData.extraInfo.imageSrc);
                    } else {
                        let targetDir = dest + randomDir + "/";
                        fse.ensureDirSync(targetDir);
                        await copyFileOrBlobToDisk(node.nodeData.extraInfo.imageSrc, targetDir + data.imageName);
                    }
                } else {
                    // sourceType === 'images'
                    data.images = node.nodeData.extraInfo.imagesInfo.map((info, idx) => {
                        return {
                            name: info.name,
                            savedName: `frame_${idx}_` + info.name
                        };
                    });
                    
                    for (let i = 0; i < node.nodeData.extraInfo.imagesInfo.length; i++) {
                        const info = node.nodeData.extraInfo.imagesInfo[i];
                        const savedName = `frame_${i}_` + info.name;
                        if (isZip) {
                            await addFileToZip(dest, "assets/" + randomDir + "/" + savedName, info.url);
                        } else {
                            let targetDir = dest + randomDir + "/";
                            fse.ensureDirSync(targetDir);
                            await copyFileOrBlobToDisk(info.url, targetDir + savedName);
                        }
                    }
                }
                return data;
            }
        }
        return null;
    }
};

export default nodeAssetCopier;
