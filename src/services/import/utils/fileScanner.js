import { isElectron } from '@/assets/gkd-js-0.2/env.js'
import { readdirAllFile } from '@/assets/gkd-js-0.2/fs.js'

/**
 * Normalizes backslashes to forward slashes.
 */
function normalizePath(p) {
    if (typeof p !== 'string') return ''
    return p.replace(/\\/g, '/')
}

/**
 * Scans directories recursively using DirectoryEntry API (HTML5 Drag & Drop).
 */
async function scanDirectoryEntry(dirEntry, baseRelativePath = '') {
    const files = []
    
    const readEntries = (reader) => {
        return new Promise((resolve, reject) => {
            reader.readEntries(resolve, reject)
        })
    }
    
    const traverse = async (entry, currentRelPath) => {
        if (entry.isFile) {
            const file = await new Promise((resolve, reject) => {
                entry.file(resolve, reject)
            })
            // Attach a custom relative path
            const rel = currentRelPath ? `${currentRelPath}/${entry.name}` : entry.name
            files.push({
                name: entry.name,
                size: file.size,
                path: '',
                relativePath: rel,
                file: file,
                isNative: false
            })
        } else if (entry.isDirectory) {
            const reader = entry.createReader()
            let entries = []
            let readBatch
            // readEntries needs to be called repeatedly until it returns an empty array
            do {
                readBatch = await readEntries(reader)
                entries = entries.concat(readBatch)
            } while (readBatch.length > 0)
            
            const nextRelPath = currentRelPath ? `${currentRelPath}/${entry.name}` : entry.name
            for (const subEntry of entries) {
                await traverse(subEntry, nextRelPath)
            }
        }
    }
    
    await traverse(dirEntry, baseRelativePath)
    return files
}

export const FileScanner = {
    /**
     * Scan files from Drag and Drop event.
     * Handles HTML5 files, folders (via webkitGetAsEntry), and Electron native paths.
     */
    scanDrop: async function (dataTransfer) {
        const files = []
        if (!dataTransfer) return files
        
        // 1. Electron or native paths check
        if (isElectron() && dataTransfer.files && dataTransfer.files.length > 0) {
            const fs = window.require ? window.require('fs') : require('fs')
            for (let i = 0; i < dataTransfer.files.length; i++) {
                const f = dataTransfer.files[i]
                if (!f.path) continue
                const path = normalizePath(f.path)
                try {
                    const stats = fs.statSync(path)
                    if (stats.isDirectory()) {
                        const recursiveFiles = await this.scanLocalDirectory(path)
                        files.push(...recursiveFiles)
                    } else {
                        files.push({
                            name: f.name,
                            size: stats.size,
                            path: path,
                            relativePath: f.name,
                            file: f,
                            isNative: true
                        })
                    }
                } catch (e) {
                    console.error('Error scanning dropped path in Electron:', path, e)
                }
            }
            if (files.length > 0) return files
        }
        
        // 2. Web Drag & Drop folders using DataTransferItemList
        if (dataTransfer.items && dataTransfer.items.length > 0) {
            for (let i = 0; i < dataTransfer.items.length; i++) {
                const item = dataTransfer.items[i]
                if (item.kind !== 'file') continue
                
                const entry = typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null
                if (entry) {
                    const scanned = await scanDirectoryEntry(entry)
                    files.push(...scanned)
                } else if (item.getAsFile) {
                    const f = item.getAsFile()
                    if (f) {
                        files.push({
                            name: f.name,
                            size: f.size,
                            path: '',
                            relativePath: f.name,
                            file: f,
                            isNative: false
                        })
                    }
                }
            }
        } else if (dataTransfer.files && dataTransfer.files.length > 0) {
            // Fallback for standard files
            for (let i = 0; i < dataTransfer.files.length; i++) {
                const f = dataTransfer.files[i]
                files.push({
                    name: f.name,
                    size: f.size,
                    path: '',
                    relativePath: f.name,
                    file: f,
                    isNative: false
                })
            }
        }
        
        return files
    },
    
    /**
     * Scan files from normal `<input type="file">` select.
     */
    scanFileInput: async function (fileList) {
        const files = []
        if (!fileList) return files
        
        for (let i = 0; i < fileList.length; i++) {
            const f = fileList[i]
            // If the folder was imported using webkitdirectory, relativePath is stored in webkitRelativePath
            const relPath = normalizePath(f.webkitRelativePath || f.name)
            files.push({
                name: f.name,
                size: f.size,
                path: f.path ? normalizePath(f.path) : '',
                relativePath: relPath,
                file: f,
                isNative: isElectron() && !!f.path
            })
        }
        return files
    },
    
    /**
     * Scan a native directory path (for Electron/Cordova).
     */
    scanLocalDirectory: async function (dirPath) {
        const normDir = normalizePath(dirPath)
        const absoluteFiles = await readdirAllFile(normDir)
        
        const files = []
        for (const absPath of absoluteFiles) {
            const normAbsPath = normalizePath(absPath)
            // Construct relative path
            let relPath = normAbsPath
            if (normAbsPath.startsWith(normDir)) {
                relPath = normAbsPath.substring(normDir.length)
                if (relPath.startsWith('/')) {
                    relPath = relPath.substring(1)
                }
            }
            const name = normAbsPath.substring(normAbsPath.lastIndexOf('/') + 1)
            
            let fileObj = null
            let size = 0
            
            if (isElectron()) {
                const fs = window.require ? window.require('fs') : require('fs')
                try {
                    const stats = fs.statSync(normAbsPath)
                    size = stats.size
                } catch (e) {
                    console.error('Failed to get stats for native path:', normAbsPath, e)
                }
            }
            
            files.push({
                name: name,
                size: size,
                path: normAbsPath,
                relativePath: relPath,
                file: null,
                isNative: true
            })
        }
        return files
    }
}
