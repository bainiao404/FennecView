<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/uiStore'
import { useI18nStore } from '@/stores/i18n'
import FennecView from '@/fennec-view/FennecView'
import { blobRegistry } from '@/services/resources/BlobRegistry'

const uiStore = useUIStore()
const i18n = useI18nStore()

const gifConfig = computed(() => uiStore.exportConfig.gif)

const iconUrl = ref('')
watch(
    () => gifConfig.value.iconArrayBuffer,
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
    uiStore.updateExportConfig('gif', { title: e.target.value })
}

function handleFpsChange(e) {
    uiStore.updateExportConfig('gif', { fps: parseFloat(e.target.value) })
}

function handleQualityChange(e) {
    uiStore.updateExportConfig('gif', { quality: parseInt(e.target.value, 10) })
}

function handleAutoDurationChange(e) {
    uiStore.updateExportConfig('gif', { autoDuration: e.target.checked })
}

function handleDurationChange(e) {
    uiStore.updateExportConfig('gif', { duration: parseFloat(e.target.value) })
}

function handleTransparentBgChange(e) {
    uiStore.updateExportConfig('gif', { transparentBg: e.target.checked })
}

function selectArea() {
    if (FennecView?.setGifRecordArea) {
        FennecView.setGifRecordArea()
    }
}

function startExport() {
    if (FennecView?.startGifExport) {
        FennecView.startGifExport()
    }
}
</script>

<template>
    <div class="export-gif ind-content">
        <div class="form-container ind-panel">
            <div class="ind-header">{{ i18n.t('exportGifTab') }}</div>
            <div class="form-body">
                <div class="form-group">
                    <label class="form-label">{{ i18n.t('fileNameLabel') }}</label>
                    <input 
                        type="text" 
                        class="ind-input-text"
                        :value="gifConfig.title"
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
                            <span class="status-label">{{ i18n.t('propScale') }} / Size:</span>
                            <span class="status-value font-mono">{{ uiStore.exportGifStatus.sizeInfo }}</span>
                        </div>
                        <div class="status-row">
                            <span class="status-label">{{ i18n.t('videoProgressLabel') }}:</span>
                            <span class="status-value font-mono highlight-text">{{ uiStore.exportGifStatus.progressInfo }}</span>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <div class="label-row">
                        <label class="form-label">GIF FPS</label>
                        <span class="value-badge">{{ gifConfig.fps }}</span>
                    </div>
                    <input 
                        class="ind-range"
                        type="range"
                        min="5"
                        max="60"
                        :value="gifConfig.fps"
                        @input="handleFpsChange"
                    />
                </div>

                <div class="form-group">
                    <div class="label-row">
                        <label class="form-label">GIF Quality (1-20, lower is better)</label>
                        <span class="value-badge">{{ gifConfig.quality }}</span>
                    </div>
                    <input 
                        class="ind-range"
                        type="range"
                        min="1"
                        max="20"
                        step="1"
                        :value="gifConfig.quality"
                        @input="handleQualityChange"
                    />
                </div>

                <div class="form-group">
                    <div class="label-row">
                        <label class="form-label">{{ i18n.t('videoDurationLabel') }}</label>
                        <span v-if="!gifConfig.autoDuration" class="value-badge">{{ gifConfig.duration }}s</span>
                        <span v-else class="value-badge">{{ i18n.t('autoDurationLabel') }}</span>
                    </div>
                    <div class="duration-controls-row">
                        <label class="ind-checkbox-label duration-checkbox-label">
                            <input 
                                type="checkbox" 
                                :checked="gifConfig.autoDuration"
                                @change="handleAutoDurationChange"
                            />
                            {{ i18n.t('autoDurationLabel') }}
                        </label>
                        <input 
                            v-if="!gifConfig.autoDuration"
                            class="ind-range duration-slider"
                            type="range"
                            min="1"
                            max="60"
                            step="1"
                            :value="gifConfig.duration"
                            @input="handleDurationChange"
                        />
                    </div>
                </div>

                <div class="form-group">
                    <div class="transparent-bg-row">
                        <label class="ind-checkbox-label transparent-checkbox-label">
                            <input 
                                type="checkbox" 
                                :checked="gifConfig.transparentBg"
                                @change="handleTransparentBgChange"
                            />
                            {{ i18n.t('transparentBgLabel') }}
                        </label>
                    </div>
                </div>

                <div class="actions-row">
                    <button class="ind-btn action-btn flex-1" @click="selectArea">
                        {{ i18n.t('btnSelectArea') }}
                    </button>
                    <button class="ind-btn action-btn primary-btn flex-1" @click="startExport">
                        {{ i18n.t('btnExportGif') }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.export-gif {
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

.duration-controls-row,
.transparent-bg-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 2px;
}

.duration-checkbox-label,
.transparent-checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    user-select: none;
    font-size: 13px;
    color: var(--text-primary);
}

.duration-slider {
    flex: 1;
}
</style>
