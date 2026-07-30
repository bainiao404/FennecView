<script setup>
import { useI18nStore } from '@/stores/i18n'
import spineBatchRename from '@/fennec-view/batchRename'

const i18n = useI18nStore()

function handleDrop(e) {
    e.preventDefault()
    if (spineBatchRename?.loadFilesFromEvent) {
        spineBatchRename.loadFilesFromEvent(e)
    }
}

function startRename() {
    if (spineBatchRename?.runBatchRename) {
        spineBatchRename.runBatchRename()
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
                
                <!-- ID is required by script/batchRename.js -->
                <div id="toolView-batchRename-list" class="rename-list-box ind-list-box"></div>
                
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
