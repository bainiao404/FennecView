import { MimeUtil } from '@/utils/MimeUtil'
import { fileResourceManager } from './FileResourceManager'

class BlobRegistry {
    constructor() {
        this.urls = new Set();
        this.formats = new Map();
    }

    createURL(blob, filename = null) {
        if (!blob) return '';
        const url = URL.createObjectURL(blob);
        this.urls.add(url);

        const format = MimeUtil.getFormat(blob.type, filename);
        if (format) {
            this.formats.set(url, format);
        }

        if (filename) {
            fileResourceManager.registerFile(filename, blob, { blobUrl: url });
        }

        return url;
    }

    getFormat(url) {
        return this.formats.get(url) || '';
    }

    revokeURL(url) {
        if (this.urls.has(url)) {
            try {
                URL.revokeObjectURL(url);
            } catch (e) {
                console.error("Error revoking URL:", url, e);
            }
            this.urls.delete(url);
            this.formats.delete(url);
        }
    }

    revokeAll() {
        this.urls.forEach(url => {
            try {
                URL.revokeObjectURL(url);
            } catch (e) {
                console.error("Failed to revoke URL during clear:", url, e);
            }
        });
        this.urls.clear();
        this.formats.clear();
        console.log("BlobRegistry: All tracked Object URLs revoked successfully.");
    }
}

export const blobRegistry = new BlobRegistry();
