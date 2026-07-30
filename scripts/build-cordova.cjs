const fs = require('fs-extra')
const path = require('path')

async function main() {
    const srcDist = path.join(__dirname, '..', 'dist', 'web')
    const destApp = path.join(__dirname, '..', 'cordova', 'www', 'app', 'FennecView', 'www')

    console.log('[Build Cordova] Clearing old www sub-app resources...')
    await fs.remove(destApp)
    await fs.ensureDir(destApp)

    console.log('[Build Cordova] Copying compiled files to cordova/www/app/FennecView/www...')
    await fs.copy(srcDist, destApp)

    console.log('[Build Cordova] Cordova www assets synchronized successfully!')
}

main().catch(err => {
    console.error('[Build Cordova] Copy failed:', err.message)
    process.exit(1)
})
