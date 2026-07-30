/**
 * GKD JS v0.2 常用工具与辅助函数模块。
 */

/**
 * 标准化路径分隔符并解析提取文件目录路径和文件名。
 * @param {string} rawPath 原始文件路径
 * @returns {{ src: string, dirPath: string, fileName: string }} 标准化后的路径、目录路径与文件名
 */
export function parsePath(rawPath) {
    if (!rawPath) return { src: '', dirPath: '.', fileName: '' }
    
    let protocol = ''
    let pathPart = rawPath
    
    const protocolMatch = rawPath.match(/^([a-zA-Z0-9+-.]+:\/\/\/)/) || rawPath.match(/^([a-zA-Z0-9+-.]+:\/\/)/)
    if (protocolMatch) {
        protocol = protocolMatch[1]
        pathPart = rawPath.slice(protocol.length)
    }
    
    const srcPath = pathPart.replace(/[\\/]+/g, '/')
    const src = protocol + srcPath
    const lastSlashIndex = src.lastIndexOf('/')
    const dirPath = lastSlashIndex >= 0 ? src.slice(0, lastSlashIndex) : '.'
    const fileName = lastSlashIndex >= 0 ? src.slice(lastSlashIndex + 1) : src
    return { src, dirPath, fileName }
}

/**
 * Base64 编解码辅助对象（支持中文/Unicode 字符集）
 */
export const base64 = {
    /**
     * 将字符串编码为 Base64 格式
     * @param {string} str 待编码字符串
     * @returns {string} Base64 编码结果
     */
    encode(str) {
        const bytes = new TextEncoder().encode(str)
        const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
        return btoa(binary)
    },
    /**
     * 解码 Base64 字符串
     * @param {string} base64Str Base64 字符串
     * @returns {string} 解码后的文本
     */
    decode(base64Str) {
        const binary = atob(base64Str)
        const bytes = new Uint8Array(Array.from(binary, (char) => char.charCodeAt(0)))
        return new TextDecoder().decode(bytes)
    },
}

/**
 * 延迟执行（基于 Promise 的延时）
 * @param {number} ms 延迟的毫秒数，默认 33ms
 * @returns {Promise<void>}
 */
export function delay(ms = 33) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 获取格式化后的当前日期和时间
 * @param {string} format 期望的格式模板，例如 'YYYY-MM-DD HH:mm:ss'，默认 'YYYY-MM-DD'
 * @returns {string} 格式化后的时间字符串
 */
export function getCurrentDate(format = 'YYYY-MM-DD') {
    const now = new Date()
    const map = {
        YYYY: now.getFullYear(),
        MM: String(now.getMonth() + 1).padStart(2, '0'),
        DD: String(now.getDate()).padStart(2, '0'),
        HH: String(now.getHours()).padStart(2, '0'),
        mm: String(now.getMinutes()).padStart(2, '0'),
        ss: String(now.getSeconds()).padStart(2, '0'),
    }
    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (matched) => map[matched])
}

/**
 * 倒计时函数
 * @param {number} seconds 总倒计时秒数
 * @param {function(number): void} callback 每秒调用的回调函数，接收剩余秒数参数
 * @returns {{ stop: () => void }} 返回包含停止方法的对象
 */
export function countdown(seconds, callback) {
    if (typeof seconds !== 'number' || seconds < 0) {
        throw new Error('Seconds must be a non-negative number')
    }
    if (typeof callback !== 'function') {
        throw new Error('Callback must be a function')
    }

    let remaining = Math.floor(seconds)
    let timer = null

    callback(remaining)

    const stop = () => {
        if (timer) {
            clearInterval(timer)
            timer = null
        }
    }

    if (remaining > 0) {
        timer = setInterval(() => {
            remaining--
            callback(remaining)
            if (remaining <= 0) {
                stop()
            }
        }, 1000)
    }

    return { stop }
}

/**
 * 函数防抖封装
 * @param {Function} func 目标执行函数
 * @param {number} wait 防抖等待的毫秒数
 * @returns {Function} 具备防抖功能的新函数
 */
export function debounce(func, wait) {
    let timeoutId
    return function (...args) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
            func.apply(this, args)
        }, wait)
    }
}

/**
 * 数组去重函数（支持自定义比较逻辑）
 * @template T
 * @param {T[]} array 待去重数组
 * @param {function(T, T): boolean} comparator 判定两项是否相等的比较函数
 * @returns {T[]} 去重后的新数组
 */
export function deWeight(array, comparator) {
    if (!Array.isArray(array)) return []
    const result = []
    for (const item of array) {
        const isDuplicate = result.some((existing) => comparator(existing, item))
        if (!isDuplicate) {
            result.push(item)
        }
    }
    return result
}

/**
 * 限制并发的异步 Map 执行函数
 * @template T, R
 * @param {T[]} list 输入的任务数据列表
 * @param {number} limit 最大并发限制数
 * @param {function(T, number): Promise<R>} taskFn 单个异步任务执行函数
 * @returns {Promise<R[]>} 并发执行完成后的结果集合 Promise
 */
export async function mapLimit(list, limit, taskFn) {
    const results = []
    const executing = new Set()
    for (let i = 0; i < list.length; i++) {
        const p = Promise.resolve().then(() => taskFn(list[i], i))
        results.push(p)
        executing.add(p)
        const clean = () => executing.delete(p)
        p.then(clean, clean)
        if (executing.size >= limit) {
            await Promise.race(executing)
        }
    }
    return Promise.all(results)
}

/**
 * Base64 编码的字符串转 ArrayBuffer
 * @param {string} base64Str 待转换的 base64 字符串
 * @returns {ArrayBuffer} 转换后的二进制 buffer
 */
export function base64ToArrayBuffer(base64Str) {
    const cleanBase64 = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str
    const binary = atob(cleanBase64)
    const len = binary.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
}

/**
 * 字符串转 ArrayBuffer 二进制流
 * @param {string} str 待编码字符串
 * @returns {ArrayBuffer} 转换后的二进制 buffer
 */
export function stringToArrayBuffer(str) {
    return new TextEncoder().encode(str).buffer
}
