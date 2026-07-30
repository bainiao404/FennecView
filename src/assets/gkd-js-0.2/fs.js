/**
 * GKD JS v0.2 统一文件系统操作模块。
 * 支持 Node.js / Electron 环境以及 Cordova 移动端环境。
 */

import { isCordova, isElectron } from './env.js'
import { stringToArrayBuffer, parsePath } from './utils.js'

let nodeFs = null

if (isElectron()) {
    try {
        if (typeof window !== 'undefined' && window.require) {
            nodeFs = window.require('fs')
        } else if (typeof require !== 'undefined') {
            nodeFs = require('fs')
        }
    } catch (e) {
        console.error('GKD-FS: Node.js fs 模块不可用。', e)
    }
}

/**
 * 检查文件或目录是否存在。
 * @param {string} src 要检查的路径
 * @returns {Promise<{ state: boolean, dirEntry?: DirectoryEntry }>} 存在状态及 Cordova 目录 Entry (如果是目录)
 */
export function exists(src) {
    return new Promise((resolve) => {
        if (isCordova()) {
            window.resolveLocalFileSystemURL(
                src,
                (entry) => {
                    if (entry.isDirectory) {
                        resolve({ state: true, dirEntry: entry })
                    } else {
                        resolve({ state: true })
                    }
                },
                () => {
                    resolve({ state: false })
                },
            )
        } else if (nodeFs) {
            nodeFs.access(src, nodeFs.constants.F_OK, (err) => {
                resolve({ state: !err })
            })
        } else {
            resolve({ state: false })
        }
    })
}

/**
 * 递归创建目录。
 * @param {string} inputFilePath 文件路径或目录路径
 * @returns {Promise<{ path: string, dirEntry?: DirectoryEntry }>} 创建成功的目录路径及 Cordova 目录 Entry (仅安卓端)
 */
export function mkdirRecursive(inputFilePath) {
    const { dirPath } = parsePath(inputFilePath)

    if (isCordova()) {
        return new Promise(async (resolve, reject) => {
            try {
                const check = await exists(dirPath)
                if (check.state) {
                    return resolve({ path: dirPath, dirEntry: check.dirEntry })
                }

                const root = cordova.file.externalRootDirectory
                const relative = dirPath.replace(root, '')
                const folders = relative.split('/').filter(Boolean)

                window.resolveLocalFileSystemURL(
                    root,
                    (rootDir) => {
                        (async () => {
                            try {
                                let currentDir = rootDir
                                for (const folder of folders) {
                                    currentDir = await new Promise((res, rej) => {
                                        currentDir.getDirectory(folder, { create: true, exclusive: false }, res, rej)
                                    })
                                }
                                resolve({ path: dirPath, dirEntry: currentDir })
                            } catch (e) {
                                reject(e)
                            }
                        })()
                    },
                    reject,
                )
            } catch (err) {
                reject(err)
            }
        })
    } else if (nodeFs) {
        return new Promise((resolve, reject) => {
            nodeFs.mkdir(dirPath, { recursive: true }, (err) => {
                if (err) reject(err)
                else resolve({ path: dirPath })
            })
        })
    } else {
        return Promise.resolve({ path: dirPath })
    }
}

/**
 * 保存数据到文件。支持自动递归创建目录。
 * 在 Cordova 环境下，如果数据大于 10MB，会自动切片分块 incremental 写入，以防止 WebView 内存奔溃。
 * @param {string} src 文件的完整路径
 * @param {string|ArrayBuffer|Uint8Array} data 要写入的文件内容
 * @returns {Promise<void>}
 */
export function saveFile(src, data) {
    const { fileName } = parsePath(src)

    let u8
    if (typeof data === 'string') {
        u8 = new Uint8Array(stringToArrayBuffer(data))
    } else if (data instanceof ArrayBuffer) {
        u8 = new Uint8Array(data)
    } else if (data instanceof Uint8Array) {
        u8 = data
    } else {
        return Promise.reject(new Error('Unsupported data type for saveFile'))
    }

    return mkdirRecursive(src).then((pathData) => {
        if (!isCordova()) {
            if (nodeFs) {
                return new Promise((resolve, reject) => {
                    nodeFs.writeFile(src, u8, (err) => (err ? reject(err) : resolve()))
                })
            }
            try {
                const blob = new Blob([u8])
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = fileName
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                return Promise.resolve()
            } catch (err) {
                return Promise.reject(err)
            }
        }

        // Cordova 分片写入逻辑
        const MAX_WHOLE = 10 * 1024 * 1024 // 超过 10 MB 走分片
        const CHUNK_SIZE = 512 * 1024 // 每片大小 512 KB

        return new Promise((resolve, reject) => {
            pathData.dirEntry.getFile(
                fileName,
                { create: true, exclusive: false },
                (fileEntry) => {
                    fileEntry.createWriter((fileWriter) => {
                        let offset = 0

                        fileWriter.onwriteend = () => {
                            if (offset >= u8.byteLength) {
                                resolve() // 全部写完
                            } else {
                                if (document.visibilityState === 'visible') {
                                    requestAnimationFrame(() => {
                                        setTimeout(writeNext, 1)
                                    })
                                } else {
                                    writeNext()
                                }
                            }
                        }
                        fileWriter.onerror = reject

                        function writeNext() {
                            const end = Math.min(offset + CHUNK_SIZE, u8.byteLength)
                            const slice = u8.slice(offset, end)
                            fileWriter.write(new Blob([slice]))
                            offset = end
                        }

                        if (u8.byteLength <= MAX_WHOLE) {
                            offset = u8.byteLength
                            fileWriter.write(new Blob([u8]))
                        } else {
                            writeNext()
                        }
                    })
                },
                reject,
            )
        })
    })
}

/**
 * 递归删除文件或目录。
 * @param {string} src 要删除的文件或目录路径
 * @returns {Promise<void>}
 */
export function remove(src) {
    return new Promise((resolve, reject) => {
        if (isCordova()) {
            window.resolveLocalFileSystemURL(
                src,
                (entry) => {
                    if (entry.isDirectory) {
                        entry.removeRecursively(resolve, reject)
                    } else {
                        entry.remove(resolve, reject)
                    }
                },
                (err) => {
                    // 如果目录或文件已经不存在，则忽略该错误
                    if (err.code === 1 || err.code === 8) resolve()
                    else reject(err)
                },
            )
        } else if (nodeFs) {
            nodeFs.rm(src, { recursive: true, force: true }, (err) => {
                if (err) reject(err)
                else resolve()
            })
        } else {
            resolve()
        }
    })
}

/**
 * 读取目录下所有一级子文件和子目录的名称。
 * @param {string} src 目录路径
 * @returns {Promise<string[]>} 文件/目录名列表
 */
export function readdir(src) {
    return new Promise((resolve, reject) => {
        if (isCordova()) {
            window.resolveLocalFileSystemURL(
                src,
                (dirEntry) => {
                    if (!dirEntry.isDirectory) {
                        return reject(new Error('Path is not a directory'))
                    }
                    dirEntry.createReader().readEntries(
                        (entries) => {
                            const list = entries.map((entry) => entry.name)
                            list.sort()
                            resolve(list)
                        },
                        () => resolve([]),
                    )
                },
                () => resolve([]),
            )
        } else if (nodeFs) {
            nodeFs.readdir(src, (err, files) => {
                if (err) resolve([])
                else resolve(files)
            })
        } else {
            resolve([])
        }
    })
}

/**
 * 递归读取目录下所有的文件路径（深度遍历）。
 * @param {string} dirPath 目录路径
 * @param {function(string, string[]): void} [onDirectoryVisited] 可选参数，在访问某个子目录时触发的回调函数
 * @returns {Promise<string[]>} 所有文件的绝对路径/URL 数组
 */
export function readdirAllFile(dirPath, onDirectoryVisited) {
    if (isCordova()) {
        return new Promise((resolve, reject) => {
            const allFiles = []

            function readDirectory(directoryEntry, callback) {
                const reader = directoryEntry.createReader()
                reader.readEntries((entries) => {
                    let remaining = entries.length
                    if (remaining === 0) {
                        callback()
                        return
                    }

                    entries.forEach((entry) => {
                        if (entry.isDirectory) {
                            if (onDirectoryVisited) {
                                onDirectoryVisited(entry.fullPath, allFiles)
                            }
                            readDirectory(entry, () => {
                                remaining--
                                if (remaining === 0) callback()
                            })
                        } else {
                            allFiles.push(decodeURI(entry.nativeURL))
                            remaining--
                            if (remaining === 0) callback()
                        }
                    })
                }, reject)
            }

            window.resolveLocalFileSystemURL(
                dirPath,
                (directoryEntry) => {
                    readDirectory(directoryEntry, () => {
                        resolve(allFiles)
                    })
                },
                reject,
            )
        })
    } else if (nodeFs) {
        const path = window.require ? window.require('path') : require('path')
        const results = []

        async function getAllFiles(currentPath) {
            if (onDirectoryVisited) {
                onDirectoryVisited(currentPath, results)
            }

            const entries = await new Promise((res, rej) => {
                nodeFs.readdir(currentPath, { withFileTypes: true }, (err, list) => {
                    if (err) rej(err)
                    else res(list)
                })
            })

            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name)
                if (entry.isDirectory()) {
                    await getAllFiles(fullPath)
                } else {
                    results.push(fullPath)
                }
            }
        }

        return getAllFiles(dirPath)
            .then(() => results)
            .catch(() => [])
    } else {
        return Promise.resolve([])
    }
}

/**
 * 拷贝文件到目标路径。
 * @param {string} src 源文件路径
 * @param {string} dest 目标文件路径
 * @returns {Promise<string>} 拷贝成功的状态说明
 */
export function copyFile(src, dest) {
    return mkdirRecursive(dest).then((pathData) => {
        if (isCordova()) {
            return new Promise((resolve, reject) => {
                window.resolveLocalFileSystemURL(
                    src,
                    (fileEntry) => {
                        const { fileName } = parsePath(dest)
                        fileEntry.copyTo(
                            pathData.dirEntry,
                            fileName,
                            (newFileEntry) => {
                                resolve(`File copied to: ${newFileEntry.nativeURL}`)
                            },
                            (error) => {
                                reject(new Error(`Copy failed: ${error.code}`))
                            },
                        )
                    },
                    (error) => {
                        reject(new Error(`Source file not accessible: ${error.code}`))
                    },
                )
            })
        } else if (nodeFs) {
            return new Promise((resolve, reject) => {
                nodeFs.copyFile(src, dest, (err) => {
                    if (err) reject(new Error(`Copy failed: ${err.message}`))
                    else resolve(`File copied to: ${dest}`)
                })
            })
        } else {
            return Promise.reject(new Error('Unsupported platform for fs.copyFile'))
        }
    })
}

/**
 * 获取文件或目录的状态属性 (仅 Node.js / Electron)
 * @param {string} src 要获取状态的路径
 * @returns {Promise<any>} Node.js stats 对象
 */
export function lstat(src) {
    if (nodeFs) {
        return new Promise((resolve, reject) => {
            nodeFs.lstat(src, (err, stats) => {
                if (err) reject(err)
                else resolve(stats)
            })
        })
    }
    return Promise.reject(new Error('lstat is only supported in Node.js/Electron environment'))
}
