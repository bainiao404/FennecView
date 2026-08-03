import { addFileToZip } from '@/utils/helpers'
import { nodeRegistry } from '../core/NodeRegistry'

const nodeAssetCopier = {
    generateRandomString: function () {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    copyNodeAssets: async function (node, dest, isZip = true, zipPrefix = "assets/") {
        let randomDir = this.generateRandomString();
        
        const def = nodeRegistry.get(node.nodeData.type);
        if (def && def.serialize) {
            return await def.serialize(node, dest, randomDir, zipPrefix, addFileToZip);
        }
        return null;
    }
};

export default nodeAssetCopier;
