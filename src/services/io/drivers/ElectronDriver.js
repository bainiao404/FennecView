import { IODriver } from './IODriver.js';

export class ElectronDriver extends IODriver {
    getFs() {
        if (typeof window !== 'undefined' && window.require) {
            return window.require('fs');
        }
        return require('fs');
    }

    getRemote() {
        if (typeof window !== 'undefined' && window.require) {
            return window.require('@electron/remote');
        }
        return require('@electron/remote');
    }

    async read(path) {
        return new Promise((resolve, reject) => {
            this.getFs().readFile(path, (err, data) => {
                if (err) reject(err);
                else resolve(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
            });
        });
    }

    async write(path, data) {
        const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
        return new Promise((resolve, reject) => {
            this.getFs().writeFile(path, u8, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async pickFile(options = {}) {
        const { dialog } = this.getRemote();
        const result = await dialog.showOpenDialog({
            title: options.title || 'Select File',
            filters: options.filters || [],
            properties: ['openFile']
        });
        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }
        return result.filePaths;
    }

    async pickDirectory(options = {}) {
        const { dialog } = this.getRemote();
        const result = await dialog.showOpenDialog({
            title: options.title || 'Select Directory',
            properties: ['openDirectory']
        });
        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }
        return result.filePaths[0];
    }

    async pickSaveFile(options = {}) {
        const { dialog } = this.getRemote();
        const result = await dialog.showSaveDialog({
            title: options.title || 'Save File',
            defaultPath: options.defaultPath || 'project.fv',
            filters: options.filters || []
        });
        if (result.canceled || !result.filePath) {
            return null;
        }
        return result.filePath;
    }
}
