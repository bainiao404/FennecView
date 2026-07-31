import { ioManager } from '@/services/io/IOManager'
import { readBlobAsText, readBlobAsArrayBuffer } from '@/fennec-view/helpers'

export class BaseProcessor {
    /**
     * Find a file in the pool by filename (case-insensitive).
     */
    findFileByName(pool, filename) {
        if (!filename) return null;
        const lowerName = filename.toLowerCase();
        return pool.find(f => f.name.toLowerCase() === lowerName);
    }

    /**
     * Find files matching a regex in the pool.
     */
    findFilesByExtension(pool, ext) {
        const lowerExt = ext.toLowerCase();
        return pool.filter(f => f.name.toLowerCase().endsWith(lowerExt));
    }

    /**
     * Find a file matching relative path or basename.
     */
    findMatchingFile(pool, relPath) {
        if (!relPath) return null;
        const normPath = relPath.replace(/\\/g, '/').toLowerCase();
        const baseName = normPath.substring(normPath.lastIndexOf('/') + 1);
        
        // 1. Exact match filename
        let found = pool.find(f => f.name.toLowerCase() === baseName);
        if (found) return found;
        
        // 2. Relative path end match
        found = pool.find(f => {
            const fNorm = f.relativePath.replace(/\\/g, '/').toLowerCase();
            return fNorm.endsWith(normPath);
        });
        return found;
    }

    /**
     * Read file content as text.
     */
    async readFileAsText(fileItem) {
        if (fileItem.isNative) {
            const buffer = await ioManager.getDriver().read(fileItem.path);
            return new TextDecoder('utf-8').decode(new Uint8Array(buffer));
        } else {
            return await readBlobAsText(fileItem.file);
        }
    }

    /**
     * Read file content as ArrayBuffer.
     */
    async readFileAsArrayBuffer(fileItem) {
        if (fileItem.isNative) {
            return await ioManager.getDriver().read(fileItem.path);
        } else {
            return await readBlobAsArrayBuffer(fileItem.file);
        }
    }

    /**
     * Convert a FennecFile item into a Blob URL.
     */
    async getFileBlobUrl(fileItem) {
        if (!fileItem) return '';
        if (fileItem.isNative) {
            const buffer = await this.readFileAsArrayBuffer(fileItem);
            let mimeType = 'application/octet-stream';
            const name = fileItem.name.toLowerCase();
            if (name.endsWith('.png')) mimeType = 'image/png';
            else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) mimeType = 'image/jpeg';
            else if (name.endsWith('.webp')) mimeType = 'image/webp';
            else if (name.endsWith('.gif')) mimeType = 'image/gif';
            else if (name.endsWith('.json')) mimeType = 'application/json';
            else if (name.endsWith('.atlas')) mimeType = 'text/plain';
            const blob = new Blob([buffer], { type: mimeType });
            const { blobRegistry } = await import('@/services/resources/BlobRegistry');
            return blobRegistry.createURL(blob);
        } else {
            const { blobRegistry } = await import('@/services/resources/BlobRegistry');
            return blobRegistry.createURL(fileItem.file);
        }
    }
}
