<script setup>
import { computed } from 'vue'
import { useI18nStore } from '@/stores/i18n'
import TextControl from '@/components/panels/controls/TextControl.vue'
import SelectControl from '@/components/panels/controls/SelectControl.vue'

const props = defineProps({
    item: {
        type: Object,
        required: true
    }
})

const i18n = useI18nStore()
const config = computed(() => props.item.config)
const files = computed(() => props.item.associatedFiles?.files || [])

// Select options for background selection
const bgOptionsSchema = computed(() => {
    return {
        options: files.value.map(f => ({
            value: f.name,
            label: f.name
        }))
    }
})

// Filter foregrounds
const foregrounds = computed(() => {
    return files.value.filter(f => f.name !== config.value.backgroundName)
})

const nameSchema = { align: 'left' }
</script>

<template>
    <div class="stand-diff-config">
        <!-- Node Name -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '图层/节点名称' : 'Node Name' }}</label>
            <TextControl 
                :value="config.name" 
                @change="val => config.name = val" 
                :schema="nameSchema" 
            />
        </div>

        <!-- Select Background Image -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '选择背景底图' : 'Select Background Image' }}</label>
            <SelectControl 
                :value="config.backgroundName" 
                @change="val => config.backgroundName = val" 
                :schema="bgOptionsSchema" 
            />
        </div>

        <!-- Sequence Foreground Files List -->
        <div class="form-group fg-list-section">
            <label class="form-label">
                {{ i18n.locale === 'zh' ? '前景差分序列' : 'Foreground Layers' }} ({{ foregrounds.length }})
            </label>
            <div class="fg-container scrollbar">
                <div v-for="(fg, idx) in foregrounds" :key="fg.relativePath" class="fg-item font-mono">
                    <span class="fg-index">{{ idx + 1 }}.</span>
                    <span class="fg-name ellipsis" :title="fg.name">{{ fg.name }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.stand-diff-config {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-label {
    font-size: 12px;
    font-weight: bold;
    color: var(--text-secondary);
}

.fg-list-section {
    margin-top: 6px;
}

.fg-container {
    max-height: 160px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    background-color: var(--bg-dark-input);
    border-radius: 3px;
    display: flex;
    flex-direction: column;
}

.fg-item {
    display: flex;
    gap: 8px;
    padding: 5px 8px;
    font-size: 11px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.fg-item:last-child {
    border-bottom: none;
}

.fg-index {
    color: var(--text-secondary);
    width: 20px;
    text-align: right;
}

.fg-name {
    color: var(--text-primary);
    flex: 1;
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
