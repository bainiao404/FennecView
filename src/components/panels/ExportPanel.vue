<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/uiStore'
import { useI18nStore } from '@/stores/i18n'
import { useLayerStore } from '@/stores/layerStore'
import FennecView from '@/fennec-view/FennecView'

const uiStore = useUIStore()
const i18n = useI18nStore()
const layerStore = useLayerStore()

const currentNode = computed(() => uiStore.propertyPanel.currentNode)

const hasOriginalSpine = computed(() => {
    return currentNode.value?.hasOriginalSpine ? true : false
})

function openExportWallpaperEngine() {
    layerStore.add({ name: 'ExportWallpaperView', singleton: true })
}

function openExportMp4() {
    layerStore.add({ name: 'ExportMp4View', singleton: true })
}

function openExportGif() {
    layerStore.add({ name: 'ExportGifView', singleton: true })
}

function exportTo38() {
    if (FennecView?.click?.toSpine38) {
        FennecView.click.toSpine38()
    }
}

function exportJson() {
    if (FennecView?.click?.toSpineJson) {
        FennecView.click.toSpineJson()
    }
}

function saveProject() {
    FennecView.saveProject()
}
</script>

<template>
    <div class="export-panel">
        <div class="ind-btn export-btn" @click="saveProject">
            {{ i18n.t('btnSaveProject') }}
        </div>
        <div 
            id="leftMenu-view-export-to38" 
            class="export-section-38"
            v-show="hasOriginalSpine"
        >
            <div class="ind-btn export-btn" @click="exportTo38">
                {{ i18n.t('btnExport38') }}
            </div>
            <div class="ind-btn export-btn" @click="exportJson">
                {{ i18n.t('btnExportJson') }}
            </div>
        </div>
        <div class="ind-btn export-btn" @click="openExportWallpaperEngine">
            {{ i18n.t('btnExportWallpaper') }}
        </div>
        <div class="ind-btn export-btn" @click="openExportMp4">
            {{ i18n.t('btnExportMp4') }}
        </div>
        <div class="ind-btn export-btn" @click="openExportGif">
            {{ i18n.t('btnExportGif') }}
        </div>
    </div>
</template>

<style scoped>
.export-panel {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.export-section-38 {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 4px;
}

.export-btn {
    width: 100%;
    box-sizing: border-box;
}
</style>
