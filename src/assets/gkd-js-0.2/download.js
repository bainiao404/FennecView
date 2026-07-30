/**
 * GKD JS v0.2 文件下载管理模块。
 * 处理文件并发下载、重试逻辑、下载任务队列调度以及本地缓存文件校验。
 */

import { request } from './ajax.js'
import * as fs from './fs.js'

/**
 * 文件下载状态常量
 * @type {Readonly<{
 *   PREPARE: number,      // 准备下载
 *   VERIFY_LOCAL: number, // 本地校验中
 *   DOWNLOADING: number,  // 正在下载
 *   DOWNLOADED: number,   // 下载完成 (存入内存)
 *   SAVED: number,        // 已保存到本地文件
 *   LOCAL_EXIST: number,  // 本地文件已存在 (跳过)
 *   NET_ONLY: number,     // 仅网络文件 (不保存本地)
 *   FAIL_SAVE: number,    // 文件保存落盘失败
 *   FAIL_NET: number      // 网络请求下载失败
 * }>}
 */
export const FILE_STATE = Object.freeze({
    PREPARE: 0,
    VERIFY_LOCAL: 1,
    DOWNLOADING: 2,
    DOWNLOADED: 3,
    SAVED: 4,
    LOCAL_EXIST: 5,
    NET_ONLY: 6,
    FAIL_SAVE: -2,
    FAIL_NET: -1,
})

/**
 * 下载状态对应的展示文本
 * @type {string[]}
 */
export const STATE_TEXT = [
    '准备下载',
    '本地校验',
    '正在下载',
    '下载完成',
    '保存完成',
    '本地文件',
    '网络文件',
    '保存失败',
    '下载失败',
]

const randId = () => Math.random().toString(36).slice(2, 11)
const hash = (str) => (window.MD5 ? window.MD5(str) : randId())
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 基于 Map 实现的简单 LRU (最近最少使用) 缓存机制。
 */
export class LruCache {
    /**
     * @param {number} max 最大缓存容量，默认 15000
     */
    constructor(max = 15000) {
        this.map = new Map()
        this.max = max
    }

    /**
     * 获取缓存项，并更新其优先级位置为最近使用
     * @param {string} key 缓存键名
     * @returns {*} 缓存项的值，如果不存在则返回 undefined
     */
    get(key) {
        if (this.map.has(key)) {
            const value = this.map.get(key)
            this.map.delete(key)
            this.map.set(key, value)
            return value
        }
        return undefined
    }

    /**
     * 设置或更新缓存项，若超出容量限制则淘汰最旧的项
     * @param {string} key 缓存键名
     * @param {*} [value=true] 缓存项的值
     */
    set(key, value = true) {
        if (this.map.size >= this.max) {
            const firstKey = this.map.keys().next().value
            if (firstKey !== undefined) {
                this.map.delete(firstKey)
            }
        }
        this.map.set(key, value)
    }

    /**
     * 导出当前所有缓存项为普通对象
     * @returns {Record<string, *>} 键值对对象
     */
    dump() {
        return Object.fromEntries(this.map)
    }

    /**
     * 从对象数据中恢复加载缓存
     * @param {Record<string, *>} obj 缓存数据源对象
     */
    load(obj) {
        this.map = new Map(Object.entries(obj))
    }
}

/**
 * 单批次多文件下载任务类
 */
export class SingleTask {
    /**
     * @param {Array<{url: string, file?: string, responseType?: string}>} urlList 待下载的 URL 任务列表
     * @param {Object} [options] 配置选项
     * @param {function(Object): void} [options.progress] 下载进度通知回调函数
     * @param {Object} [options.config] 任务个性化配置
     */
    constructor(urlList, { progress, config } = {}) {
        this.cfg = {
            maxParallelDown: 6, // 最大并发下载数
            maxParallelCheck: 30, // 最大并发本地文件检测数
            maxRetry: 3, // 最大重试次数
            upTime: 500, // 状态轮询/心跳时间周期 (ms)
            useCache: true, // 是否启用本地缓存跳过
            memoryMax: 15000, // LRU 缓存上限
            ...config,
        }
        this.callback = progress || (() => {})
        this.fileQueue = urlList.map((u) => ({
            ...u,
            url: u.url || u.http,
            http: u.http || u.url,
            id: randId(),
            name: u.file?.split('/').pop() || '',
            state: FILE_STATE.PREPARE,
            retry: 0,
            progress: null,
            data: null,
        }))
        this.cache = new LruCache(this.cfg.memoryMax)
        this._running = true
        this._done = false
        this._resolve = null
    }

    /**
     * 启动当前下载任务组
     * @returns {Promise<{ state: number, list: Array }>}
     */
    start() {
        return new Promise(async (resolve) => {
            this._resolve = resolve
            if (this.cfg.useCache) {
                this._loadCache()
            }
            await this._checkLocal()
            this._loop()
        })
    }

    /**
     * 暂停执行任务
     */
    pause() {
        this._running = false
    }

    /**
     * 恢复执行任务
     */
    resume() {
        if (!this._running) {
            this._running = true
            this._loop()
        }
    }

    // 内部轮询分发循环
    async _loop() {
        while (true) {
            if (!this._running || this._done) return
            this._dispatch()
            await sleep(this.cfg.upTime)
            this._notify()
        }
    }

    // 批量并发检测本地文件是否已存在
    async _checkLocal() {
        const needCheck = this.fileQueue.filter((f) => f.state === FILE_STATE.PREPARE && f.file)
        const batches = Array.from({ length: Math.ceil(needCheck.length / this.cfg.maxParallelCheck) }, (_, i) =>
            needCheck.slice(i * this.cfg.maxParallelCheck, (i + 1) * this.cfg.maxParallelCheck),
        )

        for (const batch of batches) {
            await Promise.allSettled(
                batch.map((f) =>
                    this._exist(f).then((exists) => {
                        if (exists) {
                            f.state = FILE_STATE.LOCAL_EXIST
                        }
                    }),
                ),
            )
        }
    }

    async _exist(f) {
        try {
            const check = await fs.exists(f.file)
            return check.state === true
        } catch {
            return false
        }
    }

    // 分发/控制当前并发下载池
    _dispatch() {
        const downloading = this.fileQueue.filter((f) => f.state === FILE_STATE.DOWNLOADING).length
        const slot = this.cfg.maxParallelDown - downloading
        if (slot <= 0) return

        const waiters = this.fileQueue.filter((f) => f.state === FILE_STATE.PREPARE || f.state === FILE_STATE.FAIL_NET)

        waiters.slice(0, slot).forEach((f) => this._download(f))
    }

    // 执行单个文件网络下载
    async _download(f) {
        if (f.state === FILE_STATE.FAIL_NET && f.retry >= this.cfg.maxRetry) {
            return
        }

        f.state = FILE_STATE.DOWNLOADING
        try {
            const response = await request({
                url: f.url,
                responseType: f.responseType || 'arraybuffer',
                headers: { 'Cache-Control': 'no-cache' },
                onDownloadProgress: (progressEvent) => {
                    f.progress = progressEvent
                },
            })

            f.data = response.data
            f.state = FILE_STATE.DOWNLOADED

            if (f.file) {
                await this._save(f)
            } else {
                f.state = FILE_STATE.NET_ONLY
            }
        } catch (e) {
            f.retry++
            f.state = f.retry >= this.cfg.maxRetry ? FILE_STATE.FAIL_NET : FILE_STATE.PREPARE
        }
    }

    // 将已下载的数据保存落盘
    async _save(f) {
        try {
            await fs.saveFile(f.file, f.data)
            f.state = FILE_STATE.SAVED
        } catch (e) {
            f.state = FILE_STATE.FAIL_SAVE
        }
    }

    // 通知回调进度，并当全部完成后标记结束
    _notify() {
        const done = this.fileQueue.every((f) => f.state > FILE_STATE.DOWNLOADED || f.state < 0)
        if (done && !this._done) {
            this._done = true
            this._dumpCache()
            const ok = !this.fileQueue.some((f) => f.state < 0)
            if (this._resolve) {
                this._resolve({ state: ok ? 1 : -1, list: this.fileQueue })
            }
        }

        const taskState = this._done ? (this.fileQueue.some((f) => f.state < 0) ? -1 : 1) : 0

        this.callback({
            list: this.fileQueue,
            state: taskState,
        })
    }

    // 从 LocalStorage 加载下载缓存
    _loadCache() {
        try {
            const dump = JSON.parse(localStorage.getItem('gkDownload') || '{}')
            this.cache.load(dump)
            this.fileQueue.forEach((f) => {
                if (this.cache.get(hash(f.url))) {
                    f.state = FILE_STATE.LOCAL_EXIST
                }
            })
        } catch (e) {
            // 加载缓存失败，忽略
        }
    }

    // 保存下载缓存到 LocalStorage
    _dumpCache() {
        this.fileQueue
            .filter((f) => f.state === FILE_STATE.SAVED || f.state === FILE_STATE.LOCAL_EXIST)
            .forEach((f) => this.cache.set(hash(f.url)))
        localStorage.setItem('gkDownload', JSON.stringify(this.cache.dump()))
    }
}

/**
 * 任务池管理类，支持添加多个下载任务队列依次排队执行
 */
export class TaskPool {
    constructor(config = {}) {
        this.cfg = config
        this.list = []
        this._busy = false
    }

    /**
     * 向任务池中添加一个下载任务队列
     * @param {Array} urlList 待下载的 URL 任务列表
     * @param {function(Object): void} progress 下载进度通知回调函数
     * @returns {Promise<{state: number, list: Array}>} 队列执行完毕的 Promise
     */
    add(urlList, progress) {
        const task = new SingleTask(urlList, { progress, config: this.cfg })
        const item = { task, state: 0, promise: null, resolve: null }
        this.list.push(item)
        item.promise = new Promise((r) => {
            item.resolve = r
        })
        this._run()
        return item.promise
    }

    /**
     * 暂停当前正在执行的队列任务
     */
    pause() {
        this._busy = true
        const cur = this.list.find((t) => t.state === 1)
        if (cur) cur.task.pause()
    }

    /**
     * 恢复执行队列任务
     */
    resume() {
        this._busy = false
        const cur = this.list.find((t) => t.state === 1)
        if (cur) {
            cur.task.resume()
        } else {
            this._run()
        }
    }

    // 并发调度器运行核心
    async _run() {
        if (this._busy) return
        const next = this.list.find((t) => t.state === 0)
        if (!next) return

        next.state = 1
        const result = await next.task.start()
        next.resolve(result)

        const index = this.list.indexOf(next)
        if (index > -1) {
            this.list.splice(index, 1)
        }
        this._run()
    }
}

// 创建全局默认任务池单例
const defaultPool = new TaskPool({
    maxParallelDown: 6,
    maxParallelCheck: 30,
    maxRetry: 3,
    upTime: 500,
    memoryMax: 15000,
    useCache: true,
})

/**
 * 暴露的默认兼容对象，提供下载任务的各种便捷操作
 */
export const downloadFile = {
    FILE_STATES: STATE_TEXT,
    addTask: (list, cb) => defaultPool.add(list, cb),
    addTasks: () => defaultPool,
    pauseTask: () => defaultPool.pause(),
    resumeTask: () => defaultPool.resume(),
    delMemory: () => localStorage.removeItem('gkDownload'),
    generateRandomId: randId,
    /* 透传配置 */
    maxProcess: 6,
    maxRepeat: 3,
    upTime: 500,
    memory: true,
    memoryMax: 15000,
    maxParallelFileChecks: 30,
}
