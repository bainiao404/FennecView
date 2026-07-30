<template>
    <div class="custom-title-bar">
        <div class="title-text">
            <img :src="'favicon.ico'" class="title-icon" alt="" />
            FennecView
        </div>
        <div class="window-controls">
            <button class="control-btn minimize" @click="minimizeWindow" title="最小化">
                <remove-icon />
            </button>
            <button class="control-btn maximize" @click="toggleMaximize" :title="isMaximized ? '向下还原' : '最大化'">
                <fullscreen-exit-icon v-if="isMaximized" />
                <fullscreen-icon v-else />
            </button>
            <button class="control-btn close" @click="closeWindow" title="关闭">
                <close-icon />
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RemoveIcon, CloseIcon, FullscreenIcon, FullscreenExitIcon, MinusRectangleIcon } from 'tdesign-icons-vue-next'

defineEmits(['enter-mini'])

let ipcRenderer = null
try {
    if (typeof window !== 'undefined' && window.require) {
        ipcRenderer = window.require('electron').ipcRenderer
    }
} catch (e) {
    console.warn('Electron IPC not available')
}

const isMaximized = ref(false)

function minimizeWindow() {
    if (!ipcRenderer) return
    ipcRenderer.invoke('window-control', 'minimize')
}

function toggleMaximize() {
    if (!ipcRenderer) return
    ipcRenderer.invoke('window-control', 'toggle-maximize')
}

function closeWindow() {
    if (!ipcRenderer) return
    ipcRenderer.invoke('window-control', 'close')
}

const handleMaximizeStateChange = (event, state) => {
    isMaximized.value = state
}

onMounted(() => {
    if (!ipcRenderer) return
    try {
        ipcRenderer.invoke('window-control', 'is-maximized').then(state => {
            isMaximized.value = state
        })
        ipcRenderer.on('window-maximize-state-change', handleMaximizeStateChange)
    } catch (e) {
        console.error(e)
    }
})

onUnmounted(() => {
    if (!ipcRenderer) return
    try {
        ipcRenderer.off('window-maximize-state-change', handleMaximizeStateChange)
    } catch (e) {}
})
</script>

<style scoped>
.custom-title-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 32px;
    background: var(--glass-bg-titlebar);
    backdrop-filter: var(--glass-blur-titlebar);
    display: flex;
    justify-content: space-between;
    align-items: center;
    -webkit-app-region: drag; /* 允许拖拽 */
    user-select: none;
    box-sizing: border-box;
    border-bottom: 1px solid var(--border-color, #333333);
    z-index: 9999;
}

.title-text {
    padding-left: 8px;
    font-size: 13px;
    color: var(--text-primary, #cccccc);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
}

.title-icon {
    width: 20px;
    height: 20px;
    object-fit: contain;
}

.window-controls {
    display: flex;
    height: 100%;
    -webkit-app-region: no-drag; /* 控件区域禁止拖拽，否则无法点击 */
}

.control-btn {
    width: 46px;
    height: 100%;
    border: none;
    background: transparent;
    color: var(--text-primary, #cccccc);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: background 0.2s;
}

.control-btn:hover {
    background: var(--bg-dark-hover, #333333);
}

.control-btn.close:hover {
    background: #f56c6c;
    color: white;
}
</style>
