/**
 * GKD JS 核心工具库 v0.2
 * 统一主入口文件。
 */

import * as env from './env.js'
import * as utils from './utils.js'
import * as ajax from './ajax.js'
import * as fs from './fs.js'
import * as download from './download.js'

/**
 * 组装并重构 GKD 统一命名空间，以便向后兼容或提供统一导出引用
 */
const GKD = {
    // 环境 API
    ENVIRONMENT: env.ENVIRONMENT,
    isCordova: env.isCordova,
    isElectron: env.isElectron,
    getEnvironment: env.getEnvironment,

    // 文件系统 API
    fs: {
        ENVIRONMENT: env.ENVIRONMENT,
        isCordova: env.isCordova,
        getEnvironment: env.getEnvironment,
        exists: fs.exists,
        mkdirRecursive: fs.mkdirRecursive,
        saveFile: fs.saveFile,
        remove: fs.remove,
        readdir: fs.readdir,
        readdirAllFile: fs.readdirAllFile,
        copyFile: fs.copyFile,
        lstat: fs.lstat,
        base64ToArrayBuffer: utils.base64ToArrayBuffer,
        stringToArrayBuffer: utils.stringToArrayBuffer,
    },

    // 数组工具
    array: {
        deWeight: utils.deWeight,
    },

    // 时间与异步调度工具
    delay: utils.delay,
    time: {
        getCurrentDate: utils.getCurrentDate,
        countdown: utils.countdown,
    },
    debounce: utils.debounce,

    // 路径解析工具
    path: {
        parsePath: utils.parsePath,
    },

    // Base64 编解码辅助
    base64: utils.base64,

    // 异步任务限制并发工具
    mapLimit: utils.mapLimit,

    // 原生 AJAX 客户端
    ajax: {
        request: ajax.request,
        requestWithRetry: ajax.requestWithRetry,
    },

    // 下载队列及任务池调度
    download: {
        SingleTask: download.SingleTask,
        TaskPool: download.TaskPool,
        FILE_STATE: download.FILE_STATE,
        LruCache: download.LruCache,
    },
    downloadFile: download.downloadFile,
}

// 绑定全局 window 变量方便在非模块化环境或调试时直接访问
if (typeof window !== 'undefined') {
    window.GKD = window.GKD || GKD
}

// 导出各个命名子模块及 GKD 命名空间
export { env, utils, ajax, fs, download, GKD }

// 默认导出 GKD 命名空间对象
export default GKD
