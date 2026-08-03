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
            create: (textures, sourceType, extraInfo) => new animatedSpriteNode(textures, sourceType, extraInfo)
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
