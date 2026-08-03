/**
 * FennecView Texture Helpers - Modular ES6 version
 */

import FennecView from './FennecView'

export function updateTexturePreview(img_data) {
    const texture = img_data.texture;
    if (texture.source) {
        texture.source.alphaMode = 'premultiplied-alpha';
    } else if (texture.baseTexture) {
        texture.baseTexture.alphaMode = 1;
    }
    const sprite = new PIXI.Sprite(texture);
    
    const a = FennecView.canvas.texturePreviewContainer;
    a.removeChildren();
    a.addChild(sprite);
}

export function updateAtlasCanvas(node) {
    const textrue_node = FennecView.canvas.textureAtlasContainer;
    textrue_node.removeChildren();

    const data = getSlotMeshUVs(node);
    const list = data[0];
    const regions = node.skeleton.slots;
    const spineAtlas = node.spineAtlas.regions;
    for (let i = 0; i < spineAtlas.length; i++) {
        const polygon = new PIXI.Graphics();
        polygon.name = spineAtlas[i].name;
        polygon.rect(0, 0, spineAtlas[i].width, spineAtlas[i].height)
            .stroke({ width: 2, color: 0xff0044 });
        polygon.x = spineAtlas[i].x;
        polygon.y = spineAtlas[i].y;
        textrue_node.addChild(polygon);
    }
    for (let i = 0; i < data[1].length; i++) {
        const node_ = textrue_node.getChildByName(data[1][i]);
        if (node_ && data[0][i] && data[0][i].length > 0) {
            const polygon1 = new PIXI.Graphics();
            polygon1.poly(data[0][i])
                .stroke({ width: 2, color: 0x00ff00 });
            node_.addChild(polygon1);
        }
    }

    for (let i = 0; i < regions.length; i++) {
        let po = [];
        const a = regions[i].currentMesh;
        if (a && a.uvs) {
            po = [];
            for (let i_1 = 0; i_1 < list[i].length; i_1++) {
                po.push(a.uvs[i_1] * 2048);
            }
        }

        const polygon = new PIXI.Graphics();
        polygon.name = regions[i].name;
        if (po.length > 0) {
            polygon.poly(po)
                .stroke({ width: 5, color: 0xffffff });
        }
        polygon.t_data = regions[i];

        textrue_node.addChild(polygon);
    }
}

export function getSlotMeshUVs(e) {
    const a = e.skeleton.slots;
    const list = [];
    const name = [];
    for (let i = 0, o = a.length; i < o; i++) {
        const s = a[i];
        const h = s.getAttachment();
        const po = [];
        if (h) {
            const c = s.attachment.regionUVs;
            let d = h.hullLength;
            if (d > 0) {
                d = 2 * (d >> 1);
                for (let w = 0; w < d; w += 2) {
                    const M = c[w];
                    const E = c[w + 1];
                    po.push(M * a[i].attachment.region.width, E * a[i].attachment.region.height);
                }
            }
        }
        name.push(s.data.name);
        list.push(po);
    }

    return [list, name];
}
