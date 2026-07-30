/**
 * FennecView Spine version converter helper module - Cross Platform (Cordova & Electron)
 */
import { isElectron, isCordova } from '@/assets/gkd-js-0.2/env.js'
import { spine36To38, readSkeletonData36And37, readSkeletonData34And35, readSkeletonData21, detectSpineVersion, versionMap } from 'simple-pixi-spine'
import { readdirAllFile, copyFile, saveFile } from '@/assets/gkd-js-0.2/fs.js'
import { ioManager } from '@/services/io/IOManager'

const handlers = {
    readSkeletonData21,
    readSkeletonData34And35,
    readSkeletonData36And37,
};

function getExtname(filePath) {
    const idx = filePath.lastIndexOf('.');
    return idx === -1 ? '' : filePath.slice(idx);
}

function getRelativePath(fromPath, toPath) {
    const fromNorm = fromPath.replace(/\\/g, '/').replace(/\/$/, '');
    const toNorm = toPath.replace(/\\/g, '/');
    if (toNorm.startsWith(fromNorm)) {
        let rel = toNorm.slice(fromNorm.length);
        if (rel.startsWith('/')) {
            rel = rel.slice(1);
        }
        return rel;
    }
    return toNorm;
}

function joinPath(basePath, relPath) {
    const base = basePath.replace(/\\/g, '/').replace(/\/$/, '');
    const rel = relPath.replace(/\\/g, '/').replace(/^\//, '');
    return `${base}/${rel}`;
}

export const SpineConvertManager = {
    scanDirectory: async function (sourceDir) {
        const hasCordova = typeof window !== 'undefined' && window.cordova;
        if (!isElectron() && !isCordova() && !hasCordova) {
            throw new Error("File system operations are only supported in Electron or Cordova environments.");
        }

        const spineFiles = [];
        const otherFiles = [];

        const allFiles = await readdirAllFile(sourceDir);
        for (const itemPath of allFiles) {
            const ext = getExtname(itemPath).toLowerCase();
            let isSpineUnder38 = false;
            let detectedVersion = null;

            if (ext === '.skel' || ext === '.json') {
                try {
                    const fileBuffer = await ioManager.getDriver().read(itemPath);
                    if (ext === '.skel') {
                        detectedVersion = detectSpineVersion({ data: fileBuffer, type: 'skel' });
                    } else {
                        try {
                            const text = new TextDecoder('utf-8').decode(new Uint8Array(fileBuffer));
                            const json = JSON.parse(text);
                            detectedVersion = detectSpineVersion({ data: json, type: 'json' });
                        } catch {}
                    }

                    if (detectedVersion && parseInt(detectedVersion) < 38) {
                        isSpineUnder38 = true;
                    }
                } catch (e) {
                    console.error("Error detecting version for:", itemPath, e);
                }
            }

            const relPath = getRelativePath(sourceDir, itemPath);

            if (isSpineUnder38) {
                spineFiles.push({
                    path: itemPath,
                    relPath,
                    version: detectedVersion,
                    type: ext === '.skel' ? 'skel' : 'json'
                });
            } else {
                otherFiles.push({
                    path: itemPath,
                    relPath
                });
            }
        }

        return { spineFiles, otherFiles };
    },

    convertAndExport: async function (options) {
        const {
            sourceDir,
            destDir,
            mode, // '3.8' or 'original'
            copyOthers,
            spineFiles,
            otherFiles,
            onProgress
        } = options;

        const hasCordova = typeof window !== 'undefined' && window.cordova;
        if (!isElectron() && !isCordova() && !hasCordova) {
            throw new Error("File system operations are only supported in Electron or Cordova environments.");
        }

        const results = [];
        const total = spineFiles.length + (copyOthers ? otherFiles.length : 0);
        let completed = 0;

        const updateProgress = (filePath, status, details = "") => {
            completed++;
            if (onProgress) {
                onProgress({
                    completed,
                    total,
                    filePath,
                    status,
                    details
                });
            }
        };

        // 1. Process Spine < 3.8 files
        for (const file of spineFiles) {
            try {
                const fileBuffer = await ioManager.getDriver().read(file.path);
                let originalSpine = null;

                if (file.type === 'skel') {
                    const config = versionMap[file.version];
                    if (config && config.handler) {
                        const handlerFn = handlers[config.handler];
                        if (handlerFn) {
                            originalSpine = handlerFn(fileBuffer);
                            if (typeof originalSpine === 'string') {
                                originalSpine = JSON.parse(originalSpine);
                            }
                        }
                    }
                } else {
                    const text = new TextDecoder('utf-8').decode(new Uint8Array(fileBuffer));
                    originalSpine = JSON.parse(text);
                }

                if (!originalSpine) {
                    throw new Error("Failed to decode Spine binary/JSON skeleton data.");
                }

                let finalSpine = originalSpine;
                if (mode === '3.8') {
                    finalSpine = spine36To38(originalSpine);
                }

                // Determine output filename: replace extension with .json
                const destRelPath = file.relPath.replace(/\.(skel|json)$/i, '.json');
                const destPath = joinPath(destDir, destRelPath);

                // Write JSON
                const jsonContent = JSON.stringify(finalSpine, null, 2);
                await saveFile(destPath, jsonContent);

                results.push({
                    path: file.path,
                    relPath: file.relPath,
                    destPath,
                    status: 'success',
                    details: `Converted Spine ${file.version} to JSON`
                });

                updateProgress(file.relPath, 'success', `Converted Spine ${file.version}`);
            } catch (err) {
                console.error("Failed to convert spine file:", file.path, err);
                results.push({
                    path: file.path,
                    relPath: file.relPath,
                    status: 'error',
                    details: err.message
                });
                updateProgress(file.relPath, 'error', err.message);
            }
        }

        // 2. Copy other files if enabled
        if (copyOthers) {
            for (const file of otherFiles) {
                try {
                    const destPath = joinPath(destDir, file.relPath);
                    await copyFile(file.path, destPath);

                    results.push({
                        path: file.path,
                        relPath: file.relPath,
                        destPath,
                        status: 'copied',
                        details: 'Copied other file'
                    });
                    updateProgress(file.relPath, 'copied', 'Copied');
                } catch (err) {
                    console.error("Failed to copy other file:", file.path, err);
                    results.push({
                        path: file.path,
                        relPath: file.relPath,
                        status: 'error',
                        details: `Copy failed: ${err.message}`
                    });
                    updateProgress(file.relPath, 'error', `Copy failed: ${err.message}`);
                }
            }
        }

        return results;
    }
};

export default SpineConvertManager;
