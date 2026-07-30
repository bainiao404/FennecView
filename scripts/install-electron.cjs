const fs = require('fs')
const path = require('path')
const { downloadArtifact } = require('@electron/get')
const extract = require('extract-zip')

async function main() {
    const platform = process.platform
    if (platform !== 'win32' && platform !== 'linux') {
        console.log(`[Install Electron] Unsupported platform: ${platform}. Skipping.`)
        return
    }

    const version = '25.4.0'
    const targetDir = path.join(__dirname, '..', 'dist', 'electron')
    const oldExecName = platform === 'win32' ? 'electron.exe' : 'electron'
    const newExecName = platform === 'win32' ? 'fennec-view.exe' : 'fennec-view'
    const oldExecPath = path.join(targetDir, oldExecName)
    const newExecPath = path.join(targetDir, newExecName)

    if (fs.existsSync(newExecPath)) {
        console.log(`[Install Electron] '${newExecName}' already exists. Skipping download.`)
        return
    }

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true })
    }

    console.log(`[Install Electron] Downloading Electron v${version}...`)
    const zipPath = await downloadArtifact({
        version,
        platform,
        arch: process.arch,
        artifactName: 'electron',
    })

    console.log(`[Install Electron] Extracting to ${targetDir}...`)
    await extract(zipPath, { dir: targetDir })

    console.log(`[Install Electron] Renaming executable...`)
    if (fs.existsSync(oldExecPath)) {
        fs.renameSync(oldExecPath, newExecPath)
        console.log(`[Install Electron] Installed successfully!`)
    }
}

main().catch(err => {
    console.error('[Install Electron] Error:', err.message)
    process.exit(1)
})
