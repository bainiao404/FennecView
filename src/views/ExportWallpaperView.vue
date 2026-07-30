<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/uiStore'
import { useI18nStore } from '@/stores/i18n'
import FennecView from '@/fennec-view/FennecView'
import { blobRegistry } from '@/services/resources/BlobRegistry'

const uiStore = useUIStore()
const i18n = useI18nStore()

const wallpaperConfig = computed(() => uiStore.exportConfig.wallpaperEngine)

const iconUrl = ref('')
watch(
    () => wallpaperConfig.value.iconArrayBuffer,
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
    uiStore.updateExportConfig('wallpaperEngine', { title: e.target.value })
}

function handleFpsChange(e) {
    uiStore.updateExportConfig('wallpaperEngine', { fps: parseFloat(e.target.value) })
}

function handleResolutionChange(e) {
    uiStore.updateExportConfig('wallpaperEngine', { resolution: parseFloat(e.target.value) })
}

function captureIcon() {
    if (FennecView?.setExportWallpaperEngineIcon) {
        FennecView.setExportWallpaperEngineIcon()
    }
}

function selectDisplayRect() {
    if (FennecView?.setExportWallpaperEngineRect) {
        FennecView.setExportWallpaperEngineRect()
    }
}

function clearDisplayRect() {
    if (FennecView?.clearExportWallpaperEngineRect) {
        FennecView.clearExportWallpaperEngineRect()
    }
}

function startExport() {
    if (FennecView?.exportWallpaperEngine) {
        FennecView.exportWallpaperEngine()
    }
}
</script>

<template>
    <div class="export-wallpaper ind-content">
        <div class="form-container ind-panel">
            <div class="ind-header">{{ i18n.t('exportWallpaperTab') }}</div>
            <div class="form-body">
                <div class="form-group">
                    <label class="form-label">{{ i18n.t('fileNameLabel') }}</label>
                    <input 
                        type="text" 
                        class="ind-input-text"
                        :value="wallpaperConfig.title"
                        @input="handleTitleChange"
                    />
                </div>

                <div class="form-group">
                    <label class="form-label">{{ i18n.t('wallpaperRectLabel') }}</label>
                    <div class="rect-controls">
                        <span class="rect-status-text">
                            {{ wallpaperConfig.rect ? `${i18n.t('rectCustom')}: X:${Math.round(wallpaperConfig.rect.x)} Y:${Math.round(wallpaperConfig.rect.y)} W:${Math.round(wallpaperConfig.rect.width)} H:${Math.round(wallpaperConfig.rect.height)}` : i18n.t('rectAutoFit') }}
                        </span>
                        <div class="rect-btn-group">
                            <button class="ind-btn action-btn small-btn" @click="selectDisplayRect">
                                {{ i18n.t('btnSelectRect') }}
                            </button>
                            <button v-if="wallpaperConfig.rect" class="ind-btn action-btn small-btn danger-btn" @click="clearDisplayRect">
                                {{ i18n.t('btnClearRect') }}
                            </button>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <div class="label-row">
                        <label class="form-label">{{ i18n.t('wallpaperFpsLabel') }}</label>
                        <span class="value-badge">{{ wallpaperConfig.fps }}</span>
                    </div>
                    <input 
                        class="ind-range"
                        type="range"
                        min="5"
                        max="120"
                        :value="wallpaperConfig.fps"
                        @input="handleFpsChange"
                    />
                </div>

                <div class="form-group">
                    <div class="label-row">
                        <label class="form-label">{{ i18n.t('renderScaleLabel') }}</label>
                        <span class="value-badge">{{ wallpaperConfig.resolution }}x</span>
                    </div>
                    <input 
                        class="ind-range"
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        :value="wallpaperConfig.resolution"
                        @input="handleResolutionChange"
                    />
                </div>

                <div class="icon-section">
                    <div class="icon-preview-box">
                        <img v-if="iconUrl" :src="iconUrl" class="icon-img" />
                        <div v-else class="icon-placeholder">No Icon</div>
                    </div>
                    <div class="actions-col">
                        <button class="ind-btn action-btn" @click="captureIcon">
                            {{ i18n.t('btnCaptureIcon') }}
                        </button>
                        <button class="ind-btn action-btn primary-btn" @click="startExport">
                            {{ i18n.t('btnStartExport') }}
                        </button>
                    </div>
                </div>

                <div class="form-note">
                    {{ i18n.t('wallpaperNote') }}
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.export-wallpaper {
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

.icon-section {
    display: flex;
    gap: 15px;
    margin-top: 5px;
}

.icon-preview-box {
    width: 96px;
    height: 96px;
    background-color: var(--bg-dark-input);
    border: 1px solid var(--border-color);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 4px;
    overflow: hidden;
}

.icon-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.icon-placeholder {
    font-size: 11px;
    color: var(--text-secondary);
}

.actions-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
}

.action-btn {
    width: 100%;
}

.primary-btn {
    background-color: var(--bg-dark-active);
    color: var(--text-active);
    border-color: var(--bg-dark-active);
}

.form-note {
    font-size: 11px;
    color: var(--text-secondary);
    line-height: 1.5;
    border-top: 1px solid var(--border-color);
    padding-top: 10px;
}

.rect-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: var(--bg-dark-input);
    padding: 10px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
}

.rect-status-text {
    font-size: 12px;
    color: var(--text-active);
    font-family: monospace;
}

.rect-btn-group {
    display: flex;
    gap: 10px;
}

.small-btn {
    padding: 4px 8px;
    font-size: 12px;
    height: auto;
    width: auto;
}

.danger-btn {
    background-color: #662222;
    color: #ff9999;
    border-color: #aa4444;
}
.danger-btn:hover {
    background-color: #882222;
    border-color: #cc4444;
}
</style>
