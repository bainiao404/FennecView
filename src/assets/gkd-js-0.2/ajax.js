/**
 * GKD JS v0.2 原生 AJAX (XMLHttpRequest) 请求模块。
 */

/**
 * 解析原始的响应头字符串为键值对对象
 * @param {string} rawHeaders 原始响应头字符串
 * @returns {Record<string, string>} 键值对对象
 */
function parseHeaders(rawHeaders) {
    const headers = {}
    if (!rawHeaders) return headers
    const lines = rawHeaders.split('\r\n')
    for (const line of lines) {
        const index = line.indexOf(':')
        if (index > 0) {
            const key = line.slice(0, index).trim().toLowerCase()
            const value = line.slice(index + 1).trim()
            headers[key] = value
        }
    }
    return headers
}

/**
 * 使用原生 XMLHttpRequest 发送 AJAX 请求
 * @param {Object} options 配置参数
 * @param {string} options.url 目标请求的 URL
 * @param {string} [options.method='GET'] HTTP 请求方法 (GET, POST 等)
 * @param {Record<string, string>} [options.headers] 请求头键值对
 * @param {string} [options.responseType=''] 期望的响应类型 ('arraybuffer', 'json', 'text' 等)
 * @param {number} [options.timeout=0] 超时时间（毫秒，0 表示不设超时）
 * @param {function(ProgressEvent): void} [options.onDownloadProgress] 下载进度回调函数
 * @returns {Promise<{ data: any, headers: Record<string, string>, status: number, statusText: string, xhr: XMLHttpRequest }>} 包含响应数据及 XHR 实例的 Promise
 */
export function request(options = {}) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        const method = (options.method || 'GET').toUpperCase()
        const url = options.url

        if (!url) {
            return reject(new Error('URL is required for a request'))
        }

        xhr.open(method, url, true)

        // 设置响应类型
        if (options.responseType) {
            xhr.responseType = options.responseType
        }

        // 设置超时
        if (options.timeout) {
            xhr.timeout = options.timeout
        }

        // 设置请求头
        if (options.headers) {
            Object.entries(options.headers).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value)
            })
        }

        // 监听下载进度事件
        if (options.onDownloadProgress && xhr.onprogress !== undefined) {
            xhr.addEventListener('progress', options.onDownloadProgress)
        }

        // 监听请求加载完成事件
        xhr.addEventListener('load', () => {
            const headers = parseHeaders(xhr.getAllResponseHeaders())
            // 响应状态码为 2xx 或 304 时视为成功
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                resolve({
                    data: xhr.response,
                    headers,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    xhr,
                })
            } else {
                reject(new Error(`Request failed with status ${xhr.status}: ${xhr.statusText}`))
            }
        })

        // 监听网络错误事件
        xhr.addEventListener('error', () => {
            reject(new Error('Network connection error occurred'))
        })

        // 监听超时事件
        xhr.addEventListener('timeout', () => {
            reject(new Error('Request timed out'))
        })

        // 监听请求中止事件
        xhr.addEventListener('abort', () => {
            reject(new Error('Request was aborted'))
        })

        // 发送请求
        xhr.send(options.data || null)
    })
}

/**
 * 具有自动重试功能的 AJAX 请求封装
 * @param {Object} options 同 request 的配置参数
 * @param {number} [maxRetry=3] 最大重试次数，默认 3 次
 * @returns {Promise<{ data: any, headers: Record<string, string>, status: number, statusText: string, xhr: XMLHttpRequest }>}
 */
export async function requestWithRetry(options, maxRetry = 3) {
    let attempts = 0
    while (true) {
        try {
            return await request(options)
        } catch (error) {
            attempts++
            if (attempts >= maxRetry) {
                throw error
            }
            // 重试前延迟 500 毫秒
            await new Promise((r) => setTimeout(r, 500))
        }
    }
}
