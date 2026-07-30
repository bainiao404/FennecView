import { isElectron, isCordova } from '@/assets/gkd-js-0.2/env.js';
import { WebDriver } from './drivers/WebDriver.js';
import { ElectronDriver } from './drivers/ElectronDriver.js';
import { CordovaDriver } from './drivers/CordovaDriver.js';

class IOManager {
    constructor() {
        this.driver = null;
    }

    getDriver() {
        if (!this.driver) {
            if (isElectron()) {
                this.driver = new ElectronDriver();
            } else if (isCordova() || (typeof window !== 'undefined' && window.cordova)) {
                this.driver = new CordovaDriver();
            } else {
                this.driver = new WebDriver();
            }
        }
        return this.driver;
    }
}

export const ioManager = new IOManager();
