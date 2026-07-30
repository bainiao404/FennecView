export class IODriver {
    async read(path) {
        throw new Error("Method 'read' must be implemented");
    }
    async write(path, data) {
        throw new Error("Method 'write' must be implemented");
    }
    async pickFile(options = {}) {
        throw new Error("Method 'pickFile' must be implemented");
    }
    async pickDirectory(options = {}) {
        throw new Error("Method 'pickDirectory' must be implemented");
    }
    async pickSaveFile(options = {}) {
        throw new Error("Method 'pickSaveFile' must be implemented");
    }
}
