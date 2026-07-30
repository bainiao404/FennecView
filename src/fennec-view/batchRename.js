/**
 * FennecView Batch Rename - Modular ES6 version
 */

import SimpleSpine from 'simple-pixi-spine'
import { isElectron } from '@/assets/gkd-js-0.2/env.js'

let nodeFs = null;
let nodePath = null;

if (isElectron()) {
    try {
        if (typeof window !== 'undefined' && window.require) {
            nodeFs = window.require('fs').promises;
            nodePath = window.require('path');
        } else if (typeof require !== 'undefined') {
            nodeFs = require('fs').promises;
            nodePath = require('path');
        }
    } catch (e) {
        console.error("Failed to load fs/path in electron:", e);
    }
}

export const BatchRenameManager = {
    files: [],
    loadFilesFromEvent: async function (event) {
        if (!nodeFs) {
            console.warn("File system operations are only supported in Electron/Cordova environments.");
            return;
        }
        console.time(5);
        event.preventDefault();
        event.stopPropagation();
        let fileList = [];
        let files = event.dataTransfer.files;
        for (var i = 0; i < files.length; i++) {
            let stats = await nodeFs.stat(files[i].path);
            if (stats.isDirectory()) {
                let list = await getAllFiles(files[i].path, function (state) {
                    return state.size < 5242880;
                });
                fileList = [...fileList, ...list];
            }
            if (stats.isFile()) {
                fileList.push(files[i].path);
            }
        }
        let skelFile = [];
        for (var i = 0; i < fileList.length; i++) {
            let data = await readFileData(fileList[i], 70);
            let text = data.toString('ascii');
            let vs = null;
            let type = null;
            if (text[0] == "{") {
                let fileText = await nodeFs.readFile(fileList[i], "utf8");
                try {
                    vs = SimpleSpine.isVersion(JSON.parse(fileText));
                    type = "json";
                } catch {
                    continue;
                }
            } else {
                vs = SimpleSpine.isVersion(text);
                type = "skel";
            }
            if (vs) {
                skelFile.push({
                    path: fileList[i],
                    version: vs,
                    type: "skeleton",
                    fileType: type,
                });
                continue;
            }
            if (text.indexOf("size:") != -1 && text.indexOf("filter:") != -1) {
                skelFile.push({
                    path: fileList[i],
                    type: "atlas",
                });
            }
        }
        let txt = "";
        for (var i = 0; i < skelFile.length; i++) {
            let file = skelFile[i];
            file.path = file.path.replace(/\\/g, "/");
            let filePathData = file.path.match(/(.*\/)(.*)/);
            let fileName = (file.name = filePathData[2]);
            file.place = filePathData[1];
            switch (file.type) {
                case "skeleton":
                    if (
                        fileName.endsWith(".skel") ||
                        fileName.endsWith(".json")
                    ) {
                        break;
                    }
                    let a = fileName.indexOf(".skel.");
                    let b = fileName.indexOf(".json.");
                    if (a != -1 || b != -1) {
                        file.endName = fileName.slice(0, Math.max(a, b) + 5);
                        break;
                    }
                    if (fileName.indexOf(".") != -1) {
                        file.endName = fileName.slice(0, fileName.indexOf(".")) + "." + file.fileType;
                        break;
                    }
                    if (fileName.indexOf(".") == -1) {
                        file.endName = fileName + "." + file.fileType;
                    }
                    break;
                case "atlas":
                    if (fileName.endsWith(".atlas")) {
                        break;
                    }
                    let atlasIndex = fileName.indexOf(".atlas");
                    if (atlasIndex != -1) {
                        file.endName = fileName.slice(0, atlasIndex + 6);
                        break;
                    }
                    if (fileName.indexOf(".") != -1) {
                        file.endName = fileName.slice(0, fileName.indexOf(".")) + ".atlas";
                        break;
                    }
                    if (fileName.indexOf(".") == -1) {
                        file.endName = fileName + ".atlas";
                    }
                    break;
            }
            if (file.endName) {
                txt +=
                    `<div class="menuButton" style="text-align: left;">
                        <div style="font-size: 14px">` +
                            file.place +
                            `</div>
                        <span style="color: rgb(255, 4, 0);;">` +
                            file.name +
                            `</span> =>
                        <span style="color: rgb(21, 255, 0)">` +
                            file.endName +
                            `</span>
                    </div>`;
            }
        }
        this.files = skelFile;
        const listContainer = document.getElementById("toolView-batchRename-list");
        if (listContainer) {
            listContainer.innerHTML = txt;
        }
        console.timeEnd(5);
    },
    runBatchRename: async function () {
        if (!nodeFs) return;
        let files = this.files;
        this.files = [];
        let txt = "";
        if (files.length <= 0) { return; }
        for (var i = 0; i < files.length; i++) {
            let file = files[i];
            if (!file.endName) { continue; }
            let state = true;
            try {
                await nodeFs.rename(file.place + file.name, file.place + file.endName);
            } catch {
                state = false;
            }
            txt +=
                `<div class="menuButton" style="text-align: left;">
                    <div style="font-size: 14px">` + file.place + `</div>
                    <span style="color: rgb(255, 4, 0);;">` + file.name + `</span> =>
                    <span style="color: rgb(21, 255, 0)">` + file.endName + `</span> => 
                    <span style="color: rgb(255, 0, 204)">` + (state ? 'ok' : 'error') + `</span>
                </div>`;
        }
        const listContainer = document.getElementById("toolView-batchRename-list");
        if (listContainer) {
            listContainer.innerHTML = txt;
        }
    }
};

async function readFileData(filePath, byteSize) {
    if (!nodeFs) return Buffer.alloc(0);
    try {
        const stats = await nodeFs.stat(filePath);
        if (typeof byteSize === "undefined" || byteSize > stats.size) {
            byteSize = stats.size;
        }
        const fd = await nodeFs.open(filePath, "r");
        const buffer = Buffer.alloc(byteSize);
        const { bytesRead } = await fd.read(buffer, 0, byteSize, 0);
        await fd.close();
        return buffer.slice(0, bytesRead);
    } catch (error) {
        console.error("读取文件时出现错误:", error);
        throw error;
    }
}

async function getAllFiles(dirPath, filter) {
    if (!nodeFs || !nodePath) return [];
    return _getAllFiles(dirPath);
    async function _getAllFiles(dirPath) {
        const files = [];
        try {
            const items = await nodeFs.readdir(dirPath);
            for (const item of items) {
                const itemPath = nodePath.join(dirPath, item);
                const stats = await nodeFs.stat(itemPath);
                if (!filter || !filter(stats)) {
                    continue;
                }
                if (stats.isDirectory()) {
                    const subFiles = await _getAllFiles(itemPath);
                    files.push(...subFiles);
                } else {
                    files.push(itemPath);
                }
            }
        } catch (err) {
            console.error("读取目录时出错:", err);
        }
        return files;
    }
}
export default BatchRenameManager;
