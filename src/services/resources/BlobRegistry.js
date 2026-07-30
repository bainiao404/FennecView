class BlobRegistry {
    constructor() {
        this.urls = new Set();
    }

    createURL(blob) {
        if (!blob) return '';
        const url = URL.createObjectURL(blob);
        this.urls.add(url);
        return url;
    }

    revokeURL(url) {
        if (this.urls.has(url)) {
            try {
                URL.revokeObjectURL(url);
            } catch (e) {
                console.error("Error revoking URL:", url, e);
            }
            this.urls.delete(url);
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
        console.log("BlobRegistry: All tracked Object URLs revoked successfully.");
    }
}

export const blobRegistry = new BlobRegistry();
