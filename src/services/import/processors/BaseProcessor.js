import { ioManager } from '@/services/io/IOManager'
import { readBlobAsText, readBlobAsArrayBuffer } from '@/utils/helpers';
import { MimeUtil } from '@/utils/MimeUtil';

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
        if (fileItem && typeof fileItem.readAsText === 'function') {
            return await fileItem.readAsText();
        }
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
        if (fileItem && typeof fileItem.readAsArrayBuffer === 'function') {
            return await fileItem.readAsArrayBuffer();
        }
        if (fileItem.isNative) {
            return await ioManager.getDriver().read(fileItem.path);
        } else {
            return await readBlobAsArrayBuffer(fileItem.file);
        }
    }

}
