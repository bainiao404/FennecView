import FennecView from '@/fennec-view/FennecView'
import { fileResourceManager } from '@/services/resources/FileResourceManager'
import { animatedSpriteNode } from './AnimatedSpriteNode'
import { loadAnimatedSprite, serializeAnimatedSprite, loadPreviewAnimatedSprite } from './animatedSpriteLoader'

export default {
    install(registry) {
        registry.register("animatedSprite", {
            nodeClass: animatedSpriteNode,
            loader: loadAnimatedSprite,
            previewLoader: loadPreviewAnimatedSprite,
            serialize: serializeAnimatedSprite,
            create: (textures, sourceType, extraInfo) => new animatedSpriteNode(textures, sourceType, extraInfo),
            import: async (importItem) => {
                const PIXI = window.PIXI;
                const { fileResourceManager } = await import('@/services/resources/FileResourceManager')

                if (importItem.type === 'animated_sprite') {
                    const textures = [];
                    const imagesInfo = [];
                    
                    async function loadTexture(url) {
                        let loadOptions = url;
                        if (url && typeof url === 'string' && url.startsWith('blob:')) {
                            loadOptions = {
                                src: url,
                                loadParser: 'loadTextures'
                            };
                        }
                        return await PIXI.Assets.load(loadOptions);
                    }

                    const frames = importItem.associatedFiles?.frames || [];
                    for (const fileItem of frames) {
                        const url = await fileItem.getLoadUrl();
                        if (fileItem.isNative) {
                            fileResourceManager.registerFile(fileItem.name, null, { path: url });
                        }
                        fileResourceManager.addFileToGroup(importItem.id, url);
                        
                        const texture = await loadTexture(url);
                        textures.push(texture);
                        imagesInfo.push({
                            name: fileItem.name,
                            url: url
                        });
                    }

                    if (textures.length > 0 && typeof FennecView.addAnimatedSpriteNode === 'function') {
                        const node = await FennecView.addAnimatedSpriteNode(textures, 'images', {
                            name: importItem.config.name,
                            imagesInfo,
                            resourceId: importItem.id
                        });
                        if (node && node[0]) {
                            const pixiNode = node[0];
                            const frameDuration = importItem.config.animationSpeed || 100;
                            if (pixiNode.nodeData) {
                                pixiNode.nodeData.animationSpeed = frameDuration;
                            }
                            if (pixiNode.loop !== undefined) {
                                pixiNode.loop = importItem.config.loop ?? true;
                            }
                        }
                        return node;
                    }
                } else if (importItem.type === 'spritesheet_grid') {
                    const imageFile = importItem.associatedFiles.image;
                    const imageSrc = await imageFile.getLoadUrl();
                    
                    if (imageFile.isNative) {
                        fileResourceManager.registerFile(imageFile.name, null, { path: imageSrc });
                    }
                    fileResourceManager.addFileToGroup(importItem.id, imageSrc);

                    async function loadTexture(url) {
                        let loadOptions = url;
                        if (url && typeof url === 'string' && url.startsWith('blob:')) {
                            loadOptions = {
                                src: url,
                                loadParser: 'loadTextures'
                            };
                        }
                        return await PIXI.Assets.load(loadOptions);
                    }

                    const baseTexture = await loadTexture(imageSrc);
                    const rows = importItem.config.rows || 1;
                    const cols = importItem.config.cols || 1;
                    const frameW = baseTexture.width / cols;
                    const frameH = baseTexture.height / rows;

                    const textures = [];
                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            const rect = new PIXI.Rectangle(c * frameW, r * frameH, frameW, frameH);
                            const frameTexture = new PIXI.Texture({
                                source: baseTexture.source || baseTexture,
                                frame: rect
                            });
                            textures.push(frameTexture);
                        }
                    }

                    if (textures.length > 0 && typeof FennecView.addAnimatedSpriteNode === 'function') {
                        const node = await FennecView.addAnimatedSpriteNode(textures, 'grid', {
                            name: importItem.config.name,
                            imageSrc,
                            imageName: imageFile.name,
                            rows,
                            cols,
                            resourceId: importItem.id
                        });
                        if (node && node[0]) {
                            const pixiNode = node[0];
                            const frameDuration = importItem.config.animationSpeed || 100;
                            if (pixiNode.nodeData) {
                                pixiNode.nodeData.animationSpeed = frameDuration;
                            }
                            if (pixiNode.loop !== undefined) {
                                pixiNode.loop = importItem.config.loop ?? true;
                            }
                        }
                        return node;
                    }
                }
                return [];
            }
        });

        FennecView.addAnimatedSpriteNode = async function (textures, sourceType, extraInfo = {}) {
            let box = this.canvas.box;
            let nodeInstance = new animatedSpriteNode(textures, sourceType, extraInfo);
            let pixiNode = await nodeInstance;
            if (pixiNode) {
                if (extraInfo.resourceId) {
                    pixiNode.resourceId = extraInfo.resourceId;
                    fileResourceManager.bindNodeToGroup(pixiNode, extraInfo.resourceId);
                }
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
