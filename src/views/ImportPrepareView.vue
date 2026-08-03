<script setup>
import { ref, computed } from 'vue'
import { useImportStore } from '@/stores/importStore'
import { useLayerStore } from '@/stores/layerStore'
import { useI18nStore } from '@/stores/i18n'
import { FileScanner } from '@/services/import/utils/fileScanner'

import AssetList from '@/components/import/AssetList.vue'
import OrphanedList from '@/components/import/OrphanedList.vue'
import AssetConfigContainer from '@/components/import/AssetConfigContainer.vue'

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

const hasCompleteItems = computed(() => {
    return importStore.importItems.some(item => item.status === 'complete')
})

const totalComplete = computed(() => {
    return importStore.importItems.filter(item => item.status === 'complete').length
})

const totalIncomplete = computed(() => {
    return importStore.importItems.filter(item => item.status === 'incomplete').length
})

const hasMultipleImages = computed(() => {
    return importStore.importItems.filter(item => item.type === 'image').length >= 2
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
                    
                    <!-- Left Column: Asset Items List & Orphans -->
                    <div class="asset-list-panel">
                        <AssetList 
                            :items="importStore.importItems"
                            :selected-id="selectedItemId"
                            :has-multiple-images="hasMultipleImages"
                            @select="selectItem"
                            @remove="importStore.removeItem"
                            @combine="importStore.combineImagesToAnimatedSprite"
                            @combine-stand="importStore.combineImagesToStandDiff"
                        />
                        
                        <!-- Unused/Orphaned files -->
                        <OrphanedList 
                            v-if="importStore.orphanedFiles.length > 0"
                            :files="importStore.orphanedFiles"
                            @remove="importStore.removeFile"
                        />
                    </div>
                    
                    <!-- Right Column: Detail & Config Panel -->
                    <AssetConfigContainer 
                        :item="selectedItem"
                    />
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
    font-size: 11px;
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
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 15px;
    background-color: var(--bg-dark-panel);
    min-height: 0;
}

.prepare-layout {
    flex: 1;
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 20px;
    min-height: 0;
}

.asset-list-panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.prepare-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid var(--border-color);
    flex-shrink: 0;
}

.cancel-btn {
    min-width: 80px;
}

.import-btn {
    min-width: 150px;
}
</style>
