/**
 * Utility for handling file extensions, MIME types, and formats
 */

// Suffix to MIME type map
const EXT_TO_MIME = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'json': 'application/json',
    'spine-json': 'application/json',
    'atlas': 'text/plain',
    'css': 'text/css',
    'js': 'application/javascript',
    'mjs': 'application/javascript',
    'skel': 'application/octet-stream',
    'moc3': 'application/octet-stream',
    'moc': 'application/octet-stream',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg'
};

// MIME to format map
const MIME_TO_FORMAT = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'application/json': 'json',
    'text/json': 'json',
    'text/plain': 'txt',
    'text/css': 'css',
    'application/javascript': 'js'
};

export const MimeUtil = {
    /**
     * Get MIME type from filename or extension.
     */
    getMimeType: function (filename) {
        if (!filename) return 'application/octet-stream';
        const ext = filename.split('.').pop().toLowerCase();
        return EXT_TO_MIME[ext] || 'application/octet-stream';
    },

    /**
     * Get format from MIME type or file extension fallback.
     */
    getFormat: function (mimeType, filename) {
        if (mimeType) {
            for (const key of Object.keys(MIME_TO_FORMAT)) {
                if (mimeType.includes(key)) {
                    return MIME_TO_FORMAT[key];
                }
            }
        }
        if (filename) {
            const ext = filename.split('.').pop().toLowerCase();
            if (ext === 'atlas') return 'txt';
            return ext;
        }
        return '';
    },

    /**
     * Get PixiJS loader name for a format
     */
    getPixiLoader: function (format) {
        if (!format) return '';
        const lower = format.toLowerCase();
        if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(lower)) {
            return 'loadTextures';
        }
        if (lower === 'json') {
            return 'loadJson';
        }
        if (['txt', 'atlas'].includes(lower)) {
            return 'loadTxt';
        }
        return '';
    },

    /**
     * Checks if a filename is an image.
     */
    isImage: function (filename) {
        if (!filename) return false;
        return /\.(png|jpg|jpeg|webp|gif|webg|svg)$/i.test(filename);
    },

    /**
     * Checks if a filename is a potential Spine or Live2D core model file.
     */
    isSpineOrLive2dCore: function (filename) {
        if (!filename) return false;
        return /\.(skel|atlas|model3\.json|model\.json|moc3|moc)$/i.test(filename);
    },

    /**
     * Checks if a filename is an entry candidate for complex models (Json/Skel).
     */
    isEntryCandidate: function (filename) {
        if (!filename) return false;
        const lower = filename.toLowerCase();
        return lower.endsWith('.json') || lower.endsWith('.skel') || lower.endsWith('.spine-json');
    }
};
