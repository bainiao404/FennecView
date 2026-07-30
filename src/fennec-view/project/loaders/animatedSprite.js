import { blobRegistry } from '@/services/resources/BlobRegistry'

async function loadTexture(url) {
    let loadOptions = url
    if (url && typeof url === 'string' && url.startsWith('blob:')) {
        loadOptions = {
            src: url,
            loadParser: 'loadTextures'
        }
    }
    return await PIXI.Assets.load(loadOptions)
}

export async function loadAnimatedSprite(nodeConfig, zip) {
    const baseZipDir = "assets/" + nodeConfig.path + "/";
    let textures = [];
    let originalJson = nodeConfig.originalJson || null;
    let imageSrc = "";
    let imagesInfo = [];
    let jsonName = nodeConfig.jsonName || "";
    let imageName = nodeConfig.imageName || "";
    
    if (nodeConfig.sourceType === 'spritesheet') {
        const jsonFile = zip.file(baseZipDir + jsonName);
        if (!jsonFile) return;
        const jsonStr = await jsonFile.async("string");
        originalJson = JSON.parse(jsonStr);
        
        const imageFile = zip.file(baseZipDir + imageName);
        if (!imageFile) return;
        const imageBuffer = await imageFile.async("arraybuffer");
        const imageBlob = new Blob([imageBuffer], { type: "image/png" });
        imageSrc = blobRegistry.createURL(imageBlob);
        
        const baseTexture = await loadTexture(imageSrc);
        const spritesheet = new PIXI.Spritesheet(baseTexture, originalJson);
        await spritesheet.parse();
        textures = Object.values(spritesheet.textures);
    } else if (nodeConfig.sourceType === 'grid') {
        const imageFile = zip.file(baseZipDir + imageName);
        if (!imageFile) return;
        const imageBuffer = await imageFile.async("arraybuffer");
        const imageBlob = new Blob([imageBuffer], { type: "image/png" });
        imageSrc = blobRegistry.createURL(imageBlob);
        
        const baseTexture = await loadTexture(imageSrc);
        const rows = nodeConfig.rows;
        const cols = nodeConfig.cols;
        const frameW = baseTexture.width / cols;
        const frameH = baseTexture.height / rows;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const rect = new PIXI.Rectangle(c * frameW, r * frameH, frameW, frameH);
                const frameTexture = new PIXI.Texture(baseTexture.baseTexture || baseTexture, rect);
                textures.push(frameTexture);
            }
        }
    } else {
        // sourceType === 'images'
        for (let imgConfig of nodeConfig.images) {
            const imgFile = zip.file(baseZipDir + imgConfig.savedName);
            if (!imgFile) continue;
            const imgBuffer = await imgFile.async("arraybuffer");
            const imgBlob = new Blob([imgBuffer], { type: "image/png" });
            const imgUrl = blobRegistry.createURL(imgBlob);
            
            const texture = await loadTexture(imgUrl);
            textures.push(texture);
            imagesInfo.push({
                name: imgConfig.name,
                url: imgUrl
            });
        }
    }
    
    if (textures.length === 0) return;
    
    let animatedSpriteNodes = await this.addAnimatedSpriteNode(textures, nodeConfig.sourceType, {
        name: nodeConfig.name,
        originalJson,
        imageSrc,
        jsonName,
        imageName,
        imagesInfo,
        rows: nodeConfig.rows,
        cols: nodeConfig.cols
    });
    
    let mNode = animatedSpriteNodes[0];
    if (mNode) {
        mNode.scale.set(nodeConfig.scaleX !== undefined ? nodeConfig.scaleX : nodeConfig.scale, nodeConfig.scaleY !== undefined ? nodeConfig.scaleY : nodeConfig.scale);
        mNode.x = nodeConfig.x;
        mNode.y = nodeConfig.y;
        if (nodeConfig.rotation !== undefined) mNode.rotation = nodeConfig.rotation;
        if (nodeConfig.alpha !== undefined) mNode.alpha = nodeConfig.alpha;
        mNode.nodeData.animationSpeed = nodeConfig.animationSpeed !== undefined ? nodeConfig.animationSpeed : 1.0;
        mNode.nodeData.loop = nodeConfig.loop !== undefined ? nodeConfig.loop : true;
        mNode.nodeData.playing = nodeConfig.playing !== undefined ? nodeConfig.playing : true;
    }
}
export default loadAnimatedSprite;
