<script setup>
import { ref, computed } from 'vue'
import { useI18nStore } from '@/stores/i18n'
import { ioManager } from '@/services/io/IOManager'
import { SpineConvertManager } from '@/fennec-view/spineConvert'
import { MessagePlugin } from 'tdesign-vue-next'

const i18n = useI18nStore()

const sourceDir = ref('')
const destDir = ref('')
const conversionMode = ref('3.8') // '3.8' or 'original'
const copyOtherFiles = ref(true)

const isScanning = ref(false)
const isConverting = ref(false)

const spineFiles = ref([])
const otherFiles = ref([])
const fileStatuses = ref({}) // Map of file.relPath -> { status: 'pending'|'success'|'copied'|'error', details: '' }

import { isCordova, isElectron } from '@/assets/gkd-js-0.2/env.js'

const isSupported = computed(() => {
    return isElectron() || isCordova()
})

async function selectSourceDir() {
    if (!isSupported.value) {
        MessagePlugin.warning(i18n.t('scMsgOnlyClient'));
        return;
    }
    const path = await ioManager.getDriver().pickDirectory({ title: i18n.t('scSelectSourceTitle') });
    if (path) {
        sourceDir.value = path.replace(/\\/g, '/');
        await triggerScan();
    }
}

async function selectDestDir() {
    if (!isSupported.value) {
        MessagePlugin.warning(i18n.t('scMsgOnlyClient'));
        return;
    }
    const path = await ioManager.getDriver().pickDirectory({ title: i18n.t('scSelectDestTitle') });
    if (path) {
        destDir.value = path.replace(/\\/g, '/');
    }
}

async function handleDrop(e) {
    e.preventDefault();
    if (!isSupported.value) {
        MessagePlugin.warning(i18n.t('scMsgOnlyClient'));
        return;
    }
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        sourceDir.value = files[0].path.replace(/\\/g, '/');
        await triggerScan();
    }
}

async function triggerScan() {
    if (!sourceDir.value) return;
    isScanning.value = true;
    spineFiles.value = [];
    otherFiles.value = [];
    fileStatuses.value = {};
    try {
        const { spineFiles: sFiles, otherFiles: oFiles } = await SpineConvertManager.scanDirectory(sourceDir.value);
        spineFiles.value = sFiles;
        otherFiles.value = oFiles;
        
        sFiles.forEach(f => {
            fileStatuses.value[f.relPath] = { status: 'pending', details: i18n.t('scStatusPending') };
        });
        
        if (copyOtherFiles.value) {
            oFiles.forEach(f => {
                fileStatuses.value[f.relPath] = { status: 'pending', details: i18n.t('scStatusPendingCopy') };
            });
        }
        
        MessagePlugin.success(i18n.t('scScanSuccess').replace('{count}', sFiles.length));
    } catch (err) {
        MessagePlugin.error(i18n.t('scScanFailed') + err.message);
    } finally {
        isScanning.value = false;
    }
}

const progressTotal = ref(0)
const progressCompleted = ref(0)
const currentFileProcessing = ref('')

const progressPercent = computed(() => {
    if (progressTotal.value === 0) return 0;
    return Math.round((progressCompleted.value / progressTotal.value) * 100);
})

async function startConversion() {
    if (!sourceDir.value || !destDir.value) {
        MessagePlugin.warning(i18n.t('scMsgMissingPath'));
        return;
    }
    if (spineFiles.value.length === 0) {
        MessagePlugin.warning(i18n.t('scMsgNoSpine'));
        return;
    }

    isConverting.value = true;
    progressCompleted.value = 0;
    progressTotal.value = spineFiles.value.length + (copyOtherFiles.value ? otherFiles.value.length : 0);

    try {
        await SpineConvertManager.convertAndExport({
            sourceDir: sourceDir.value,
            destDir: destDir.value,
            mode: conversionMode.value,
            copyOthers: copyOtherFiles.value,
            spineFiles: spineFiles.value,
            otherFiles: otherFiles.value,
            onProgress: (p) => {
                progressCompleted.value = p.completed;
                currentFileProcessing.value = p.filePath;
                fileStatuses.value[p.filePath] = {
                    status: p.status,
                    details: p.details
                };
            }
        });
        MessagePlugin.success(i18n.t('scMsgSuccess'));
    } catch (err) {
        MessagePlugin.error(i18n.t('scMsgError') + err.message);
    } finally {
        isConverting.value = false;
        currentFileProcessing.value = '';
    }
}
</script>

<template>
    <div class="spine-convert ind-content">
        <div 
            class="convert-container ind-panel"
            @drop="handleDrop"
            @dragover.prevent
        >
            <div class="ind-header">{{ i18n.t('spineConvertTab') }}</div>
            
            <div class="convert-body">
                <!-- Drop / Info Warning -->
                <div v-if="!isSupported" class="alert-warning">
                    {{ i18n.t('scWarning') }}
                </div>
                
                <div class="drop-zone" @click="selectSourceDir">
                    <span class="drop-text">
                        {{ sourceDir ? i18n.t('scSelectedSource') + sourceDir : i18n.t('scDropPrompt') }}
                    </span>
                </div>

                <!-- Path selectors -->
                <div class="path-selectors">
                    <div class="path-row">
                        <label class="path-label">{{ i18n.t('scSourceDir') }}</label>
                        <input type="text" v-model="sourceDir" class="path-input" :placeholder="i18n.t('scSourcePlaceholder')" readonly />
                        <button class="ind-btn action-btn" @click="selectSourceDir" :disabled="isConverting || isScanning">{{ i18n.t('scBrowse') }}</button>
                    </div>
                    <div class="path-row">
                        <label class="path-label">{{ i18n.t('scDestDir') }}</label>
                        <input type="text" v-model="destDir" class="path-input" :placeholder="i18n.t('scDestPlaceholder')" readonly />
                        <button class="ind-btn action-btn" @click="selectDestDir" :disabled="isConverting || isScanning">{{ i18n.t('scBrowse') }}</button>
                    </div>
                </div>

                <!-- Config Options -->
                <div class="config-section">
                    <div class="config-row">
                        <span class="config-label">{{ i18n.t('scExportFormat') }}</span>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" v-model="conversionMode" value="3.8" :disabled="isConverting || isScanning" />
                                {{ i18n.t('scUpgradeTo38') }}
                            </label>
                            <label class="radio-label">
                                <input type="radio" v-model="conversionMode" value="original" :disabled="isConverting || isScanning" />
                                {{ i18n.t('scKeepOriginal') }}
                            </label>
                        </div>
                    </div>
                    
                    <div class="config-row">
                        <span class="config-label">{{ i18n.t('scAdditionalOptions') }}</span>
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="copyOtherFiles" @change="triggerScan" :disabled="isConverting || isScanning" />
                            {{ i18n.t('scCopyOthers') }}
                        </label>
                    </div>
                </div>

                <!-- List/Log Output -->
                <div class="files-list-container ind-list-box">
                    <div class="list-header">
                        <span>{{ i18n.t('scPendingListHeader') }} (Spine &lt; 3.8: {{ spineFiles.length }}, {{ i18n.t('scBadgeOther') }}: {{ otherFiles.length }})</span>
                        <span v-if="isScanning" class="status-scanning">{{ i18n.t('scScanning') }}</span>
                    </div>
                    <div class="list-items scrollbar">
                        <div v-if="spineFiles.length === 0 && otherFiles.length === 0" class="no-files">
                            {{ i18n.t('scNoFiles') }}
                        </div>
                        
                        <!-- Spine Convertible Files -->
                        <div v-for="file in spineFiles" :key="file.relPath" class="file-item">
                            <div class="file-info">
                                <span class="badge-spine">Spine {{ file.version }}</span>
                                <span class="file-name">{{ file.relPath }}</span>
                            </div>
                            <span :class="['status-badge', fileStatuses[file.relPath]?.status]">
                                {{ fileStatuses[file.relPath]?.details || i18n.t('scStatusPending') }}
                            </span>
                        </div>

                        <!-- Other copied files -->
                        <template v-if="copyOtherFiles">
                            <div v-for="file in otherFiles" :key="file.relPath" class="file-item other-file">
                                <div class="file-info">
                                    <span class="badge-other">{{ i18n.t('scBadgeOther') }}</span>
                                    <span class="file-name">{{ file.relPath }}</span>
                                </div>
                                <span :class="['status-badge', fileStatuses[file.relPath]?.status]">
                                    {{ fileStatuses[file.relPath]?.details || i18n.t('scStatusPendingCopy') }}
                                </span>
                            </div>
                        </template>
                    </div>
                </div>

                <!-- Progress and Action Trigger -->
                <div v-if="isConverting" class="progress-container">
                    <div class="progress-bar-outer">
                        <div class="progress-bar-inner" :style="{ width: progressPercent + '%' }"></div>
                    </div>
                    <div class="progress-text">
                        <span>{{ i18n.t('scProcessing') }}{{ progressCompleted }} / {{ progressTotal }} ({{ progressPercent }}%)</span>
                        <span class="curr-file ellipsis">{{ currentFileProcessing }}</span>
                    </div>
                </div>

                <button 
                    class="ind-btn primary-btn convert-start-btn" 
                    @click="startConversion"
                    :disabled="isConverting || isScanning || spineFiles.length === 0 || !destDir"
                >
                    {{ isConverting ? i18n.t('scConverting') : i18n.t('scStartConvert') }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.spine-convert {
    padding: 20px;
    height: calc(100% - 40px);
    background-color: var(--bg-dark-app);
    display: flex;
    justify-content: center;
    align-items: flex-start;
}

.convert-container {
    width: 100%;
    max-width: 700px;
    height: 560px;
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.convert-body {
    padding: 20px;
    background-color: var(--bg-dark-panel);
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
    min-height: 0;
}

.alert-warning {
    background-color: rgba(224, 76, 76, 0.15);
    border: 1px solid rgba(224, 76, 76, 0.4);
    color: #e04c4c;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
}

.drop-zone {
    border: 2px dashed var(--border-light);
    background-color: var(--bg-dark-input);
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 4px;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
    padding: 10px;
    text-align: center;
}

.drop-zone:hover {
    border-color: var(--text-active);
    background-color: rgba(255, 255, 255, 0.02);
}

.drop-text {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.4;
    word-break: break-all;
}

.path-selectors {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.path-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.path-label {
    width: 80px;
    font-size: 13px;
    color: var(--text-secondary);
}

.path-input {
    flex: 1;
    height: 32px;
    background-color: var(--bg-dark-input);
    border: 1px solid var(--border-light);
    color: var(--text-primary);
    padding: 0 10px;
    border-radius: 4px;
    font-size: 12px;
    outline: none;
}

.action-btn {
    height: 32px;
    padding: 0 15px;
    font-size: 12px;
}

.config-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 0;
    border-top: 1px dashed var(--border-light);
    border-bottom: 1px dashed var(--border-light);
}

.config-row {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
}

.config-label {
    width: 80px;
    color: var(--text-secondary);
}

.radio-group {
    display: flex;
    gap: 20px;
}

.radio-label, .checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text-primary);
    cursor: pointer;
}

.files-list-container {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: 10px;
}

.list-header {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--text-secondary);
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border-light);
    margin-bottom: 6px;
}

.status-scanning {
    color: var(--text-active);
}

.list-items {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.no-files {
    text-align: center;
    color: var(--text-secondary);
    padding: 30px 10px;
    font-size: 12px;
}

.file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    background-color: rgba(255, 255, 255, 0.02);
    border-radius: 3px;
    font-size: 12px;
}

.file-item.other-file {
    opacity: 0.75;
}

.file-info {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.file-name {
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.badge-spine {
    background-color: #2196f3;
    color: white;
    padding: 1px 4px;
    border-radius: 2px;
    font-size: 10px;
}

.badge-other {
    background-color: #757575;
    color: white;
    padding: 1px 4px;
    border-radius: 2px;
    font-size: 10px;
}

.status-badge {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 2px;
    color: var(--text-secondary);
}

.status-badge.success, .status-badge.copied {
    color: #4caf50;
    font-weight: bold;
}

.status-badge.error {
    color: #f44336;
    font-weight: bold;
}

.progress-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.progress-bar-outer {
    height: 6px;
    background-color: var(--bg-dark-input);
    border-radius: 3px;
    overflow: hidden;
}

.progress-bar-inner {
    height: 100%;
    background-color: var(--bg-dark-active);
    width: 0%;
    transition: width 0.1s ease;
}

.progress-text {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--text-secondary);
}

.curr-file {
    max-width: 250px;
    text-align: right;
}

.convert-start-btn {
    width: 100%;
    padding: 10px;
    font-weight: bold;
}

.primary-btn {
    background-color: var(--bg-dark-active);
    color: var(--text-active);
    border-color: var(--bg-dark-active);
}

.primary-btn:disabled {
    background-color: var(--bg-dark-input);
    color: var(--text-secondary);
    border-color: var(--border-light);
    cursor: not-allowed;
}

.ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
