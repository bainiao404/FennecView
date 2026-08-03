import * as PIXINamespace from 'pixi.js'
import { Live2DPlugin } from 'untitled-pixi-live2d-engine'
import { blobRegistry } from '@/services/resources/BlobRegistry'
import { MimeUtil } from '@/utils/MimeUtil'

// Register Live2D plugin in PixiJS v8
PIXINamespace.extensions.add(Live2DPlugin)

// Register custom resolve parser for blob URLs to specify their format
const blobResolveParser = {
    extension: PIXINamespace.ExtensionType.ResolveParser,
    test: (url) => {
        return typeof url === 'string' && url.startsWith('blob:');
    },
    parse: (url) => {
        const format = blobRegistry.getFormat(url);
        if (format) {
            const loadParser = MimeUtil.getPixiLoader(format);
            return {
                resolution: 1,
                format: format,
                loadParser: loadParser,
                parser: loadParser,
                src: url
            };
        }
        return {
            src: url
        };
    }
}
PIXINamespace.extensions.add(blobResolveParser)
