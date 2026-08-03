<script setup>
import { useLayerStore } from '@/stores/layerStore'
import PageHeader from './PageHeader.vue'
import { useI18nStore } from '@/stores/i18n'
import { useUIStore } from '@/stores/uiStore'

import HomeView from '@/views/HomeView.vue'
import ExportWallpaperView from '@/views/ExportWallpaperView.vue'
import ExportMp4View from '@/views/ExportMp4View.vue'
import ExportGifView from '@/views/ExportGifView.vue'
import BatchRenameView from '@/views/BatchRenameView.vue'
import SpineConvertView from '@/views/SpineConvertView.vue'
import AboutView from '@/views/AboutView.vue'
import ImportPrepareView from '@/views/ImportPrepareView.vue'
import DragDropResolveView from '@/views/DragDropResolveView.vue'

import '@/assets/styles/industrial-dark.css'

const layerStore = useLayerStore()
const i18nStore = useI18nStore()
const uiStore = useUIStore()

const isElectron =
    typeof window !== 'undefined' &&
    (!!window.process || (window.navigator && window.navigator.userAgent.indexOf('Electron') !== -1))

// Map component names to Vue files
const componentsMap = {
    Home: HomeView,
    HomeView: HomeView,
    ExportWallpaperView,
    ExportMp4View,
    ExportGifView,
    BatchRenameView,
    SpineConvertView,
    AboutView,
    ImportPrepareView,
    DragDropResolveView,
}

// Convert input description direction to CSS transition name
function getTransitionName(direction) {
    if (!direction) return 'slide-right'
    const d = direction.toLowerCase()
    if (d.includes('right') || d.includes('右')) return 'slide-right'
    if (d.includes('left') || d.includes('左')) return 'slide-left'
    if (d.includes('bottom') || d.includes('下')) return 'slide-bottom'
    if (d.includes('top') || d.includes('上')) return 'slide-top'
    if (d.includes('fade') || d.includes('渐')) return 'slide-fade'
    return 'slide-right'
}

function getLayerTitle(name) {
    const titles = {
        AboutView: i18nStore.t('aboutTab'),
        ExportWallpaperView: i18nStore.t('exportWallpaperTab'),
        ExportMp4View: i18nStore.t('exportMp4Tab'),
        ExportGifView: i18nStore.t('exportGifTab'),
        BatchRenameView: i18nStore.t('batchRenameTab'),
        SpineConvertView: i18nStore.t('spineConvertTab'),
        OpneFile: i18nStore.t('openFileTab'),
        ConfigurationView: i18nStore.t('configSettingTab'),
        ExportView: i18nStore.t('batchExportTab'),
        SpineView: i18nStore.t('spinePreviewTab'),
        ImgView: 'Image View',
        TextView: 'Text View',
        AudioView: 'Audio Player',
        MeshView: 'Mesh Viewer',
        SingleFileExporter: 'Export Asset',
        BinaryViewer: i18nStore.t('binaryViewerTab'),
        ObjectDetails: i18nStore.t('objectDetailsTab'),
        ImportPrepareView: i18nStore.locale === 'zh' ? '资源导入准备' : 'Import Preparation',
        DragDropResolveView: i18nStore.locale === 'zh' ? '拖拽内容解析' : 'Resolve Drag & Drop',
    }
    return titles[name] || name
}
</script>

<template>
    <div class="layer-render-container" :class="{ 'selecting-rect': uiStore.userInteraction.isSelectingRect }">
        <Transition
            v-for="layer in layerStore.orderedLayers"
            :key="layer.id"
            :name="getTransitionName(layer.direction)"
            appear
            @after-leave="layerStore.finalizeRemove(layer.id)"
        >
            <div
                v-if="layer.visible"
                class="layer-wrapper"
                :class="['layer-' + layer.name.toLowerCase(), { 'is-electron': isElectron }]"
                :style="{
                    zIndex: layer.z,
                    '--layer-duration': layer.duration + 'ms',
                }"
            >
                <PageHeader
                    v-if="layer.name !== 'Home' && layer.name !== 'HomeView'"
                    :title="getLayerTitle(layer.name)"
                />
                <div class="layer-content">
                    <component :is="componentsMap[layer.name]" v-bind="layer.props" />
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.layer-render-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    overflow: hidden;
}

.layer-render-container.selecting-rect .layer-wrapper:not(.layer-home):not(.layer-homeview) {
    display: none !important;
}

/* Layer Base Styling */
.layer-wrapper {
    --bg-main: var(--bg-dark-app, #121212);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--bg-main);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}

.layer-wrapper.is-electron {
    padding-top: 32px;
}

.layer-wrapper.is-electron.layer-home,
.layer-wrapper.is-electron.layer-homeview {
    padding-top: 0;
}

.layer-content {
    flex: 1;
    overflow: auto;
    position: relative;
    width: 100%;
    height: 100%;
}

/* --- Layer Transition Animations --- */

/* slide-right (Enters from Right-to-Left, Leaves to Right) */
.slide-right-enter-active,
.slide-right-leave-active {
    transition:
        transform var(--layer-duration, 700ms) cubic-bezier(0.16, 1, 0.3, 1),
        opacity var(--layer-duration, 700ms) ease-in-out;
    will-change: transform, opacity;
}
.slide-right-enter-from {
    transform: translateX(100%);
    opacity: 0;
}
.slide-right-leave-to {
    transform: translateX(100%);
    opacity: 0;
}

/* slide-left (Enters from Left-to-Right, Leaves to Left) */
.slide-left-enter-active,
.slide-left-leave-active {
    transition:
        transform var(--layer-duration, 700ms) cubic-bezier(0.16, 1, 0.3, 1),
        opacity var(--layer-duration, 700ms) ease-in-out;
    will-change: transform, opacity;
}
.slide-left-enter-from {
    transform: translateX(-100%);
    opacity: 0;
}
.slide-left-leave-to {
    transform: translateX(-100%);
    opacity: 0;
}

/* slide-bottom (Enters from Bottom-to-Top, Leaves to Bottom) */
.slide-bottom-enter-active,
.slide-bottom-leave-active {
    transition:
        transform var(--layer-duration, 700ms) cubic-bezier(0.16, 1, 0.3, 1),
        opacity var(--layer-duration, 700ms) ease-in-out;
    will-change: transform, opacity;
}
.slide-bottom-enter-from {
    transform: translateY(100%);
    opacity: 0;
}
.slide-bottom-leave-to {
    transform: translateY(100%);
    opacity: 0;
}

/* slide-top (Enters from Top-to-Bottom, Leaves to Top) */
.slide-top-enter-active,
.slide-top-leave-active {
    transition:
        transform var(--layer-duration, 700ms) cubic-bezier(0.16, 1, 0.3, 1),
        opacity var(--layer-duration, 700ms) ease-in-out;
    will-change: transform, opacity;
}
.slide-top-enter-from {
    transform: translateY(-100%);
    opacity: 0;
}
.slide-top-leave-to {
    transform: translateY(-100%);
    opacity: 0;
}

/* slide-fade (Enters and Leaves with Opacity Fade) */
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: opacity var(--layer-duration, 700ms) ease-in-out;
    will-change: opacity;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
    opacity: 0;
}
</style>
