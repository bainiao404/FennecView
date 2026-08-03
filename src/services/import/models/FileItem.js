import { ioManager } from '@/services/io/IOManager'
import { readBlobAsText, readBlobAsArrayBuffer } from '@/utils/helpers'
import { blobRegistry } from '@/services/resources/BlobRegistry'
import { platformService } from '@/services/platform/PlatformService'
import { toRaw } from 'vue'
import { MimeUtil } from '@/utils/MimeUtil'
import { fileResourceManager } from '@/services/resources/FileResourceManager'

export class BaseFileItem {
    constructor(data) {
        this.name = data.name
        this.size = data.size
        this.path = data.path
        this.relativePath = data.relativePath
        this.file = data.file
        this.isNative = data.isNative
    }

    async readAsText() {
        throw new Error('Not implemented')
    }

    async readAsArrayBuffer() {
        throw new Error('Not implemented')
    }

    async getLoadUrl() {
        throw new Error('Not implemented')
    }

    async getBlobUrl() {
        throw new Error('Not implemented')
    }
}

export class NativeFileItem extends BaseFileItem {
    async readAsArrayBuffer() {
        return await ioManager.getDriver().read(this.path)
    }

    async readAsText() {
        const buffer = await this.readAsArrayBuffer()
        return new TextDecoder('utf-8').decode(new Uint8Array(buffer))
    }

    async getLoadUrl() {
        return this.path
    }

    async getBlobUrl() {
        const buffer = await this.readAsArrayBuffer()
        const mimeType = MimeUtil.getMimeType(this.name)
        const blob = new Blob([buffer], { type: mimeType })
        const url = blobRegistry.createURL(blob, this.name)
        fileResourceManager.registerFile(this.name, blob, { blobUrl: url, path: this.path, relativePath: this.relativePath })
        return url
    }
}

export class WebFileItem extends BaseFileItem {
    constructor(data) {
        super(data)
        this._cachedBlobUrl = ''
    }

    async readAsArrayBuffer() {
        return await readBlobAsArrayBuffer(toRaw(this.file))
    }

    async readAsText() {
        return await readBlobAsText(toRaw(this.file))
    }

    getCorrectedBlob() {
        const rawFile = toRaw(this.file)
        if (!rawFile) return null
        let mimeType = rawFile.type
        
        // Determine correct mime type based on extension if it is generic, empty or missing
        if (!mimeType || mimeType === 'application/octet-stream') {
            mimeType = MimeUtil.getMimeType(this.name)
        }
        
        // Wrap the File/Blob in a new Blob to override/correct the MIME type
        // without calling .slice() which breaks directory entry temporary handles.
        if (mimeType && mimeType !== rawFile.type) {
            return new Blob([rawFile], { type: mimeType })
        }
        return rawFile
    }

    async getLoadUrl() {
        if (this._cachedBlobUrl) return this._cachedBlobUrl
        const blob = this.getCorrectedBlob()
        if (!blob) return ''
        this._cachedBlobUrl = blobRegistry.createURL(blob, this.name)
        fileResourceManager.registerFile(this.name, blob, { blobUrl: this._cachedBlobUrl, path: this.path, relativePath: this.relativePath })
        return this._cachedBlobUrl
    }

    async getBlobUrl() {
        return await this.getLoadUrl()
    }
}

export function createFileItem(data) {
    if (!data) return null
    // If it's already an instance of BaseFileItem, or has its characteristic methods, return it
    if (data instanceof BaseFileItem || (data && typeof data.getBlobUrl === 'function' && typeof data.readAsText === 'function')) {
        return data
    }
    if (data.isNative || (platformService.isElectron() && !!data.path)) {
        return new NativeFileItem(data)
    } else {
        return new WebFileItem(data)
    }
}
