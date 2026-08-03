<script setup>
import { computed } from 'vue'
import { useI18nStore } from '@/stores/i18n'
import TextControl from '@/components/panels/controls/TextControl.vue'
import SliderControl from '@/components/panels/controls/SliderControl.vue'
import BooleanControl from '@/components/panels/controls/BooleanControl.vue'

const props = defineProps({
    item: {
        type: Object,
        required: true
    }
})

const i18n = useI18nStore()

const config = computed(() => props.item.config)
const frames = computed(() => props.item.associatedFiles?.frames || [])

// Control Schemas
const nameSchema = { align: 'left' }
const speedSchema = { min: 10, max: 2000, step: 10, suffix: ' ms' }
</script>

<template>
    <div class="animated-sprite-config">
        <!-- Node Name -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '图层/节点名称' : 'Node Name' }}</label>
            <TextControl 
                :value="config.name" 
                @change="val => config.name = val" 
                :schema="nameSchema" 
            />
        </div>

        <!-- Frame Interval in Milliseconds -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '帧间隔 (毫秒)' : 'Frame Interval (ms)' }}</label>
            <SliderControl 
                :value="config.animationSpeed || 100" 
                @change="val => config.animationSpeed = val" 
                :schema="speedSchema" 
            />
        </div>

        <!-- Loop Toggle Option -->
        <div class="form-group">
            <div class="toggle-row">
                <label class="form-label">{{ i18n.locale === 'zh' ? '循环播放' : 'Loop Playback' }}</label>
                <BooleanControl 
                    :value="config.loop" 
                    @change="val => config.loop = val" 
                />
            </div>
        </div>

        <!-- Sequence Frames List -->
        <div class="form-group frames-list-section">
            <label class="form-label">{{ i18n.locale === 'zh' ? '包含帧序列' : 'Sequence Frames' }} ({{ frames.length }})</label>
            <div class="frames-container scrollbar">
                <div v-for="(frame, idx) in frames" :key="frame.relativePath" class="frame-item font-mono">
                    <span class="frame-index">{{ idx + 1 }}.</span>
                    <span class="frame-name ellipsis" :title="frame.name">{{ frame.name }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animated-sprite-config {
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

.toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.frames-list-section {
    margin-top: 6px;
}

.frames-container {
    max-height: 160px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    background-color: var(--bg-dark-input);
    border-radius: 3px;
    display: flex;
    flex-direction: column;
}

.frame-item {
    display: flex;
    gap: 8px;
    padding: 5px 8px;
    font-size: 11px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.frame-item:last-child {
    border-bottom: none;
}

.frame-index {
    color: var(--text-secondary);
    width: 20px;
    text-align: right;
}

.frame-name {
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
