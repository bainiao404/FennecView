import { blobRegistry } from '@/services/resources/BlobRegistry'
import { fileResourceManager } from '@/services/resources/FileResourceManager'

let PIXI = null;

async function loadTexture(url) {
    if (!PIXI) PIXI = window.PIXI;
    let loadOptions = url
    if (url && typeof url === 'string' && url.startsWith('blob:')) {
        loadOptions = {
            src: url,
            loadParser: 'loadTextures',
        }
    }
    return await PIXI.Assets.load(loadOptions)
}

export async function loadAnimatedSprite(nodeConfig, zip) {
    if (!PIXI) PIXI = window.PIXI;
    const baseZipDir = 'assets/' + nodeConfig.path + '/'
    let textures = []
    let originalJson = nodeConfig.originalJson || null
    let imageSrc = ''
    let imagesInfo = []
    let jsonName = nodeConfig.jsonName || ''
    let imageName = nodeConfig.imageName || ''

    const resourceId = nodeConfig.resourceId || `animatedSprite_${Math.random().toString(36).substring(2, 9)}`;

    if (nodeConfig.sourceType === 'spritesheet') {
        const jsonFile = zip.file(baseZipDir + jsonName)
        if (!jsonFile) return
        const jsonStr = await jsonFile.async('string')
        originalJson = JSON.parse(jsonStr)

        const jsonBlob = new Blob([jsonStr], { type: 'application/json' })
        const jsonUrl = blobRegistry.createURL(jsonBlob, jsonName)
        fileResourceManager.addFileToGroup(resourceId, jsonUrl)

        const imageFile = zip.file(baseZipDir + imageName)
        if (!imageFile) return
        const imageBuffer = await imageFile.async('arraybuffer')
        const imageBlob = new Blob([imageBuffer], { type: 'image/png' })
        imageSrc = blobRegistry.createURL(imageBlob, imageName)
        fileResourceManager.addFileToGroup(resourceId, imageSrc)

        const baseTexture = await loadTexture(imageSrc)
        const spritesheet = new PIXI.Spritesheet(baseTexture, originalJson)
        await spritesheet.parse()
        textures = Object.values(spritesheet.textures)
    } else if (nodeConfig.sourceType === 'grid') {
        const imageFile = zip.file(baseZipDir + imageName)
        if (!imageFile) return
        const imageBuffer = await imageFile.async('arraybuffer')
        const imageBlob = new Blob([imageBuffer], { type: 'image/png' })
        imageSrc = blobRegistry.createURL(imageBlob, imageName)
        fileResourceManager.addFileToGroup(resourceId, imageSrc)

        const baseTexture = await loadTexture(imageSrc)
        const rows = nodeConfig.rows
        const cols = nodeConfig.cols
        const frameW = baseTexture.width / cols
        const frameH = baseTexture.height / rows

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const rect = new PIXI.Rectangle(c * frameW, r * frameH, frameW, frameH)
                const frameTexture = new PIXI.Texture({
                    source: baseTexture.source || baseTexture,
                    frame: rect
                })
                textures.push(frameTexture)
            }
        }
    } else {
        // sourceType === 'images'
        for (let imgConfig of nodeConfig.images) {
            const imgFile = zip.file(baseZipDir + imgConfig.savedName)
            if (!imgFile) continue
            const imgBuffer = await imgFile.async('arraybuffer')
            const imgBlob = new Blob([imgBuffer], { type: 'image/png' })
            const imgUrl = blobRegistry.createURL(imgBlob, imgConfig.name)
            fileResourceManager.addFileToGroup(resourceId, imgUrl)

            const texture = await loadTexture(imgUrl)
            textures.push(texture)
            imagesInfo.push({
                name: imgConfig.name,
                url: imgUrl,
            })
        }
    }

    if (textures.length === 0) return

    let animatedSpriteNodes = await this.addAnimatedSpriteNode(textures, nodeConfig.sourceType, {
        name: nodeConfig.name,
        originalJson,
        imageSrc,
        jsonName,
        imageName,
        imagesInfo,
        rows: nodeConfig.rows,
        cols: nodeConfig.cols,
        resourceId: resourceId
    })

    let mNode = animatedSpriteNodes[0]
    if (mNode) {
        mNode.scale.set(
            nodeConfig.scaleX !== undefined ? nodeConfig.scaleX : nodeConfig.scale,
            nodeConfig.scaleY !== undefined ? nodeConfig.scaleY : nodeConfig.scale,
        )
        mNode.x = nodeConfig.x
        mNode.y = nodeConfig.y
        if (nodeConfig.rotation !== undefined) mNode.rotation = nodeConfig.rotation
        if (nodeConfig.alpha !== undefined) mNode.alpha = nodeConfig.alpha
        mNode.nodeData.animationSpeed = nodeConfig.animationSpeed !== undefined ? nodeConfig.animationSpeed : 1.0
        mNode.nodeData.loop = nodeConfig.loop !== undefined ? nodeConfig.loop : true
        mNode.nodeData.playing = nodeConfig.playing !== undefined ? nodeConfig.playing : true
    }
}

export async function serializeAnimatedSprite(node, dest, randomDir, zipPrefix, addFileToZip) {
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
        
        dest.file(zipPrefix + randomDir + "/" + data.jsonName, JSON.stringify(node.nodeData.extraInfo.originalJson, null, 4));
        await addFileToZip(dest, zipPrefix + randomDir + "/" + data.imageName, node.nodeData.extraInfo.imageSrc);
    } else if (node.nodeData.sourceType === 'grid') {
        data.imageName = node.nodeData.extraInfo.imageName || 'sheet.png';
        data.rows = node.nodeData.extraInfo.rows;
        data.cols = node.nodeData.extraInfo.cols;
        
        await addFileToZip(dest, zipPrefix + randomDir + "/" + data.imageName, node.nodeData.extraInfo.imageSrc);
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
            await addFileToZip(dest, zipPrefix + randomDir + "/" + savedName, info.url);
        }
    }
    return data;
}

export async function loadPreviewAnimatedSprite(nodeConfig, mCacheNode) {
    if (!PIXI) PIXI = window.PIXI;
    let textures = [];
    let originalJson = nodeConfig.originalJson;
    let imageSrc = nodeConfig.imageSrc;
    if (nodeConfig.sourceType === 'spritesheet' || nodeConfig.sourceType === 'grid') {
        imageSrc = 'export/' + nodeConfig.path + '/' + nodeConfig.imageName;
    }
    let imagesInfo = [];
    
    if (nodeConfig.sourceType === 'spritesheet') {
        const baseTexture = await loadTexture(imageSrc);
        const spritesheet = new PIXI.Spritesheet(baseTexture, originalJson);
        await spritesheet.parse();
        textures = Object.values(spritesheet.textures);
    } else if (nodeConfig.sourceType === 'grid') {
        const baseTexture = await loadTexture(imageSrc);
        const rows = nodeConfig.rows;
        const cols = nodeConfig.cols;
        const frameW = baseTexture.width / cols;
        const frameH = baseTexture.height / rows;
        
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
    } else {
        // images
        for (let i = 0; i < nodeConfig.images.length; i++) {
            const imgInfo = nodeConfig.images[i];
            const imgUrl = 'export/' + nodeConfig.path + '/' + imgInfo.savedName;
            const texture = await loadTexture(imgUrl);
            textures.push(texture);
            imagesInfo.push({
                name: imgInfo.name,
                url: imgUrl
            });
        }
    }
    
    if (textures.length > 0) {
        let animatedSpriteNodes = await this.addAnimatedSpriteNode(textures, nodeConfig.sourceType, {
            name: nodeConfig.name,
            originalJson,
            imageSrc,
            jsonName: nodeConfig.jsonName,
            imageName: nodeConfig.imageName,
            imagesInfo,
            rows: nodeConfig.rows,
            cols: nodeConfig.cols
        });
        let mNode = animatedSpriteNodes[0];
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
            mNode.nodeData.animationSpeed = nodeConfig.animationSpeed !== undefined ? nodeConfig.animationSpeed : 1.0;
            mNode.nodeData.loop = nodeConfig.loop !== undefined ? nodeConfig.loop : true;
            mNode.nodeData.playing = nodeConfig.playing !== undefined ? nodeConfig.playing : true;
            mCacheNode.push(mNode);
        }
    }
}
