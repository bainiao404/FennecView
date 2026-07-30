const fs = require('fs');

const addImports = (file, imports) => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/^import .*$/gm, '');
    content = content.replace(/^\/\*\*[\s\S]*?\*\//, '');
    content = imports + '\n\n' + content.trim();
    fs.writeFileSync(file, content);
}

addImports('src/fennec-view/nodes/SpineNode.js', `import { node } from './BaseNode'
import SimpleSpine from '@/assets/SimpleSpine-0.2'`);

addImports('src/fennec-view/nodes/ImgNode.js', `import { node } from './BaseNode'
import { blobRegistry } from '@/services/resources/BlobRegistry'`);

addImports('src/fennec-view/nodes/Live2dNode.js', `import { node } from './BaseNode'
import FennecView from '../FennecView'
import { toTitleCase } from '@/utils/baseScript'`);

addImports('src/fennec-view/nodes/TextNode.js', `import { node } from './BaseNode'`);

addImports('src/fennec-view/nodes/SceneResourceManager.js', `import { spineNode } from './SpineNode'
import { imgNode } from './ImgNode'
import { live2dNode } from './Live2dNode'
import { textNode } from './TextNode'
import { blobRegistry } from '@/services/resources/BlobRegistry'`);

console.log('Imports added successfully.');
