<script setup>
import { useUIStore } from '@/stores/uiStore'
import { useI18nStore } from '@/stores/i18n'
import { useLayerStore } from '@/stores/layerStore'
import FennecView from '@/fennec-view/FennecView'

const uiStore = useUIStore()
const i18n = useI18nStore()
const layerStore = useLayerStore()

function openBatchRename() {
    layerStore.add({ name: 'BatchRenameView', singleton: true })
}

function openSpineConvert() {
    layerStore.add({ name: 'SpineConvertView', singleton: true })
}

function takeScreenshot() {
    if (FennecView?.downloadScreenshotImg) {
        FennecView.downloadScreenshotImg()
    }
}

function resetView() {
    if (FennecView?.resetScale) {
        FennecView.resetScale()
    }
}
</script>

<template>
    <div class="tool-panel">
        <div class="ind-btn tool-btn" @click="openBatchRename">
            {{ i18n.t('toolBatchRename') }}
        </div>
        <div class="ind-btn tool-btn" @click="openSpineConvert">
            {{ i18n.t('toolSpineConvert') }}
        </div>
        <div class="ind-btn tool-btn disabled">
            {{ i18n.t('toolPremultConvert') }}
        </div>
        <div class="ind-btn tool-btn" @click="takeScreenshot">
            {{ i18n.t('toolScreenshot') }}
        </div>
        <div class="ind-btn tool-btn" @click="resetView">
            {{ i18n.t('toolResetView') }}
        </div>
    </div>
</template>

<style scoped>
.tool-panel {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.tool-btn {
    width: 100%;
    box-sizing: border-box;
}

.tool-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>
