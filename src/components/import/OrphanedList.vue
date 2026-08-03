<script setup>
import { useI18nStore } from '@/stores/i18n'

defineProps({
    files: {
        type: Array,
        required: true
    }
})

defineEmits(['remove'])

const i18n = useI18nStore()
</script>

<template>
    <div class="orphaned-section">
        <div class="panel-section-title orphaned-title">
            {{ i18n.locale === 'zh' ? '未匹配的散落文件' : 'Unassociated Files' }}
            <span class="orphaned-badge font-mono">{{ files.length }}</span>
        </div>
        <div class="orphaned-list scrollbar">
            <div v-for="file in files" :key="file.relativePath" class="orphaned-item font-mono">
                <span class="file-icon">📄</span>
                <span class="file-name ellipsis" :title="file.relativePath">
                    {{ file.relativePath }}
                </span>
                <button class="delete-btn" @click.stop="$emit('remove', file.relativePath)">
                    ✕
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.orphaned-section {
    margin-top: 15px;
    border-top: 1px dashed var(--border-color);
    padding-top: 15px;
    height: 180px;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.panel-section-title {
    font-size: 13px;
    font-weight: bold;
    color: var(--text-primary);
    margin-bottom: 12px;
    border-left: 3px solid var(--bg-dark-active);
    padding-left: 8px;
}

.orphaned-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--text-secondary);
}

.orphaned-badge {
    background-color: var(--border-color);
    color: var(--text-secondary);
    font-size: 10px;
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
    gap: 8px;
    padding: 4px 8px;
    background-color: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 2px;
    font-size: 11px;
}

.file-icon {
    font-size: 12px;
}

.file-name {
    flex: 1;
    color: var(--text-secondary);
}

.delete-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 2px;
    transition: all 0.1s ease;
}

.delete-btn:hover {
    background-color: rgba(255, 255, 255, 0.08);
    color: #ff5252;
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
