import { isElectron as checkElectron, isCordova as checkCordova } from '@/assets/gkd-js-0.2/env.js'

class PlatformService {
    isElectron() {
        return checkElectron();
    }

    isCordova() {
        return checkCordova() || (typeof window !== 'undefined' && !!window.cordova);
    }

    isNative() {
        return this.isElectron() || this.isCordova();
    }

    getFileSystemPath(file) {
        if (!file) return '';
        return file.path || '';
    }
}

export const platformService = new PlatformService();
