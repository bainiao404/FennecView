import { IODriver } from './IODriver.js';
import GKD from '@/assets/gkd-js-0.2';

export class WebDriver extends IODriver {
    async read(path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to read file from web network: ${path}`);
        }
        return await response.arrayBuffer();
    }

    async write(path, data) {
        await GKD.fs.saveFile(path, data);
    }

    async pickFile(options = {}) {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = options.multiple !== undefined ? options.multiple : true;
            if (options.accept) {
                input.accept = options.accept;
            }
            input.onchange = () => {
                const files = Array.from(input.files);
                resolve(files);
            };
            input.oncancel = () => {
                resolve(null);
            };
            input.click();
        });
    }

    async pickDirectory(options = {}) {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.webkitdirectory = true;
            input.directory = true;
            input.onchange = () => {
                const files = Array.from(input.files);
                resolve(files);
            };
            input.oncancel = () => {
                resolve(null);
            };
            input.click();
        });
    }

    async pickSaveFile(options = {}) {
        return options.defaultPath || 'project.fv';
    }
}
