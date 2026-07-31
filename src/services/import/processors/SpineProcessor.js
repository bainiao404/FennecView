import { BaseProcessor } from './BaseProcessor'
import { parseAtlasTextures } from '../utils/atlasParser'
import FennecView from '@/fennec-view/FennecView'
import { blobRegistry } from '@/services/resources/BlobRegistry'
import { isElectron } from '@/assets/gkd-js-0.2/env.js'

export class SpineProcessor extends BaseProcessor {
    /**
     * Detect if this file is a Spine skeleton entry point.
     */
    async detect(fileItem) {
        const name = fileItem.name.toLowerCase();
        if (name.endsWith('.skel') || name.endsWith('.spine-json')) {
            return true;
        }
        if (name.endsWith('.json')) {
            // Exclude model3.json / model.json explicitly
            if (name.endsWith('.model3.json') || name.endsWith('.model.json')) {
                return false;
            }
            try {
                const text = await this.readFileAsText(fileItem);
                const parsed = JSON.parse(text);
                if (parsed.frames && parsed.meta && parsed.meta.image) {
                    return false; // Spritesheet
                }
                if (parsed.model || parsed.FileReferences) {
                    return false; // Live2D
                }
                // If it has skeleton/bones or looks like Spine
                if (parsed.skeleton || parsed.bones || parsed.animations || parsed.slots) {
                    return true;
                }
                // Fallback: if it doesn't match spritesheet/live2d, it could be a Spine JSON
                return true;
            } catch (e) {
                // If JSON parsing fails, it's not a valid Spine JSON (could be skel named json, or corrupted)
                return false;
            }
        }
        return false;
    }

    /**
     * Group Spine files and evaluate completeness.
     */
    async group(entryFile, pool) {
        const baseName = entryFile.name.substring(0, entryFile.name.lastIndexOf('.'));
        const dirPath = entryFile.relativePath.substring(0, entryFile.relativePath.lastIndexOf('/') + 1);
        
        // Find matching atlas file
        // Match 1: BaseName + .atlas in same dir
        // Match 2: Any .atlas in same dir if only one exists
        // Match 3: Same BaseName anywhere in pool
        let atlasFile = pool.find(f => {
            const fName = f.name.toLowerCase();
            const fDir = f.relativePath.substring(0, f.relativePath.lastIndexOf('/') + 1);
            return fName === `${baseName.toLowerCase()}.atlas` && fDir === dirPath;
        });

        if (!atlasFile) {
            const dirAtlases = pool.filter(f => {
                const fDir = f.relativePath.substring(0, f.relativePath.lastIndexOf('/') + 1);
                return f.name.toLowerCase().endsWith('.atlas') && fDir === dirPath;
            });
            if (dirAtlases.length === 1) {
                atlasFile = dirAtlases[0];
            }
        }

        if (!atlasFile) {
            atlasFile = pool.find(f => f.name.toLowerCase() === `${baseName.toLowerCase()}.atlas`);
        }

        const missingFiles = [];
        const textures = [];
        const foundTexturesMap = {};

        if (atlasFile) {
            try {
                const atlasText = await this.readFileAsText(atlasFile);
                const requiredTextures = parseAtlasTextures(atlasText);
                
                for (const texName of requiredTextures) {
                    // Try to find in same directory first
                    let texFile = pool.find(f => {
                        const fDir = f.relativePath.substring(0, f.relativePath.lastIndexOf('/') + 1);
                        if (fDir !== dirPath) return false;
                        
                        const fName = f.name.toLowerCase();
                        const tName = texName.toLowerCase();
                        if (fName === tName) return true;
                        
                        const fNameNoExt = fName.substring(0, fName.lastIndexOf('.'));
                        const tNameNoExt = tName.includes('.') ? tName.substring(0, tName.lastIndexOf('.')) : tName;
                        return fNameNoExt === tNameNoExt;
                    });
                    
                    // Fallback to finding by name anywhere in pool
                    if (!texFile) {
                        texFile = pool.find(f => {
                            const fName = f.name.toLowerCase();
                            const tName = texName.toLowerCase();
                            if (fName === tName) return true;
                            
                            const fNameNoExt = fName.substring(0, fName.lastIndexOf('.'));
                            const tNameNoExt = tName.includes('.') ? tName.substring(0, tName.lastIndexOf('.')) : tName;
                            return fNameNoExt === tNameNoExt;
                        });
                    }
                    
                    if (texFile) {
                        textures.push(texFile);
                        foundTexturesMap[texName] = texFile;
                    } else {
                        missingFiles.push({
                            name: texName,
                            type: 'texture',
                            description: `纹理图片 ${texName}`
                        });
                    }
                }
            } catch (e) {
                console.error('Failed to parse atlas file:', atlasFile.name, e);
                missingFiles.push({
                    name: `${baseName} textures`,
                    type: 'texture',
                    description: '无法读取图集内容以获取纹理依赖'
                });
            }
        } else {
            missingFiles.push({
                name: `${baseName}.atlas`,
                type: 'atlas',
                description: `Spine 图集文件 (${baseName}.atlas)`
            });
        }

        const status = missingFiles.length === 0 ? 'complete' : 'incomplete';

        return {
            id: 'spine_' + entryFile.relativePath,
            type: 'spine',
            name: baseName,
            status,
            entryFile,
            associatedFiles: {
                skeleton: entryFile,
                atlas: atlasFile || null,
                textures: textures,
                foundTexturesMap: foundTexturesMap
            },
            missingFiles,
            config: {
                name: baseName,
                textureMode: FennecView.system?.import?.textureMode !== undefined ? FennecView.system.import.textureMode : 3
            }
        };
    }

    /**
     * Import Spine asset into the PIXI scene.
     */
    async import(importItem) {
        if (importItem.status !== 'complete') {
            throw new Error(`Spine asset ${importItem.name} is incomplete and cannot be imported.`);
        }

        const skelFile = importItem.associatedFiles.skeleton;
        const atlasFile = importItem.associatedFiles.atlas;
        const foundTexturesMap = importItem.associatedFiles.foundTexturesMap || {};

        // If we are in Electron and using native paths, load from disk directly
        if (isElectron() && skelFile.isNative) {
            const localPath = skelFile.path;
            const nodes = await FennecView.addSpineNode([localPath], Number(importItem.config.textureMode));
            if (nodes && nodes[0]) {
                nodes[0].name = importItem.config.name;
            }
            return nodes;
        }

        // Web mode: use Blob URLs
        const skelBlobUrl = await this.getFileBlobUrl(skelFile);
        const atlasText = await this.readFileAsText(atlasFile);
        
        // Re-register atlas as Blob URL
        const atlasBlob = new Blob([atlasText], { type: 'text/plain' });
        const atlasBlobUrl = blobRegistry.createURL(atlasBlob);

        // Map textures using the exact names defined in the atlas as keys
        const imageBlobMaps = {};
        await Promise.all(
            Object.entries(foundTexturesMap).map(async ([texName, fileItem]) => {
                imageBlobMaps[texName] = await this.getFileBlobUrl(fileItem);
            })
        );

        const isSkel = skelFile.name.toLowerCase().endsWith('.skel');
        const spineSrcObj = {
            type: isSkel ? 'skel' : 'json',
            path: [skelBlobUrl, atlasBlobUrl, ''],
            atlasPath: atlasBlobUrl,
            texturePath: '',
            textures: imageBlobMaps,
            name: importItem.config.name || skelFile.name
        };

        const nodes = await FennecView.addSpineNode([spineSrcObj], Number(importItem.config.textureMode));
        if (nodes && nodes[0]) {
            nodes[0].name = importItem.config.name;
        }
        return nodes;
    }
}
