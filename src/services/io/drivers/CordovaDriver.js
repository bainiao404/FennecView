import { IODriver } from './IODriver.js';
import { useUIStore } from '@/stores/uiStore';
import GKD from '@/assets/gkd-js-0.2';

export class CordovaDriver extends IODriver {
    async read(path) {
        return new Promise((resolve, reject) => {
            window.resolveLocalFileSystemURL(
                path,
                (fileEntry) => {
                    fileEntry.file(
                        (file) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                resolve(reader.result);
                            };
                            reader.onerror = (err) => {
                                reject(err);
                            };
                            reader.readAsArrayBuffer(file);
                        },
                        (err) => reject(err)
                    );
                },
                (err) => reject(err)
            );
        });
    }

    async write(path, data) {
        await GKD.fs.saveFile(path, data);
    }

    async pickFile(options = {}) {
        return new Promise((resolve) => {
            const uiStore = useUIStore();
            uiStore.openCordovaFileView({
                title: options.title || '选择文件',
                multiple: options.multiple !== undefined ? options.multiple : true,
                onlyFolder: false,
                onSelect: (selected) => {
                    if (!selected) {
                        resolve(null);
                        return;
                    }
                    if (Array.isArray(selected)) {
                        resolve(selected.map(item => item.path));
                    } else {
                        resolve([selected.path]);
                    }
                }
            });
        });
    }

    async pickDirectory(options = {}) {
        return new Promise((resolve) => {
            const uiStore = useUIStore();
            uiStore.openCordovaFileView({
                title: options.title || '选择文件夹',
                multiple: false,
                onlyFolder: true,
                onSelect: (selected) => {
                    if (!selected) {
                        resolve(null);
                        return;
                    }
                    resolve(selected.path);
                }
            });
        });
    }

    async pickSaveFile(options = {}) {
        const destFolder = await this.pickDirectory({ title: options.title || '选择保存位置' });
        if (!destFolder) return null;
        let cordovaDest = destFolder;
        if (!cordovaDest.endsWith('/')) cordovaDest += '/';
        cordovaDest += options.defaultPath || 'project.fv';
        return cordovaDest;
    }
}
