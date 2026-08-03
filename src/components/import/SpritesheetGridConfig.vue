<script setup>
import { ref, computed, watch } from 'vue'
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
const imageFile = computed(() => props.item.associatedFiles?.image || null)
const imageUrl = ref('')

watch(
    imageFile,
    async (file) => {
        if (file) {
            imageUrl.value = await file.getLoadUrl()
        } else {
            imageUrl.value = ''
        }
    },
    { immediate: true }
)

// Control Schemas
const nameSchema = { align: 'left' }
const speedSchema = { min: 10, max: 2000, step: 10, suffix: ' ms' }
const rowsSchema = { min: 1, max: 64, step: 1 }
const colsSchema = { min: 1, max: 64, step: 1 }
</script>

<template>
    <div class="spritesheet-grid-config">
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

        <!-- Rows -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '分割行数 (Rows)' : 'Rows' }}</label>
            <SliderControl 
                :value="config.rows || 1" 
                @change="val => config.rows = val" 
                :schema="rowsSchema" 
            />
        </div>

        <!-- Cols -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '分割列数 (Cols)' : 'Cols' }}</label>
            <SliderControl 
                :value="config.cols || 1" 
                @change="val => config.cols = val" 
                :schema="colsSchema" 
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

        <!-- Interactive Grid Slicing Preview -->
        <div class="form-group preview-section" v-if="imageUrl">
            <label class="form-label">{{ i18n.locale === 'zh' ? '可视化网格预览' : 'Visual Grid Preview' }}</label>
            <div class="preview-container">
                <div class="image-wrapper">
                    <img :src="imageUrl" class="spritesheet-img" />
                    <!-- Grid Lines Overlay -->
                    <div class="grid-overlay">
                        <div 
                            v-for="r in (config.rows || 1) - 1" 
                            :key="'row-'+r" 
                            class="grid-line horizontal"
                            :style="{ top: (r / (config.rows || 1)) * 100 + '%' }"
                        ></div>
                        <div 
                            v-for="c in (config.cols || 1) - 1" 
                            :key="'col-'+c" 
                            class="grid-line vertical"
                            :style="{ left: (c / (config.cols || 1)) * 100 + '%' }"
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.spritesheet-grid-config {
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

.preview-section {
    margin-top: 6px;
}

.preview-container {
    width: 100%;
    border: 1px solid var(--border-color);
    background-color: var(--bg-dark-input);
    border-radius: 4px;
    padding: 10px;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    max-height: 220px;
}

.image-wrapper {
    position: relative;
    max-width: 100%;
    max-height: 200px;
    display: flex;
}

.spritesheet-img {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    pointer-events: none;
}

.grid-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.grid-line {
    position: absolute;
    background-color: rgba(255, 0, 0, 0.65);
}

.grid-line.horizontal {
    left: 0;
    width: 100%;
    height: 1px;
}

.grid-line.vertical {
    top: 0;
    width: 1px;
    height: 100%;
}
</style>
