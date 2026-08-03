import { MimeUtil } from '@/utils/MimeUtil'

class FileResourceManager {
    constructor() {
        // Map from file identifier (blobUrl, path, relativePath, or name) to FileRecord
        this.files = new Map();
        
        // Map from resourceId -> Set of FileRecords
        this.resourceGroups = new Map();

        // Map from PIXI node -> Set of FileRecords
        this.nodeBindings = new Map();
    }

    /**
     * Clean native paths to unify forward slashes and remove file:// protocols.
     */
    cleanNativePath(p) {
        if (typeof p !== 'string') return '';
        let clean = p.replace(/\\/g, '/');
        if (clean.startsWith('file:///')) {
            clean = clean.substring(8);
        } else if (clean.startsWith('file://')) {
            clean = clean.substring(7);
        }
        return clean;
    }

    /**
     * Register a physical file with its details.
     * @param {string} name - File name (e.g. 'boy.png')
     * @param {Blob} blob - The Blob object (can be null in native mode before reading)
     * @param {Object} extraInfo - Additional identifiers like path, relativePath, or blobUrl
     * @returns {Object} The registered file record
     */
    registerFile(name, blob, extraInfo = {}) {
        if (!name) return null;
        
        const ext = name.split('.').pop().toLowerCase();
        const mime = (blob && blob.type) || MimeUtil.getMimeType(name);
        const size = (blob && blob.size) || 0;
        
        const record = {
            name,
            blob,
            ext,
            mime,
            size,
            path: extraInfo.path || '',
            relativePath: extraInfo.relativePath || '',
            blobUrl: extraInfo.blobUrl || ''
        };

        // Standardize paths for exact lookup
        const cleanPath = this.cleanNativePath(record.path);
        const cleanRel = this.cleanNativePath(record.relativePath);

        // Store record by multiple keys
        this.files.set(name.toLowerCase(), record);
        
        if (record.blobUrl) {
            this.files.set(record.blobUrl, record);
        }
        if (cleanPath) {
            this.files.set(cleanPath, record);
            this.files.set(cleanPath.toLowerCase(), record);
        }
        if (cleanRel) {
            this.files.set(cleanRel, record);
            this.files.set(cleanRel.toLowerCase(), record);
        }

        return record;
    }

    /**
     * Get a registered file record by any identifier (name, path, relativePath, or blobUrl).
     */
    getFile(identifier) {
        if (!identifier) return null;

        // 1. Direct match
        if (this.files.has(identifier)) {
            return this.files.get(identifier);
        }

        // 2. Case-insensitive direct match
        const lowerId = identifier.toLowerCase();
        if (this.files.has(lowerId)) {
            return this.files.get(lowerId);
        }

        // 3. Normalized path match
        const cleanId = this.cleanNativePath(identifier);
        if (this.files.has(cleanId)) {
            return this.files.get(cleanId);
        }
        const cleanLowerId = cleanId.toLowerCase();
        if (this.files.has(cleanLowerId)) {
            return this.files.get(cleanLowerId);
        }

        // 4. Ends-with path match fallback (useful for relative path resolutions)
        for (const [key, value] of this.files.entries()) {
            if (typeof key === 'string') {
                const normKey = this.cleanNativePath(key).toLowerCase();
                if (normKey.endsWith(cleanLowerId) || cleanLowerId.endsWith(normKey)) {
                    return value;
                }
            }
        }

        return null;
    }

    /**
     * Add a registered file to a resource group.
     */
    addFileToGroup(resourceId, identifier) {
        if (!resourceId || !identifier) return;
        
        const record = this.getFile(identifier);
        if (!record) return;

        if (!this.resourceGroups.has(resourceId)) {
            this.resourceGroups.set(resourceId, new Set());
        }
        this.resourceGroups.get(resourceId).add(record);
    }

    /**
     * Bind a node to a resource group by resourceId.
     */
    bindNodeToGroup(node, resourceId) {
        if (!node || !resourceId) return;
        
        const groupFiles = this.resourceGroups.get(resourceId);
        if (groupFiles) {
            this.nodeBindings.set(node, new Set(groupFiles));
        } else {
            // If the group doesn't exist yet, initialize an empty set to bind later
            const emptySet = new Set();
            this.resourceGroups.set(resourceId, emptySet);
            this.nodeBindings.set(node, emptySet);
        }
    }

    /**
     * Get all file records bound to a specific node.
     */
    getFilesForNode(node) {
        if (!node) return [];
        const bound = this.nodeBindings.get(node);
        return bound ? Array.from(bound) : [];
    }

    /**
     * Unbind all files from a node.
     */
    unbindNode(node) {
        this.nodeBindings.delete(node);
    }

    /**
     * Clear all registered files and bindings.
     */
    clear() {
        this.files.clear();
        this.resourceGroups.clear();
        this.nodeBindings.clear();
        console.log("FileResourceManager state cleared successfully.");
    }
}

export const fileResourceManager = new FileResourceManager();
