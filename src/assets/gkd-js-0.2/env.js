/**
 * GKD JS v0.2 环境检测及常量模块。
 */

/**
 * 环境常量定义
 * @type {Readonly<{ELECTRON: number, CORDOVA: number, WEB: number}>}
 */
export const ENVIRONMENT = Object.freeze({
    ELECTRON: 0,
    CORDOVA: 1,
    WEB: 2,
})

/**
 * 检测当前运行环境是否为 Cordova (移动端)
 * @returns {boolean} 如果是 Cordova 环境返回 true，否则返回 false
 */
export function isCordova() {
    return typeof window !== 'undefined' && !!window.cordova
}

/**
 * 检测当前运行环境是否为 Electron (桌面端渲染进程或主进程)
 * @returns {boolean} 如果是 Electron 环境返回 true，否则返回 false
 */
export function isElectron() {
    if (typeof window !== 'undefined') {
        if (window.process && window.process.type === 'renderer') {
            return true
        }
        if (window.require && (window.process || navigator.userAgent.toLowerCase().includes('electron'))) {
            return true
        }
    }
    if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
        return true
    }
    return false
}

/**
 * 获取当前运行环境的类型代码
 * @returns {number} 返回 ENVIRONMENT 常量之一 (0: ELECTRON, 1: CORDOVA, 2: WEB)
 */
export function getEnvironment() {
    if (isCordova()) {
        return ENVIRONMENT.CORDOVA
    } else if (isElectron()) {
        return ENVIRONMENT.ELECTRON
    } else {
        return ENVIRONMENT.WEB
    }
}
