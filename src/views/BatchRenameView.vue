<script setup>
import { ref } from 'vue'
import { useI18nStore } from '@/stores/i18n'
import spineBatchRename from '@/fennec-view/batchRename'

const i18n = useI18nStore()
const renameFilesList = ref([])

async function handleDrop(e) {
    e.preventDefault()
    if (spineBatchRename?.loadFilesFromEvent) {
        const files = await spineBatchRename.loadFilesFromEvent(e)
        renameFilesList.value = (files || []).filter(f => f.endName)
    }
}

async function startRename() {
    if (spineBatchRename?.runBatchRename) {
        const files = await spineBatchRename.runBatchRename()
        renameFilesList.value = files || []
    }
}
</script>

<template>
    <div class="batch-rename ind-content">
        <div 
            class="rename-container ind-panel"
            @drop="handleDrop"
            @dragover.prevent
        >
            <div class="ind-header">{{ i18n.t('batchRenameTab') }}</div>
            <div class="rename-body">
                <div class="drop-zone">
                    <span class="drop-text">{{ i18n.t('dragFilesHere') }}</span>
                </div>
                
                <div class="rename-list-box ind-list-box">
                    <div 
                        v-for="(file, idx) in renameFilesList" 
                        :key="idx" 
                        class="rename-item"
                    >
                        <div class="file-path">{{ file.place }}</div>
                        <span class="old-name">{{ file.name }}</span> =>
                        <span class="new-name">{{ file.endName }}</span>
                        <span 
                            v-if="file.status" 
                            class="status-text" 
                            :class="file.status === 'ok' ? 'status-ok' : 'status-err'"
                        >
                             => {{ file.status }}
                        </span>
                    </div>
                </div>
                
                <button class="ind-btn primary-btn rename-start-btn" @click="startRename">
                    {{ i18n.t('btnRenameStart') }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.batch-rename {
    padding: 20px;
    height: calc(100% - 40px);
    background-color: var(--bg-dark-app);
    display: flex;
    justify-content: center;
    align-items: flex-start;
}

.rename-container {
    width: 100%;
    max-width: 600px;
    height: 480px;
    border-radius: 4px;
    overflow: hidden;
}

.rename-body {
    padding: 20px;
    background-color: var(--bg-dark-panel);
    display: flex;
    flex-direction: column;
    gap: 15px;
    flex: 1;
    min-height: 0;
}

.drop-zone {
    border: 2px dashed var(--border-light);
    background-color: var(--bg-dark-input);
    height: 80px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 4px;
}

.drop-text {
    font-size: 13px;
    color: var(--text-secondary);
}

.rename-list-box {
    flex: 1;
    min-height: 0;
    padding: 10px;
    font-family: monospace;
    font-size: 12px;
    overflow-y: auto;
}

.rename-item {
    text-align: left;
    padding: 6px 0;
    border-bottom: 1px dashed var(--border-color, #333333);
}

.file-path {
    font-size: 11px;
    color: var(--text-secondary);
}

.old-name {
    color: #ef4444;
}

.new-name {
    color: #22c55e;
}

.status-text {
    font-weight: bold;
}

.status-text.status-ok {
    color: #ec4899;
}

.status-text.status-err {
    color: #ef4444;
}

.rename-start-btn {
    width: 100%;
    padding: 10px;
    font-weight: bold;
}

.primary-btn {
    background-color: var(--bg-dark-active);
    color: var(--text-active);
    border-color: var(--bg-dark-active);
}
</style>
