import { spine36To38 } from 'simple-pixi-spine'
import axios from 'axios'

export function downloadTextAsFile(content, filename = "data.txt", type = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

export async function readFileAsArrayBuffer(pathOrUrl) {
    if (!pathOrUrl) return null;
    if (pathOrUrl.startsWith('http') || pathOrUrl.startsWith('blob:') || pathOrUrl.startsWith('data:')) {
        const response = await axios.get(pathOrUrl, { responseType: 'arraybuffer' });
        return response.data;
    }
    try {
        let cleanPath = pathOrUrl;
        if (cleanPath.startsWith('file:///')) {
            cleanPath = cleanPath.substring(8);
        } else if (cleanPath.startsWith('file://')) {
            cleanPath = cleanPath.substring(7);
        }
        const { ioManager } = await import('@/services/io/IOManager.js');
        const buffer = await ioManager.getDriver().read(cleanPath);
        return buffer;
    } catch (e) {
        console.error("readFileAsArrayBuffer driver read error, fallback to axios:", e);
        const response = await axios.get(pathOrUrl, { responseType: 'arraybuffer' });
        return response.data;
    }
}

export function readBlobAsText(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
    });
}

export function readBlobAsArrayBuffer(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blob);
    });
}

export async function addFileToZip(zip, zipPath, pathOrUrl) {
    try {
        const buffer = await readFileAsArrayBuffer(pathOrUrl);
        if (buffer) {
            zip.file(zipPath, buffer);
            return true;
        }
        return false;
    } catch (e) {
        console.error("Failed to add file to ZIP:", pathOrUrl, e);
        return false;
    }
}

export async function copyFileOrBlobToDisk(src, destPath) {
    try {
        const { ioManager } = await import('@/services/io/IOManager.js');
        const driver = ioManager.getDriver();
        if (typeof src === 'string' && (src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('http:') || src.startsWith('https:'))) {
            const buffer = await readFileAsArrayBuffer(src);
            if (buffer) {
                await driver.write(destPath, buffer);
            }
        } else {
            const buffer = await driver.read(src);
            if (buffer) {
                await driver.write(destPath, buffer);
            }
        }
    } catch (e) {
        console.error("Failed to copy file/blob to disk:", e);
    }
}

const helperMethods = {
    generateRandomString: function () {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
};

export default helperMethods;
