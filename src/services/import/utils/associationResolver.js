import { parseAtlasTextures } from './atlasParser'

/**
 * Resolves relative path segments (like . and ..) to construct clean relative paths.
 */
export function resolveRelativePath(p) {
    const segments = p.replace(/\\/g, '/').split('/')
    const stack = []
    for (const segment of segments) {
        if (segment === '.' || segment === '') continue
        if (segment === '..') {
            if (stack.length > 0) stack.pop()
        } else {
            stack.push(segment)
        }
    }
    return stack.join('/')
}

/**
 * Decoupled file association filter utility for Spine and Live2D imports.
 * Scans local files from directory and returns only those that are associated with the entry points.
 */
export async function getAssociatedFiles(entryFile, localFiles) {
    const entryName = entryFile.name.toLowerCase()
    const entryBase = entryFile.name.substring(0, entryFile.name.lastIndexOf('.'))
    const entryDir = entryFile.relativePath.substring(0, entryFile.relativePath.lastIndexOf('/') + 1)
    
    const associated = new Set()
    associated.add(entryFile.relativePath)

    if (entryName.endsWith('.skel')) {
        let atlasFile = localFiles.find(f => {
            const fName = f.name.toLowerCase()
            const fDir = f.relativePath.substring(0, f.relativePath.lastIndexOf('/') + 1)
            return fName === `${entryBase.toLowerCase()}.atlas` && fDir === entryDir
        })
        if (!atlasFile) {
            const dirAtlases = localFiles.filter(f => {
                const fDir = f.relativePath.substring(0, f.relativePath.lastIndexOf('/') + 1)
                return f.name.toLowerCase().endsWith('.atlas') && fDir === entryDir
            })
            if (dirAtlases.length === 1) {
                atlasFile = dirAtlases[0]
            }
        }
        if (!atlasFile) {
            atlasFile = localFiles.find(f => f.name.toLowerCase() === `${entryBase.toLowerCase()}.atlas`)
        }
        
        if (atlasFile) {
            associated.add(atlasFile.relativePath)
            try {
                const atlasText = await atlasFile.readAsText()
                const requiredTextures = parseAtlasTextures(atlasText)
                for (const texName of requiredTextures) {
                    const texFile = localFiles.find(f => {
                        const fDir = f.relativePath.substring(0, f.relativePath.lastIndexOf('/') + 1)
                        if (fDir !== entryDir) return false
                        const fName = f.name.toLowerCase()
                        const tName = texName.toLowerCase()
                        if (fName === tName) return true
                        const fNameNoExt = fName.substring(0, fName.lastIndexOf('.'))
                        const tNameNoExt = tName.includes('.') ? tName.substring(0, tName.lastIndexOf('.')) : tName
                        return fNameNoExt === tNameNoExt && /\.(png|jpg|jpeg|webp|gif)$/i.test(fName)
                    })
                    if (texFile) {
                        associated.add(texFile.relativePath)
                    }
                }
            } catch (e) {
                console.error('Failed to read and parse atlas for association filter:', atlasFile.path, e)
            }
        }
    } else if (entryName.endsWith('.json') || entryName.endsWith('.spine-json')) {
        try {
            const text = await entryFile.readAsText()
            const parsed = JSON.parse(text)
            
            const collectedPaths = []
            function collectPaths(obj) {
                for (let key in obj) {
                    if (typeof obj[key] === 'string') {
                        const val = obj[key]
                        if (
                            /\.[a-zA-Z0-9]+$/.test(val) &&
                            !val.startsWith('http') &&
                            !val.startsWith('data:') &&
                            !val.startsWith('blob:')
                        ) {
                            collectedPaths.push(val)
                        }
                    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                        collectPaths(obj[key])
                    }
                }
            }
            collectPaths(parsed)

            for (const relPath of collectedPaths) {
                const resolvedRelPath = resolveRelativePath(entryDir + relPath)
                let matchedFile = localFiles.find(f => f.relativePath.replace(/\\/g, '/').toLowerCase() === resolvedRelPath.toLowerCase())
                
                if (!matchedFile) {
                    const fileName = relPath.substring(relPath.lastIndexOf('/') + 1).toLowerCase()
                    matchedFile = localFiles.find(f => {
                        const fDir = f.relativePath.substring(0, f.relativePath.lastIndexOf('/') + 1)
                        return f.name.toLowerCase() === fileName && fDir === entryDir
                    })
                }
                
                if (matchedFile) {
                    associated.add(matchedFile.relativePath)
                }
            }

            if (parsed.skeleton || parsed.bones || parsed.animations || parsed.slots || entryName.endsWith('.spine-json')) {
                let atlasFile = localFiles.find(f => {
                    const fName = f.name.toLowerCase()
                    const fDir = f.relativePath.substring(0, f.relativePath.lastIndexOf('/') + 1)
                    return fName === `${entryBase.toLowerCase()}.atlas` && fDir === entryDir
                })
                if (!atlasFile) {
                    const dirAtlases = localFiles.filter(f => {
                        const fDir = f.relativePath.substring(0, f.relativePath.lastIndexOf('/') + 1)
                        return f.name.toLowerCase().endsWith('.atlas') && fDir === entryDir
                    })
                    if (dirAtlases.length === 1) {
                        atlasFile = dirAtlases[0]
                    }
                }
                if (atlasFile) {
                    associated.add(atlasFile.relativePath)
                    try {
                        const atlasText = await atlasFile.readAsText()
                        const requiredTextures = parseAtlasTextures(atlasText)
                        for (const texName of requiredTextures) {
                            const texFile = localFiles.find(f => {
                                const fDir = f.relativePath.substring(0, f.relativePath.lastIndexOf('/') + 1)
                                if (fDir !== entryDir) return false
                                const fName = f.name.toLowerCase()
                                const tName = texName.toLowerCase()
                                if (fName === tName) return true
                                const fNameNoExt = fName.substring(0, fName.lastIndexOf('.'))
                                const tNameNoExt = tName.includes('.') ? tName.substring(0, tName.lastIndexOf('.')) : tName
                                return fNameNoExt === tNameNoExt && /\.(png|jpg|jpeg|webp|gif)$/i.test(fName)
                            })
                            if (texFile) {
                                associated.add(texFile.relativePath)
                            }
                        }
                    } catch (e) {
                        console.error('Failed to parse atlas for Spine JSON:', atlasFile.path, e)
                    }
                }
            }
        } catch (e) {
            console.error('Failed to parse JSON file for associations:', entryFile.path, e)
        }
    }
    
    return localFiles.filter(f => associated.has(f.relativePath))
}
