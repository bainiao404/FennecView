<script setup>
import { computed } from 'vue'
import { useI18nStore } from '@/stores/i18n'

const props = defineProps({
    node: {
        type: Object,
        required: true
    }
})

const i18n = useI18nStore()

const svgCode = computed({
    get() {
        return props.node.svgCode || ''
    },
    set(val) {
        updateProp('svgCode', val)
    }
})

async function updateProp(key, val) {
    const FennecView = (await import('@/fennec-view/FennecView')).default
    if (FennecView?.updateNodeProperty) {
        FennecView.updateNodeProperty(key, val)
    }
}

const PRESETS = [
    {
        name: '圆形 / Circle',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <circle cx="100" cy="100" r="80" fill="#0052d9" stroke="#ffffff" stroke-width="4" />
</svg>`
    },
    {
        name: '星形 / Star',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <polygon points="100,10 40,198 190,78 10,78 160,198" fill="#e37318" stroke="#ffffff" stroke-width="2" />
</svg>`
    },
    {
        name: '徽章 / Shield',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <path d="M100 10 L170 40 V110 C170 150 135 180 100 190 C65 180 30 150 30 110 V40 Z" fill="#0052d9" stroke="#ffffff" stroke-width="6" />
</svg>`
    },
    {
        name: '科技边框 / Tech Frame',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <path d="M20 20 H60 M20 20 V60 M180 20 H140 M180 20 V60 M20 180 H60 M20 180 V140 M180 180 H140 M180 180 V140" stroke="#0052d9" stroke-width="8" fill="none" />
  <rect x="30" y="30" width="140" height="140" fill="rgba(0, 82, 217, 0.1)" stroke="#0052d9" stroke-width="2" />
</svg>`
    }
]

function applyPreset(code) {
    svgCode.value = code
}
</script>

<template>
    <div class="svg-properties-panel">
        <div class="section-divider"></div>
        
        <div class="node-header-row">
            <span class="node-header-title">
                {{ i18n.locale === 'zh' ? 'SVG 矢量代码编辑' : 'SVG Vector Code Editor' }}
            </span>
        </div>

        <div class="svg-presets-container">
            <span class="presets-label">{{ i18n.locale === 'zh' ? '快捷形状预设:' : 'Presets:' }}</span>
            <div class="presets-buttons">
                <button 
                    v-for="preset in PRESETS" 
                    :key="preset.name" 
                    class="preset-btn"
                    @click="applyPreset(preset.code)"
                >
                    {{ preset.name.split(' / ')[i18n.locale === 'zh' ? 0 : 1] }}
                </button>
            </div>
        </div>

        <div class="svg-editor-container">
            <textarea 
                v-model="svgCode" 
                class="svg-textarea font-mono"
                placeholder="<svg>...</svg>"
            ></textarea>
        </div>
    </div>
</template>

<style scoped>
.svg-properties-panel {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.section-divider {
    border-top: 1px dashed var(--border-color);
    margin: 15px 0 10px 0;
}

.svg-presets-container {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
}

.presets-label {
    font-size: 11px;
    color: var(--text-secondary);
}

.presets-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.preset-btn {
    background-color: var(--bg-dark-input);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.15s, border-color 0.15s;
}

.preset-btn:hover {
    background-color: var(--accent-orange);
    border-color: var(--accent-orange);
    color: #fff;
}

.svg-editor-container {
    width: 100%;
}

.svg-textarea {
    width: 100%;
    height: 180px;
    background-color: var(--bg-dark-input);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    font-size: 11px;
    padding: 8px;
    border-radius: 4px;
    resize: vertical;
    outline: none;
    box-sizing: border-box;
}

.svg-textarea:focus {
    border-color: var(--accent-orange);
}
</style>
