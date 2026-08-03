import { live2dNode } from './Live2dNode'
import { loadLive2D, serializeLive2D, loadPreviewLive2D } from './live2dLoader'

export default {
    install(registry) {
        registry.register("live2d", {
            nodeClass: live2dNode,
            loader: loadLive2D,
            previewLoader: loadPreviewLive2D,
            // Wrap serialize to pass helper methods properly
            serialize: async (node, dest, randomDir, zipPrefix, addFileToZip) => {
                const { readFileAsArrayBuffer } = await import('@/utils/helpers');
                return await serializeLive2D(node, dest, randomDir, zipPrefix, addFileToZip, readFileAsArrayBuffer);
            },
            create: (src, options) => {
                const finalSrc = (src && typeof src === 'object' && src.path && src.path[0]) ? src.path[0] : src;
                return new live2dNode(finalSrc, options);
            }
        });
    }
};
