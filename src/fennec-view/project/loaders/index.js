import { nodeRegistry } from '../../core/NodeRegistry'

const loadersProxy = new Proxy({}, {
    get(target, prop) {
        const def = nodeRegistry.get(prop);
        return def ? def.loader : null;
    }
});

export default loadersProxy;
export { loadersProxy as loaders };
