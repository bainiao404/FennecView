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

const activeFgKey = computed({
    get() {
        return props.node.activeFgKey || ''
    },
    set(val) {
        updateProp('activeFgKey', val)
    }
})

const bgAnchorPreset = computed({
    get() {
        return props.node.bgAnchorPreset || 'custom'
    },
    set(val) {
        updateProp('bgAnchorPreset', val)
    }
})

const fgAnchorPreset = computed({
    get() {
        return props.node.fgAnchorPreset || 'custom'
    },
    set(val) {
        updateProp('fgAnchorPreset', val)
    }
})

const bgAnchorX = computed({
    get() {
        return props.node.bgAnchorX !== undefined ? props.node.bgAnchorX : 0
    },
    set(val) {
        updateProp('bgAnchorX', Number(val))
    }
})

const bgAnchorY = computed({
    get() {
        return props.node.bgAnchorY !== undefined ? props.node.bgAnchorY : 0
    },
    set(val) {
        updateProp('bgAnchorY', Number(val))
    }
})

const fgAnchorX = computed({
    get() {
        return props.node.fgAnchorX !== undefined ? props.node.fgAnchorX : 0
    },
    set(val) {
        updateProp('fgAnchorX', Number(val))
    }
})

const fgAnchorY = computed({
    get() {
        return props.node.fgAnchorY !== undefined ? props.node.fgAnchorY : 0
    },
    set(val) {
        updateProp('fgAnchorY', Number(val))
    }
})

const defaultFgX = computed({
    get() {
        return props.node.defaultFgX !== undefined ? props.node.defaultFgX : 0
    },
    set(val) {
        updateProp('defaultFgX', Number(val))
    }
})

const defaultFgY = computed({
    get() {
        return props.node.defaultFgY !== undefined ? props.node.defaultFgY : 0
    },
    set(val) {
        updateProp('defaultFgY', Number(val))
    }
})

const foregroundsList = computed(() => {
    return props.node.fgList || []
})

async function updateProp(key, val) {
    const FennecView = (await import('@/fennec-view/FennecView')).default
    if (FennecView?.updateNodeProperty) {
        FennecView.updateNodeProperty(key, val)
        if (['activeFgKey', 'bgAnchorPreset', 'fgAnchorPreset'].includes(key)) {
            FennecView.refreshPropertyPanel()
        }
    }
}

async function handleFgOffsetChange(name, x, y) {
    const FennecView = (await import('@/fennec-view/FennecView')).default
    if (FennecView?.updateNodeProperty) {
        const parsedX = (x === '' || x === null || x === undefined) ? '' : Number(x)
        const parsedY = (y === '' || y === null || y === undefined) ? '' : Number(y)
        FennecView.updateNodeProperty('fgOffset', [name, parsedX, parsedY])
    }
}
</script>

<template>
    <div class="stand-diff-section">
        <div class="section-divider"></div>
        <div class="node-header-row">
            <span class="node-header-title">
                {{ i18n.locale === 'zh' ? '立绘差分设置' : 'Stand Diff Settings' }}
            </span>
        </div>

        <!-- Active Foreground Dropdown -->
        <div class="attribute-row">
            <span class="attr-key">{{ i18n.locale === 'zh' ? '显示前景' : 'Visible FG' }}</span>
            <div class="attr-input-wrapper">
                <select v-model="activeFgKey" class="attr-select">
                    <option v-for="fg in foregroundsList" :key="fg.name" :value="fg.name">
                        {{ fg.name }}
                    </option>
                </select>
            </div>
        </div>

        <!-- Background Anchor Preset -->
        <div class="attribute-row">
            <span class="attr-key">{{ i18n.locale === 'zh' ? '背景锚点预设' : 'BG Anchor Preset' }}</span>
            <div class="attr-input-wrapper">
                <select v-model="bgAnchorPreset" class="attr-select">
                    <option value="custom">{{ i18n.locale === 'zh' ? '自定义' : 'Custom' }}</option>
                    <option value="h-center">{{ i18n.locale === 'zh' ? '水平居中' : 'Horiz. Center' }}</option>
                    <option value="v-center">{{ i18n.locale === 'zh' ? '垂直居中' : 'Vert. Center' }}</option>
                    <option value="both">{{ i18n.locale === 'zh' ? '双向居中' : 'Both Center' }}</option>
                </select>
            </div>
        </div>

        <!-- Background Custom Anchor X / Y -->
        <div class="attribute-row" :class="{ 'disabled-row': bgAnchorPreset !== 'custom' }">
            <span class="attr-key">背景锚点 X</span>
            <div class="attr-input-wrapper">
                <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    v-model.number="bgAnchorX"
                    :disabled="bgAnchorPreset !== 'custom'"
                    class="attr-input"
                />
            </div>
        </div>
        <div class="attribute-row" :class="{ 'disabled-row': bgAnchorPreset !== 'custom' }">
            <span class="attr-key">背景锚点 Y</span>
            <div class="attr-input-wrapper">
                <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    v-model.number="bgAnchorY"
                    :disabled="bgAnchorPreset !== 'custom'"
                    class="attr-input"
                />
            </div>
        </div>

        <!-- Foreground Anchor Preset -->
        <div class="attribute-row">
            <span class="attr-key">{{ i18n.locale === 'zh' ? '前景锚点预设' : 'FG Anchor Preset' }}</span>
            <div class="attr-input-wrapper">
                <select v-model="fgAnchorPreset" class="attr-select">
                    <option value="custom">{{ i18n.locale === 'zh' ? '自定义' : 'Custom' }}</option>
                    <option value="h-center">{{ i18n.locale === 'zh' ? '水平居中' : 'Horiz. Center' }}</option>
                    <option value="v-center">{{ i18n.locale === 'zh' ? '垂直居中' : 'Vert. Center' }}</option>
                    <option value="both">{{ i18n.locale === 'zh' ? '双向居中' : 'Both Center' }}</option>
                </select>
            </div>
        </div>

        <!-- Foreground Custom Anchor X / Y -->
        <div class="attribute-row" :class="{ 'disabled-row': fgAnchorPreset !== 'custom' }">
            <span class="attr-key">前景锚点 X</span>
            <div class="attr-input-wrapper">
                <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    v-model.number="fgAnchorX"
                    :disabled="fgAnchorPreset !== 'custom'"
                    class="attr-input"
                />
            </div>
        </div>
        <div class="attribute-row" :class="{ 'disabled-row': fgAnchorPreset !== 'custom' }">
            <span class="attr-key">前景锚点 Y</span>
            <div class="attr-input-wrapper">
                <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    v-model.number="fgAnchorY"
                    :disabled="fgAnchorPreset !== 'custom'"
                    class="attr-input"
                />
            </div>
        </div>

        <!-- Default/Uniform offsets -->
        <div class="attribute-row">
            <span class="attr-key">{{ i18n.locale === 'zh' ? '统一默认坐标 X' : 'Default FG Offset X' }}</span>
            <div class="attr-input-wrapper">
                <input
                    type="number"
                    v-model.number="defaultFgX"
                    class="attr-input"
                />
            </div>
        </div>
        <div class="attribute-row">
            <span class="attr-key">{{ i18n.locale === 'zh' ? '统一默认坐标 Y' : 'Default FG Offset Y' }}</span>
            <div class="attr-input-wrapper">
                <input
                    type="number"
                    v-model.number="defaultFgY"
                    class="attr-input"
                />
            </div>
        </div>

        <!-- Option 2: Foregrounds coordinate list table -->
        <div class="section-divider"></div>
        <div class="node-header-row">
            <span class="node-header-title">
                {{ i18n.locale === 'zh' ? '前景相对坐标偏移表' : 'FG Offset List' }}
            </span>
            <span class="table-note">
                ({{ i18n.locale === 'zh' ? '留空使用默认值' : 'leave empty for default' }})
            </span>
        </div>
        <div class="fg-offset-table">
            <div v-for="fg in foregroundsList" :key="fg.name" class="fg-offset-row">
                <span class="fg-offset-name font-mono ellipsis" :title="fg.name">{{ fg.name }}</span>
                <div class="fg-offset-inputs">
                    <div class="fg-input-group">
                        <span class="fg-input-label">X</span>
                        <input
                            type="number"
                            :value="fg.x !== null && fg.x !== undefined ? fg.x : ''"
                            :placeholder="String(defaultFgX)"
                            @input="e => handleFgOffsetChange(fg.name, e.target.value, fg.y)"
                            class="fg-input attr-input"
                        />
                    </div>
                    <div class="fg-input-group">
                        <span class="fg-input-label">Y</span>
                        <input
                            type="number"
                            :value="fg.y !== null && fg.y !== undefined ? fg.y : ''"
                            :placeholder="String(defaultFgY)"
                            @input="e => handleFgOffsetChange(fg.name, fg.x, e.target.value)"
                            class="fg-input attr-input"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.stand-diff-section {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.section-divider {
    border-top: 1px dashed var(--border-color);
    margin: 15px 0 10px 0;
}

.disabled-row {
    opacity: 0.4;
    pointer-events: none;
}

.fg-offset-table {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
    background-color: var(--bg-dark-input);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 10px;
}

.fg-offset-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.fg-offset-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
}

.fg-offset-name {
    font-size: 11px;
    color: var(--text-primary);
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.fg-offset-inputs {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
}

.fg-input-group {
    display: flex;
    align-items: center;
    gap: 4px;
}

.fg-input-label {
    font-size: 10px;
    color: var(--text-secondary);
}

.fg-input {
    width: 50px !important;
    text-align: center;
    padding: 2px 4px !important;
    font-size: 11px !important;
    height: auto !important;
}

.table-note {
    font-size: 10px;
    color: var(--text-secondary);
}
</style>
