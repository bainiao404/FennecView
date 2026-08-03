<script setup>
import { computed } from 'vue'
import { useI18nStore } from '@/stores/i18n'
import { getConfigComponent } from './ConfigRegistry'

const props = defineProps({
    item: {
        type: Object,
        default: null
    }
})

const i18n = useI18nStore()

const configComponent = computed(() => {
    if (!props.item) return null
    return getConfigComponent(props.item.type)
})
</script>

<template>
    <div class="config-panel">
        <div class="panel-section-title">
            {{ i18n.locale === 'zh' ? '参数配置' : 'Configuration' }}
        </div>
        
        <div class="config-content scrollbar">
            <!-- No Selection Guide -->
            <div v-if="!item" class="no-selection">
                <div class="guide-icon">📥</div>
                <div class="guide-text">
                    {{ i18n.locale === 'zh' ? '选择左侧的资源以配置导入参数。' : 'Select an asset from the list to configure.' }}
                </div>
                <div class="guide-sub">
                    {{ i18n.locale === 'zh' ? '如有不完整的资源，可在此窗口继续拖入所需的文件（如 .atlas 或 .png）进行自动补全。' : 'You can drag & drop missing files (e.g. .atlas or .png) directly to satisfy incomplete assets.' }}
                </div>
            </div>
            
            <!-- Asset Config Form -->
            <div v-else class="config-details">
                <div class="config-type-header">
                    <span class="config-name-title font-mono">{{ item.name }}</span>
                    <span class="badge" :class="'badge-' + item.type">{{ item.type }}</span>
                </div>
                
                <hr class="divider" />
                
                <!-- Dynamically resolved child config component -->
                <component 
                    :is="configComponent" 
                    :item="item"
                />

                <!-- Drop files overlay for missing files -->
                <div v-if="item.status === 'incomplete'" class="dependency-dropzone">
                    <div class="dropzone-icon">➕</div>
                    <div class="dropzone-text">
                        {{ i18n.locale === 'zh' ? '拖拽缺失的文件到此窗口以补全该资源' : 'Drag missing files here to complete' }}
                    </div>
                    <ul class="missing-list font-mono">
                        <li v-for="m in item.missingFiles" :key="m.name" class="missing-item">
                            - {{ m.name }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.config-panel {
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
    flex-shrink: 0;
}

.config-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;
}

.no-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
}

.guide-icon {
    font-size: 36px;
    margin-bottom: 16px;
    opacity: 0.8;
}

.guide-text {
    font-size: 14px;
    color: var(--text-primary);
    margin-bottom: 8px;
    font-weight: bold;
}

.guide-sub {
    font-size: 12px;
    color: var(--text-secondary);
    max-width: 280px;
    line-height: 1.5;
}

.config-details {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.config-type-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.02);
    padding: 8px 12px;
    border-radius: 3px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.config-name-title {
    font-size: 13px;
    font-weight: bold;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 260px;
}

.divider {
    border: none;
    border-top: 1px solid var(--border-color);
    margin: 5px 0;
}

.dependency-dropzone {
    margin-top: 15px;
    border: 2px dashed rgba(229, 57, 53, 0.4);
    background-color: rgba(229, 57, 53, 0.02);
    border-radius: 4px;
    padding: 15px;
    text-align: center;
    transition: all 0.2s ease;
}

.dropzone-icon {
    font-size: 24px;
    margin-bottom: 8px;
}

.dropzone-text {
    font-size: 12px;
    color: #ef5350;
    margin-bottom: 10px;
    font-weight: bold;
}

.missing-list {
    list-style: none;
    padding: 0;
    margin: 0;
    text-align: left;
    display: inline-block;
}

.missing-item {
    font-size: 11px;
    color: #ef5350;
    margin-bottom: 4px;
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
