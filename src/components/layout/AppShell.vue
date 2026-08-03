<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import TitleBar from './TitleBar.vue'
import LayerViewport from './LayerViewport.vue'
import { useLayerStore } from '@/stores/layerStore.js'
import { useUIStore } from '@/stores/uiStore.js'
import FennecView from '@/fennec-view/FennecView'
import CordovaFileView from '@/views/CordovaFileView.vue'

import { platformService } from '@/services/platform/PlatformService'

const layerStore = useLayerStore()
const uiStore = useUIStore()

const isElectron = platformService.isElectron()
const isCordova = platformService.isCordova()

// Automatically display Home page when there are no visible layers
watch(
    () => layerStore.layers.filter((l) => l.visible).length,
    (visibleCount) => {
        if (visibleCount === 0) {
            layerStore.add({ name: 'Home', z: 10, direction: 'fade' })
        }
    },
    { immediate: true },
)

// Handlers for going back
function onBackGesture(e) {
    if (e) e.preventDefault()
    layerStore.back()
}

function onContextMenu(e) {
    e.preventDefault()
    layerStore.back()
}

function onKeyDown(e) {
    if (e.key === 'Escape') {
        layerStore.back()
    } else if (e.key === 'Delete' || e.key === 'Del') {
        const activeEl = document.activeElement
        if (
            activeEl && (
                activeEl.tagName === 'INPUT' || 
                activeEl.tagName === 'TEXTAREA' || 
                activeEl.isContentEditable
            )
        ) {
            return
        }
        if (FennecView?.deleteNode) {
            FennecView.deleteNode()
        }
    }
}

onMounted(() => {
    // Electron right-click back listener (disabled on Cordova)
    if (!isCordova) {
        window.addEventListener('contextmenu', onContextMenu, false)
    }

    // Cordova physical back button listener
    document.addEventListener('backbutton', onBackGesture, false)

    // Keyboard ESC key back listener
    window.addEventListener('keydown', onKeyDown, false)

    // Global drag and drop listeners to support Chrome and prevent default browser redirect behaviors
    window.addEventListener('dragover', handleDragOver, false)
    window.addEventListener('drop', handleFileDrop, false)
})

onUnmounted(() => {
    if (!isCordova) {
        window.removeEventListener('contextmenu', onContextMenu)
    }
    document.removeEventListener('backbutton', onBackGesture)
    window.removeEventListener('keydown', onKeyDown)

    window.removeEventListener('dragover', handleDragOver)
    window.removeEventListener('drop', handleFileDrop)
})

function handleFileDrop(e) {
    e.preventDefault()
    if (FennecView?.fileHandleDrop) FennecView.fileHandleDrop(e)
}

function handleDragOver(e) {
    e.preventDefault()
}
</script>

<template>
    <div id="game_window" class="app-shell" :class="{ 'is-electron': isElectron }">
        <!-- Electron Drag Titlebar -->
        <TitleBar v-if="isElectron"></TitleBar>

        <!-- App Content Shell (takes remaining viewport height) -->
        <div class="content-viewport">
            <!-- Dynamic Layer Renderer Stack -->
            <div class="viewport-wrapper">
                <LayerViewport />
            </div>
        </div>

        <!-- Cordova File Explorer overlay -->
        <CordovaFileView
            v-if="uiStore.cordovaFileView && uiStore.cordovaFileView.display"
            :display="uiStore.cordovaFileView.display"
            :title="uiStore.cordovaFileView.title"
            :multiple="uiStore.cordovaFileView.multiple"
            :onlyFolder="uiStore.cordovaFileView.onlyFolder"
            :openPath="uiStore.cordovaFileView.openPath"
            @close="uiStore.closeCordovaFileView"
            @select="uiStore.cordovaFileView.onSelect"
        />
    </div>
</template>

<style scoped>
.app-shell {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    background-color: var(--bg-dark-app, #121212);
}

.content-viewport {
    flex: 1;
    position: relative;
    overflow: hidden;
}

.viewport-wrapper {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    overflow: hidden;
}
</style>
