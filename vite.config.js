import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

function assetsManifestPlugin() {
    return {
        name: 'assets-manifest-plugin',
        writeBundle(options, bundle) {
            const outDir = options.dir
            if (!outDir) return
            const files = []
            
            function readDirRecursively(dir) {
                const entries = fs.readdirSync(dir, { withFileTypes: true })
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name)
                    if (entry.isDirectory()) {
                        readDirRecursively(fullPath)
                    } else {
                        const relPath = path.relative(outDir, fullPath).replace(/\\/g, '/')
                        if (
                            relPath !== 'assets-manifest.json' && 
                            !relPath.startsWith('export/') && 
                            !relPath.endsWith('.map') &&
                            relPath !== 'project.fv'
                        ) {
                            files.push(relPath)
                        }
                    }
                }
            }
            
            readDirRecursively(outDir)
            fs.writeFileSync(path.join(outDir, 'assets-manifest.json'), JSON.stringify(files, null, 4))
        }
    }
}

export default defineConfig(({ mode }) => {
    let outDir = 'dist'
    if (mode === 'web') {
        outDir = 'dist/web'
    } else if (mode === 'electron') {
        outDir = 'dist/electron/resources/app/www'
    } else if (mode === 'cordova') {
        outDir = 'dist/cordova'
    }

    return {
        base: './',
        plugins: [
            vue(),
            vueDevTools(),
            assetsManifestPlugin(),
        ],
        resolve: {
            alias: [
                { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) }
            ]
        },
        optimizeDeps: {
            entries: ['index.html']
        },
        build: {
            outDir: outDir,
            assetsDir: 'assets',
            sourcemap: true,
        },
    }
})
