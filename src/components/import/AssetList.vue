<script setup>
import { useI18nStore } from '@/stores/i18n'

defineProps({
    items: {
        type: Array,
        required: true
    },
    selectedId: {
        type: [String, Number],
        default: null
    },
    hasMultipleImages: {
        type: Boolean,
        default: false
    }
})

defineEmits(['select', 'remove', 'combine', 'combine-stand'])

const i18n = useI18nStore()
</script>

<template>
    <div class="asset-list-container">
        <div class="panel-section-title list-header-row">
            <span>{{ i18n.locale === 'zh' ? '资源列表' : 'Assets List' }}</span>
            <div class="combine-actions-row" v-if="hasMultipleImages">
                <button
                    class="ind-btn combine-btn"
                    @click="$emit('combine')"
                >
                    {{ i18n.locale === 'zh' ? '合并为动画' : 'Anim' }}
                </button>
                <button
                    class="ind-btn combine-btn"
                    @click="$emit('combine-stand')"
                >
                    {{ i18n.locale === 'zh' ? '合并为立绘差分' : 'Stand' }}
                </button>
            </div>
        </div>
        
        <div class="asset-items scrollbar">
            <div v-if="items.length === 0" class="no-assets">
                {{ i18n.locale === 'zh' ? '暂无资源，请拖入文件或文件夹' : 'No assets. Drag & drop files or folders' }}
            </div>
            
            <div 
                v-for="item in items" 
                :key="item.id" 
                class="asset-item"
                :class="{ 'active': selectedId === item.id }"
                @click="$emit('select', item.id)"
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
                    <button class="delete-btn" @click.stop="$emit('remove', item.id)">
                        ✕
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.asset-list-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
}

.panel-section-title {
    font-size: 13px;
    font-weight: bold;
    color: var(--text-primary);
    margin-bottom: 12px;
    border-left: 3px solid var(--bg-dark-active);
    padding-left: 8px;
}

.list-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    flex-shrink: 0;
}

.combine-actions-row {
    display: flex;
    gap: 6px;
}

.combine-btn {
    font-size: 11px;
    padding: 3px 8px;
    background-color: var(--bg-dark-active);
    color: var(--text-active);
    border-color: var(--bg-dark-active);
}

.combine-btn:hover {
    background-color: var(--bg-dark-hover);
    border-color: var(--border-light);
}

.asset-items {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-right: 4px;
}

.no-assets {
    text-align: center;
    color: var(--text-secondary);
    font-size: 12px;
    padding: 40px 10px;
}

.asset-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: var(--bg-dark-input);
    border: 1px solid var(--border-color);
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.asset-item:hover {
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
    gap: 8px;
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
    gap: 8px;
}

.status-badge {
    font-size: 9px;
    padding: 1px 4px;
    border-radius: 2px;
    color: #fff;
    text-transform: uppercase;
}

.status-badge.complete {
    background-color: #2e7d32;
}

.status-badge.incomplete {
    background-color: #c62828;
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

/* Badge styles for different types */
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

.badge-animated_sprite {
    background-color: #e91e63;
}

.badge-spritesheet_grid {
    background-color: #673ab7;
}

.badge-stand_diff {
    background-color: #009688;
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
