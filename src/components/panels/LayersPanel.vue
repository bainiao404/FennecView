<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/uiStore'
import { useI18nStore } from '@/stores/i18n'
import LayerList from '@/components/layout/LayerList.vue'

const uiStore = useUIStore()
const i18n = useI18nStore()

const hasLayers = computed(() => {
    return uiStore.layerPanel.sceneFiles.length > 0
})
</script>

<template>
    <div class="layers-panel">
        <div v-if="!hasLayers" class="no-selection">
            {{ i18n.locale === 'zh' ? '场景中无任何实例' : 'No instances in scene' }}
        </div>
        <div v-else class="panel-content">
            <div class="ind-list-box layers-list-container">
                <LayerList :detailed="true" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.layers-panel {
    padding: 10px;
    height: 100%;
    box-sizing: border-box;
}

.no-selection {
    text-align: center;
    color: var(--text-secondary);
    padding: 20px 0;
    font-size: 13px;
}

.panel-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.layers-list-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow-y: auto;
    max-height: calc(100vh - 160px);
}
</style>
