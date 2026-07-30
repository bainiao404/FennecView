<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/uiStore'
import { useI18nStore } from '@/stores/i18n'
import FennecView from '@/fennec-view/FennecView'
import { blobRegistry } from '@/services/resources/BlobRegistry'

const uiStore = useUIStore()
const i18n = useI18nStore()

const mp4Config = computed(() => uiStore.exportConfig.mp4)

const iconUrl = ref('')
watch(
    () => mp4Config.value.iconArrayBuffer,
    (newVal) => {
        if (iconUrl.value) {
            blobRegistry.revokeURL(iconUrl.value)
            iconUrl.value = ''
        }
        if (newVal) {
            iconUrl.value = blobRegistry.createURL(new Blob([newVal]))
        }
    },
    { immediate: true }
)

onUnmounted(() => {
    if (iconUrl.value) {
        blobRegistry.revokeURL(iconUrl.value)
    }
})

function handleTitleChange(e) {
    uiStore.updateExportConfig('mp4', { title: e.target.value })
}

function handleFpsChange(e) {
    uiStore.updateExportConfig('mp4', { fps: parseFloat(e.target.value) })
}

function handleAutoDurationChange(e) {
    uiStore.updateExportConfig('mp4', { autoDuration: e.target.checked })
}

function handleDurationChange(e) {
    uiStore.updateExportConfig('mp4', { duration: parseFloat(e.target.value) })
}

function selectArea() {
    if (FennecView?.setMp4RecordArea) {
        FennecView.setMp4RecordArea()
    }
}

function startExport() {
    if (FennecView?.startMp4Export) {
        FennecView.startMp4Export()
    }
}
</script>

<template>
    <div class="export-mp4 ind-content">
        <div class="form-container ind-panel">
            <div class="ind-header">{{ i18n.t('exportMp4Tab') }}</div>
            <div class="form-body">
                <div class="form-group">
                    <label class="form-label">{{ i18n.t('fileNameLabel') }}</label>
                    <input 
                        type="text" 
                        class="ind-input-text"
                        :value="mp4Config.title"
                        @input="handleTitleChange"
                    />
                </div>

                <div class="status-section">
                    <div class="icon-preview-box">
                        <img v-if="iconUrl" :src="iconUrl" class="icon-img" />
                        <div v-else class="icon-placeholder">No Area Selected</div>
                    </div>
                    <div class="status-fields">
                        <div class="status-row">
                            <span class="status-label">{{ i18n.t('videoCodecLabel') }}:</span>
                            <span class="status-value font-mono">
                                {{ uiStore.exportMp4Status.codecInfo || i18n.t('videoCodecWaiting') }}
                            </span>
                        </div>
                        <div class="status-row">
                            <span class="status-label">{{ i18n.t('propScale') }} / Size:</span>
                            <span class="status-value font-mono">{{ uiStore.exportMp4Status.sizeInfo }}</span>
                        </div>
                        <div class="status-row">
                            <span class="status-label">{{ i18n.t('videoProgressLabel') }}:</span>
                            <span class="status-value font-mono highlight-text">{{ uiStore.exportMp4Status.progressInfo }}</span>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <div class="label-row">
                        <label class="form-label">{{ i18n.t('videoFpsLabel') }}</label>
                        <span class="value-badge">{{ mp4Config.fps }}</span>
                    </div>
                    <input 
                        class="ind-range"
                        type="range"
                        min="5"
                        max="120"
                        :value="mp4Config.fps"
                        @input="handleFpsChange"
                    />
                </div>

                <div class="form-group">
                    <div class="label-row">
                        <label class="form-label">{{ i18n.t('videoDurationLabel') }}</label>
                        <span v-if="!mp4Config.autoDuration" class="value-badge">{{ mp4Config.duration }}s</span>
                        <span v-else class="value-badge">{{ i18n.t('autoDurationLabel') }}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px; margin-top: 2px;">
                        <label class="ind-checkbox-label" style="display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none; font-size: 13px; color: var(--text-primary);">
                            <input 
                                type="checkbox" 
                                :checked="mp4Config.autoDuration"
                                @change="handleAutoDurationChange"
                            />
                            {{ i18n.t('autoDurationLabel') }}
                        </label>
                        <input 
                            v-if="!mp4Config.autoDuration"
                            class="ind-range"
                            type="range"
                            min="1"
                            max="300"
                            step="1"
                            :value="mp4Config.duration"
                            @input="handleDurationChange"
                            style="flex: 1;"
                        />
                    </div>
                </div>

                <div class="actions-row">
                    <button class="ind-btn action-btn flex-1" @click="selectArea">
                        {{ i18n.t('btnSelectArea') }}
                    </button>
                    <button class="ind-btn action-btn primary-btn flex-1" @click="startExport">
                        {{ i18n.t('btnExportVideo') }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.export-mp4 {
    padding: 20px;
    height: calc(100% - 40px);
    background-color: var(--bg-dark-app);
    display: flex;
    justify-content: center;
    align-items: flex-start;
}

.form-container {
    width: 100%;
    max-width: 500px;
    border-radius: 4px;
    overflow: hidden;
}

.form-body {
    padding: 20px;
    background-color: var(--bg-dark-panel);
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-label {
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: bold;
}

.label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.value-badge {
    font-size: 11px;
    color: var(--text-active);
    background-color: var(--bg-dark-input);
    padding: 1px 6px;
    font-family: monospace;
}

.status-section {
    display: flex;
    gap: 15px;
    background-color: var(--bg-dark-input);
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
}

.icon-preview-box {
    width: 100px;
    height: 80px;
    background-color: var(--bg-dark-panel);
    border: 1px solid var(--border-color);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 2px;
    overflow: hidden;
}

.icon-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.icon-placeholder {
    font-size: 10px;
    color: var(--text-secondary);
    text-align: center;
}

.status-fields {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
}

.status-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
}

.status-label {
    color: var(--text-secondary);
}

.status-value {
    color: var(--text-primary);
}

.font-mono {
    font-family: monospace;
}

.highlight-text {
    color: var(--accent-orange);
    font-weight: bold;
}

.actions-row {
    display: flex;
    gap: 10px;
}

.flex-1 {
    flex: 1;
}

.action-btn {
    padding: 8px 16px;
}

.primary-btn {
    background-color: var(--bg-dark-active);
    color: var(--text-active);
    border-color: var(--bg-dark-active);
}
</style>
