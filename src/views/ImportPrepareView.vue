<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useImportStore } from '@/stores/importStore'
import { useLayerStore } from '@/stores/layerStore'
import { useI18nStore } from '@/stores/i18n'
import { FileScanner } from '@/services/import/utils/fileScanner'

import SpineConfig from '@/components/import/SpineConfig.vue'
import Live2dConfig from '@/components/import/Live2dConfig.vue'
import SpritesheetConfig from '@/components/import/SpritesheetConfig.vue'
import MediaConfig from '@/components/import/MediaConfig.vue'

const importStore = useImportStore()
const layerStore = useLayerStore()
const i18n = useI18nStore()

const selectedItemId = ref(null)

const selectedItem = computed(() => {
    return importStore.importItems.find(item => item.id === selectedItemId.value) || null
})

// Auto-select first item if none selected
const activeItems = computed(() => importStore.importItems)
if (activeItems.value.length > 0) {
    selectedItemId.value = activeItems.value[0].id
}

function selectItem(id) {
    selectedItemId.value = id
}

function cancel() {
    importStore.clear()
    layerStore.back()
}

async function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    
    const files = await FileScanner.scanDrop(e.dataTransfer)
    if (files.length > 0) {
        await importStore.addFiles(files)
        // Keep selection if it still exists, otherwise select first
        if (selectedItemId.value && !importStore.importItems.some(i => i.id === selectedItemId.value)) {
            selectedItemId.value = importStore.importItems[0]?.id || null
        } else if (!selectedItemId.value && importStore.importItems.length > 0) {
            selectedItemId.value = importStore.importItems[0].id
        }
    }
}

// Clean up files pool if we leave this screen
onUnmounted(() => {
    // Keep the store state unless we intentionally cancel/import,
    // but if the layer is destroyed, we make sure it resets.
})

const hasCompleteItems = computed(() => {
    return importStore.importItems.some(item => item.status === 'complete')
})

const totalComplete = computed(() => {
    return importStore.importItems.filter(item => item.status === 'complete').length
})

const totalIncomplete = computed(() => {
    return importStore.importItems.filter(item => item.status === 'incomplete').length
})
</script>

<template>
    <div 
        class="import-prepare ind-content"
        @drop="handleDrop"
        @dragover.prevent
    >
        <div class="prepare-container ind-panel">
            <div class="ind-header prepare-header">
                <span>{{ i18n.locale === 'zh' ? '资源导入准备与完整性校验' : 'Resource Import Preparation & Integrity Check' }}</span>
                <span class="header-stats font-mono">
                    {{ i18n.locale === 'zh' ? '待导入:' : 'Pending:' }} 
                    <span class="success-text">{{ totalComplete }}</span> {{ i18n.locale === 'zh' ? '完整' : 'Complete' }} / 
                    <span class="error-text">{{ totalIncomplete }}</span> {{ i18n.locale === 'zh' ? '不完整' : 'Incomplete' }}
                </span>
            </div>
            
            <div class="prepare-body">
                <!-- Dual Column Layout -->
                <div class="prepare-layout">
                    
                    <!-- Left Column: Asset Items List -->
                    <div class="asset-list-panel">
                        <div class="panel-section-title">
                            {{ i18n.locale === 'zh' ? '资源列表' : 'Assets List' }}
                        </div>
                        
                        <div class="asset-items scrollbar">
                            <div v-if="importStore.importItems.length === 0" class="no-assets">
                                {{ i18n.locale === 'zh' ? '暂无资源，请拖入文件或文件夹' : 'No assets. Drag & drop files or folders' }}
                            </div>
                            
                            <div 
                                v-for="item in importStore.importItems" 
                                :key="item.id" 
                                class="asset-item"
                                :class="{ 'active': selectedItemId === item.id }"
                                @click="selectItem(item.id)"
                            >
                                <div class="asset-item-info">
                                    <span class="badge" :class="'badge-' + item.type">
                                        {{ item.type }}
                                    </span>
                                    <span class="asset-name ellipsis font-mono" :title="item.name">
                                        {{ item.name }}
                                    </span>
                                </div>
                                <div class="asset-item-actions">
                                    <span class="status-badge" :class="item.status">
                                        {{ item.status === 'complete' ? (i18n.locale === 'zh' ? '完整' : 'Ready') : (i18n.locale === 'zh' ? '不完整' : 'Incomplete') }}
                                    </span>
                                    <button class="delete-btn" @click.stop="importStore.removeItem(item.id)">
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Unused/Orphaned files -->
                        <div class="orphaned-section" v-if="importStore.orphanedFiles.length > 0">
                            <div class="panel-section-title orphaned-title">
                                {{ i18n.locale === 'zh' ? '未匹配的散落文件' : 'Unassociated Files' }}
                                <span class="orphaned-badge font-mono">{{ importStore.orphanedFiles.length }}</span>
                            </div>
                            <div class="orphaned-list scrollbar">
                                <div v-for="file in importStore.orphanedFiles" :key="file.relativePath" class="orphaned-item font-mono">
                                    <span class="file-icon">📄</span>
                                    <span class="file-name ellipsis" :title="file.relativePath">
                                        {{ file.relativePath }}
                                    </span>
                                    <button class="delete-btn" @click.stop="importStore.removeFile(file.relativePath)">
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right Column: Detail & Config Panel -->
                    <div class="config-panel">
                        <div class="panel-section-title">
                            {{ i18n.locale === 'zh' ? '参数配置' : 'Configuration' }}
                        </div>
                        
                        <div class="config-content scrollbar">
                            <div v-if="!selectedItem" class="no-selection">
                                <div class="guide-icon">📥</div>
                                <div class="guide-text">
                                    {{ i18n.locale === 'zh' ? '选择左侧的资源以配置导入参数。' : 'Select an asset from the list to configure.' }}
                                </div>
                                <div class="guide-sub">
                                    {{ i18n.locale === 'zh' ? '如有不完整的资源，可在此窗口继续拖入所需的文件（如 .atlas 或 .png）进行自动补全。' : 'You can drag & drop missing files (e.g. .atlas or .png) directly to satisfy incomplete assets.' }}
                                </div>
                            </div>
                            
                            <div v-else class="config-details">
                                <div class="config-type-header">
                                    <span class="config-name-title font-mono">{{ selectedItem.name }}</span>
                                    <span class="badge" :class="'badge-' + selectedItem.type">{{ selectedItem.type }}</span>
                                </div>
                                
                                <hr class="divider" />
                                
                                <!-- Dynamic Component Config based on type -->
                                <component 
                                    :is="selectedItem.type === 'spine' ? SpineConfig :
                                         selectedItem.type === 'live2d' ? Live2dConfig :
                                         selectedItem.type === 'spritesheet' ? SpritesheetConfig : MediaConfig" 
                                    :item="selectedItem"
                                />

                                <!-- Drop files overlay for missing files -->
                                <div v-if="selectedItem.status === 'incomplete'" class="dependency-dropzone">
                                    <div class="dropzone-icon">➕</div>
                                    <div class="dropzone-text">
                                        {{ i18n.locale === 'zh' ? '拖拽缺失的文件到此窗口以补全该资源' : 'Drag missing files here to complete' }}
                                    </div>
                                    <ul class="missing-list font-mono">
                                        <li v-for="m in selectedItem.missingFiles" :key="m.name" class="missing-item">
                                            - {{ m.name }}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Action Buttons Footer -->
                <div class="prepare-actions">
                    <button class="ind-btn cancel-btn" @click="cancel">
                        {{ i18n.locale === 'zh' ? '取消导入' : 'Cancel' }}
                    </button>
                    <button 
                        class="ind-btn primary-btn import-btn" 
                        :disabled="!hasCompleteItems || importStore.isProcessing"
                        @click="importStore.importAllComplete"
                    >
                        {{ i18n.locale === 'zh' ? '导入全部完整资源' : 'Import Complete Assets' }}
                        <span v-if="totalComplete > 0">({{ totalComplete }})</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.import-prepare {
    padding: 20px;
    height: calc(100% - 40px);
    background-color: var(--bg-dark-app);
    display: flex;
    justify-content: center;
    align-items: flex-start;
}

.prepare-container {
    width: 100%;
    max-width: 960px;
    height: 600px;
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.prepare-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-stats {
    font-size: 12px;
    color: var(--text-secondary);
}

.success-text {
    color: #4caf50;
    font-weight: bold;
}

.error-text {
    color: #f44336;
    font-weight: bold;
}

.prepare-body {
    padding: 16px;
    background-color: var(--bg-dark-panel);
    display: flex;
    flex-direction: column;
    gap: 16px;
    flex: 1;
    min-height: 0;
}

.prepare-layout {
    display: flex;
    gap: 20px;
    flex: 1;
    min-height: 0;
}

/* Dual Column Layout Sizes */
.asset-list-panel {
    flex: 1.2;
    display: flex;
    flex-direction: column;
    min-width: 0;
    border-right: 1px solid var(--border-color);
    padding-right: 20px;
}

.config-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.panel-section-title {
    font-size: 13px;
    font-weight: bold;
    color: var(--text-active);
    margin-bottom: 10px;
}

.asset-items {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-right: 4px;
}

.no-assets {
    text-align: center;
    color: var(--text-secondary);
    padding: 40px 10px;
    font-size: 12px;
    border: 1px dashed var(--border-color);
    border-radius: 4px;
}

.asset-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: var(--bg-dark-input);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.asset-item:hover {
    background-color: var(--bg-dark-hover);
    border-color: var(--border-light);
}

.asset-item.active {
    background-color: var(--bg-dark-active);
    border-color: var(--bg-dark-active);
}

.asset-item.active .asset-name {
    color: var(--text-active);
}

.asset-item-info {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
}

.asset-name {
    font-size: 12px;
    color: var(--text-primary);
}

.asset-item-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.status-badge {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 2px;
    font-weight: bold;
    color: #fff;
}

.status-badge.complete {
    background-color: #059669;
}

.status-badge.incomplete {
    background-color: #dc2626;
}

.delete-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 2px;
}

.delete-btn:hover {
    color: #f44336;
    background-color: rgba(244, 67, 54, 0.1);
}

.asset-item.active .delete-btn {
    color: rgba(255, 255, 255, 0.7);
}

.asset-item.active .delete-btn:hover {
    color: #fff;
    background-color: rgba(255, 255, 255, 0.2);
}

/* Orphaned Section */
.orphaned-section {
    margin-top: 14px;
    border-top: 1px dashed var(--border-color);
    padding-top: 12px;
    display: flex;
    flex-direction: column;
    max-height: 160px;
}

.orphaned-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.orphaned-badge {
    font-size: 10px;
    background-color: #374151;
    color: var(--text-secondary);
    padding: 1px 5px;
    border-radius: 10px;
}

.orphaned-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.orphaned-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    background-color: rgba(255, 255, 255, 0.02);
    border-radius: 3px;
    font-size: 11px;
}

.file-icon {
    margin-right: 6px;
}

.file-name {
    flex: 1;
    min-width: 0;
    color: var(--text-secondary);
}

/* Right Column details */
.config-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;
}

.no-selection {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 40px 20px;
    text-align: center;
    color: var(--text-secondary);
    border: 1px dashed var(--border-color);
    border-radius: 4px;
}

.guide-icon {
    font-size: 40px;
    margin-bottom: 12px;
}

.guide-text {
    font-size: 13px;
    font-weight: bold;
    color: var(--text-primary);
    margin-bottom: 8px;
}

.guide-sub {
    font-size: 11px;
    line-height: 1.4;
    max-width: 320px;
}

.config-details {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.config-type-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.config-name-title {
    font-size: 14px;
    font-weight: bold;
    color: var(--text-active);
}

.divider {
    border: none;
    border-top: 1px solid var(--border-color);
    margin: 4px 0 8px 0;
}

.dependency-dropzone {
    margin-top: 16px;
    border: 2px dashed rgba(224, 76, 76, 0.4);
    background-color: rgba(224, 76, 76, 0.03);
    border-radius: 6px;
    padding: 16px;
    text-align: center;
}

.dropzone-icon {
    font-size: 24px;
    margin-bottom: 8px;
    color: #ef4444;
}

.dropzone-text {
    font-size: 12px;
    font-weight: bold;
    color: var(--text-primary);
    margin-bottom: 10px;
}

.missing-list {
    text-align: left;
    display: inline-block;
    padding: 0;
    margin: 0;
    list-style: none;
}

.missing-item {
    font-size: 11px;
    color: #ef4444;
}

/* Action Buttons Footer */
.prepare-actions {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid var(--border-color);
    padding-top: 14px;
}

.cancel-btn {
    padding: 10px 24px;
}

.import-btn {
    padding: 10px 24px;
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
    border-color: var(--border-color);
    cursor: not-allowed;
}

.badge {
    font-size: 9px;
    font-weight: bold;
    padding: 1px 5px;
    border-radius: 2px;
    color: #fff;
    text-transform: uppercase;
}

.badge-spine {
    background-color: #2196f3;
}

.badge-live2d {
    background-color: #00bcd4;
}

.badge-spritesheet {
    background-color: #9c27b0;
}

.badge-image {
    background-color: #4caf50;
}

.badge-video {
    background-color: #ff9800;
}

.ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.scrollbar::-webkit-scrollbar {
    width: 4px;
    height: 4px;
}
</style>
