import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

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
        ],
        resolve: {
            alias: [
                { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) }
            ]
        },
        build: {
            outDir: outDir,
            assetsDir: 'assets',
            sourcemap: true,
        },
    }
})
