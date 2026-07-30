const { app, BrowserWindow, ipcMain, dialog, Menu, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,     // 允许渲染进程使用 Node.js APIs
            contextIsolation: false,   // 禁用上下文隔离
            webSecurity: false         // 允许读取本地伴生资源
        }
    })

    // 监听按键事件以恢复快捷键功能（即使隐藏了菜单栏）
    win.webContents.on('before-input-event', (event, input) => {
        // F12 或 Ctrl+Shift+I 开关开发者工具
        if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
            win.webContents.toggleDevTools()
            event.preventDefault()
        }
        // F5 或 Ctrl+R 重新加载页面
        if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
            win.webContents.reload()
            event.preventDefault()
        }
    })

    // 读取解压同目录下的 index.html
    win.loadFile(path.join(__dirname, 'www', 'index.html'))
}

// 注册选择对话框的 IPC 监听
ipcMain.handle('show-open-dialog', async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    return await dialog.showOpenDialog(win, options)
})

// 注册拖拽开始 of IPC 监听
ipcMain.on('ondragstart', (event, { filePath, filePaths, iconPath, iconSize }) => {
    let dragIcon = null
    if (iconPath && fs.existsSync(iconPath)) {
        try {
            dragIcon = nativeImage.createFromPath(iconPath)
            if (iconSize && iconSize.width && iconSize.height) {
                dragIcon = dragIcon.resize({ width: iconSize.width, height: iconSize.height })
            }
        } catch (e) {
            console.error('Failed to load drag icon:', e)
        }
    }
    
    if (!dragIcon || dragIcon.isEmpty()) {
        const defaultIconPath = path.join(__dirname, 'dist', 'favicon.ico')
        const backupIconPath = path.join(__dirname, 'favicon.ico')
        const chosenIconPath = fs.existsSync(defaultIconPath) ? defaultIconPath : backupIconPath
        if (fs.existsSync(chosenIconPath)) {
            try {
                dragIcon = nativeImage.createFromPath(chosenIconPath)
                if (iconSize && iconSize.width && iconSize.height) {
                    dragIcon = dragIcon.resize({ width: iconSize.width, height: iconSize.height })
                }
            } catch (e) {}
        }
    }
    
    if (!dragIcon || dragIcon.isEmpty()) {
        dragIcon = nativeImage.createEmpty()
    }

    const startDragOptions = {
        icon: dragIcon
    }
    if (filePaths && filePaths.length > 0) {
        startDragOptions.files = filePaths
    } else if (filePath) {
        startDragOptions.file = filePath
    } else {
        return // Nothing to drag
    }

    event.sender.startDrag(startDragOptions)
})

app.whenReady().then(() => {
    // 隐藏/移除默认的菜单栏
    Menu.setApplicationMenu(null)
    
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})
