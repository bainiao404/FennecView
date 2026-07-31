import { BaseProcessor } from './BaseProcessor'
import FennecView from '@/fennec-view/FennecView'
import { blobRegistry } from '@/services/resources/BlobRegistry'
import { isElectron } from '@/assets/gkd-js-0.2/env.js'

export class SpritesheetProcessor extends BaseProcessor {
    /**
     * Detect if this file is a Spritesheet JSON.
     */
    async detect(fileItem) {
        const name = fileItem.name.toLowerCase();
        if (name.endsWith('.json')) {
            try {
                const text = await this.readFileAsText(fileItem);
                const parsed = JSON.parse(text);
                if (parsed.frames && parsed.meta && parsed.meta.image) {
                    return true;
                }
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    /**
     * Group Spritesheet files and evaluate completeness.
     */
    async group(entryFile, pool) {
        const baseName = entryFile.name.substring(0, entryFile.name.lastIndexOf('.'));
        const dirPath = entryFile.relativePath.substring(0, entryFile.relativePath.lastIndexOf('/') + 1);

        let parsedJson = null;
        let imageName = '';
        let imageFile = null;
        const missingFiles = [];

        try {
            const text = await this.readFileAsText(entryFile);
            parsedJson = JSON.parse(text);
            imageName = parsedJson.meta.image;

            // Find matching image file
            // Match 1: exact imageName in same dir
            // Match 2: only one image in pool if it is size 1
            // Match 3: imageName anywhere in pool
            imageFile = pool.find(f => {
                const fDir = f.relativePath.substring(0, f.relativePath.lastIndexOf('/') + 1);
                return f.name.toLowerCase() === imageName.toLowerCase() && fDir === dirPath;
            });

            if (!imageFile) {
                imageFile = this.findFileByName(pool, imageName);
            }

            if (!imageFile) {
                const imagesInDir = pool.filter(f => {
                    const fDir = f.relativePath.substring(0, f.relativePath.lastIndexOf('/') + 1);
                    return /\.(png|jpg|jpeg|webp)$/i.test(f.name) && fDir === dirPath;
                });
                if (imagesInDir.length === 1) {
                    imageFile = imagesInDir[0];
                }
            }

            if (!imageFile) {
                missingFiles.push({
                    name: imageName,
                    type: 'image',
                    description: `精灵表对应的纹理图片 ${imageName}`
                });
            }
        } catch (e) {
            console.error('Failed to parse Spritesheet JSON:', entryFile.name, e);
            missingFiles.push({
                name: entryFile.name,
                description: '无法读取或解析精灵表 JSON 配置文件'
            });
        }

        const status = missingFiles.length === 0 ? 'complete' : 'incomplete';

        return {
            id: 'spritesheet_' + entryFile.relativePath,
            type: 'spritesheet',
            name: baseName,
            status,
            entryFile,
            associatedFiles: {
                json: entryFile,
                image: imageFile || null
            },
            missingFiles,
            config: {
                name: baseName,
                originalJson: parsedJson
            }
        };
    }

    /**
     * Import Spritesheet into the PIXI scene.
     */
    async import(importItem) {
        if (importItem.status !== 'complete') {
            throw new Error(`Spritesheet ${importItem.name} is incomplete and cannot be imported.`);
        }

        const jsonFile = importItem.associatedFiles.json;
        const imageFile = importItem.associatedFiles.image;
        const PIXI = window.PIXI;

        // If we are in Electron and using native paths, load from disk directly
        if (isElectron() && jsonFile.isNative && imageFile.isNative) {
            const jsonText = await this.readFileAsText(jsonFile);
            const json = JSON.parse(jsonText);
            
            const imagePath = imageFile.path;
            const baseTexture = await PIXI.Assets.load(imagePath);
            
            const spritesheet = new PIXI.Spritesheet(baseTexture, json);
            await spritesheet.parse();
            
            const textures = Object.values(spritesheet.textures);
            if (textures.length > 0) {
                const name = importItem.config.name;
                await FennecView.addAnimatedSpriteNode(textures, 'spritesheet', {
                    name,
                    originalJson: json,
                    imageSrc: imagePath,
                    jsonName: jsonFile.name,
                    imageName: imageFile.name
                });
            }
            return;
        }

        // Web mode: use Blob URLs
        const imageSrc = await this.getFileBlobUrl(imageFile);
        
        // Helper to load texture
        let loadOptions = imageSrc;
        if (imageSrc && typeof imageSrc === 'string' && imageSrc.startsWith('blob:')) {
            loadOptions = {
                src: imageSrc,
                loadParser: 'loadTextures'
            };
        }
        const baseTexture = await PIXI.Assets.load(loadOptions);
        
        const jsonText = await this.readFileAsText(jsonFile);
        const json = JSON.parse(jsonText);
        
        const spritesheet = new PIXI.Spritesheet(baseTexture, json);
        await spritesheet.parse();
        
        const textures = Object.values(spritesheet.textures);
        if (textures.length > 0) {
            const name = importItem.config.name;
            await FennecView.addAnimatedSpriteNode(textures, 'spritesheet', {
                name,
                originalJson: json,
                imageSrc,
                jsonName: jsonFile.name,
                imageName: imageFile.name
            });
        }
    }
}
