<script setup>
import { useUIStore } from '@/stores/uiStore'
import { useI18nStore } from '@/stores/i18n'
import { computed } from 'vue'
import FennecView from '@/fennec-view/FennecView'
import ReadonlyControl from './controls/ReadonlyControl.vue'
import SelectControl from './controls/SelectControl.vue'
import SliderControl from './controls/SliderControl.vue'
import ColorControl from './controls/ColorControl.vue'
import NumberControl from './controls/NumberControl.vue'
import BooleanControl from './controls/BooleanControl.vue'
import TextControl from './controls/TextControl.vue'

const controlMap = {
    readonly: ReadonlyControl,
    select: SelectControl,
    slider: SliderControl,
    color: ColorControl,
    number: NumberControl,
    boolean: BooleanControl,
    text: TextControl
}

const uiStore = useUIStore()
const i18n = useI18nStore()

const propertyPanel = computed(() => uiStore.propertyPanel)

const isSpineNode = computed(() => {
    return uiStore.propertyPanel.currentNode?.type === 'spine'
})

const isLive2dNode = computed(() => {
    return uiStore.propertyPanel.currentNode?.type === 'live2d'
})

const isPremultiplied = computed({
    get() {
        return uiStore.propertyPanel.currentNode?.isPremultiplied || false
    },
    set(value) {
        if (FennecView?.updateNodeProperty) {
            FennecView.updateNodeProperty('isPremultiplied', value)
        }
    }
})

const textureMode = computed({
    get() {
        return uiStore.propertyPanel.currentNode?.textureMode !== undefined ? uiStore.propertyPanel.currentNode.textureMode : 0
    },
    set(value) {
        if (FennecView?.updateNodeProperty) {
            FennecView.updateNodeProperty('textureMode', Number(value))
        }
    }
})

const live2dTracking = computed({
    get() {
        return uiStore.propertyPanel.currentNode?.live2dTracking || false
    },
    set(value) {
        if (FennecView?.updateNodeProperty) {
            FennecView.updateNodeProperty('live2dTracking', value)
        }
    }
})

import { nodeRegistry } from '@/fennec-view/core/NodeRegistry'

const customPropertyComponent = computed(() => {
    const type = uiStore.propertyPanel.currentNode?.type
    const def = nodeRegistry.get(type)
    return def?.propertyComponent || null
})

const DEFAULT_PROPERTY_SCHEMA = {
  name: { type: 'text' },
  x: { type: 'number' },
  y: { type: 'number' },
  scaleX: { type: 'number', step: 0.05 },
  scaleY: { type: 'number', step: 0.05 },
  rotation: { type: 'number', step: 1 },
  alpha: { 
    type: 'slider', 
    min: 0, 
    max: 1, 
    step: 0.01 
  },
  text: { type: 'text' },
  fontSize: { 
    type: 'slider',
    min: 10,
    max: 120,
    step: 1
  },
  fontFamily: { 
    type: 'select', 
    options: [
      { value: 'Arial', label: 'Arial' },
      { value: 'Times New Roman', label: 'Times New Roman' },
      { value: 'Courier New', label: 'Courier New' },
      { value: 'Microsoft YaHei', label: '微软雅黑' },
      { value: 'SimSun', label: '宋体' }
    ] 
  },
  fill: { type: 'color' },
  align: { 
    type: 'select', 
    options: [
      { value: 'left', label: 'Left / 左对齐' },
      { value: 'center', label: 'Center / 居中' },
      { value: 'right', label: 'Right / 右对齐' }
    ] 
  },
  width: { type: 'number' },
  height: { type: 'number' },
  radius: { 
    type: 'slider',
    min: 0,
    max: 200,
    step: 1
  },
  borderWidth: { 
    type: 'slider',
    min: 0,
    max: 50,
    step: 1
  },
  borderColor: { type: 'color' },
  videoLoop: { type: 'boolean' },
  videoMuted: { type: 'boolean' },
  videoVolume: { 
    type: 'slider',
    min: 0,
    max: 1,
    step: 0.05
  },
  videoPlaying: { type: 'boolean' },
  animationSpeed: { type: 'number', step: 10 },
  animationLoop: { type: 'boolean' },
  animationPlaying: { type: 'boolean' }
}

function getPropertySchema(key) {
    const customSchema = uiStore.propertyPanel.schema?.[key]
    const defaultSchema = DEFAULT_PROPERTY_SCHEMA[key]
    if (customSchema) {
        return { ...defaultSchema, ...customSchema }
    }
    if (defaultSchema) {
        return defaultSchema
    }
    if (isEditable(key)) {
        return { type: 'text' }
    }
    return { type: 'readonly' }
}

function getDisplayName(key) {
    const maps = {
        name: i18n.locale === 'zh' ? '名称' : 'Name',
        x: 'X',
        y: 'Y',
        width: i18n.locale === 'zh' ? '宽' : 'Width',
        height: i18n.locale === 'zh' ? '高' : 'Height',
        scaleX: i18n.locale === 'zh' ? '缩放 X' : 'Scale X',
        scaleY: i18n.locale === 'zh' ? '缩放 Y' : 'Scale Y',
        rotation: i18n.locale === 'zh' ? '旋转' : 'Rotation',
        alpha: i18n.locale === 'zh' ? '透明度' : 'Alpha',
        spineVersion: i18n.locale === 'zh' ? 'Spine 版本' : 'Spine Version',
        spineFps: i18n.locale === 'zh' ? 'Spine 帧率' : 'Spine FPS',
        spineWidth: i18n.locale === 'zh' ? 'Spine 宽度' : 'Spine Width',
        spineHeight: i18n.locale === 'zh' ? 'Spine 高度' : 'Spine Height',
        text: i18n.locale === 'zh' ? '文本内容' : 'Text Content',
        fontSize: i18n.locale === 'zh' ? '字体大小' : 'Font Size',
        fontFamily: i18n.locale === 'zh' ? '字体' : 'Font Family',
        fill: i18n.locale === 'zh' ? '颜色' : 'Color',
        align: i18n.locale === 'zh' ? '对齐方式' : 'Alignment',
        radius: i18n.locale === 'zh' ? '圆角半径' : 'Corner Radius',
        borderWidth: i18n.locale === 'zh' ? '边框粗细' : 'Border Width',
        borderColor: i18n.locale === 'zh' ? '边框颜色' : 'Border Color',
        videoLoop: i18n.locale === 'zh' ? '循环播放' : 'Loop Playback',
        videoMuted: i18n.locale === 'zh' ? '静音' : 'Mute',
        videoVolume: i18n.locale === 'zh' ? '音量' : 'Volume',
        videoPlaying: i18n.locale === 'zh' ? '正在播放' : 'Is Playing',
        animationSpeed: i18n.locale === 'zh' ? '帧间隔 (毫秒)' : 'Frame Interval (ms)',
        animationLoop: i18n.locale === 'zh' ? '循环播放' : 'Loop Playback',
        animationPlaying: i18n.locale === 'zh' ? '正在播放' : 'Is Playing',
        resolution: i18n.locale === 'zh' ? '渲染分辨率' : 'Resolution'
    }
    return maps[key] || key
}

function isEditable(key) {
    if (key === 'width' || key === 'height') {
        return uiStore.propertyPanel.currentNode?.type === 'rect' || uiStore.propertyPanel.currentNode?.type === 'video'
    }
    return ['name', 'x', 'y', 'radius', 'borderWidth', 'borderColor', 'scaleX', 'scaleY', 'rotation', 'alpha', 'text', 'fontSize', 'fontFamily', 'fill', 'align', 'videoLoop', 'videoMuted', 'videoVolume', 'videoPlaying', 'animationSpeed', 'animationLoop', 'animationPlaying', 'resolution'].includes(key)
}

function handleAttributeChange(key, value) {
    let finalValue = value
    const numericKeys = ['x', 'y', 'width', 'height', 'radius', 'borderWidth', 'scaleX', 'scaleY', 'rotation', 'alpha', 'fontSize', 'videoVolume', 'animationSpeed', 'resolution']
    if (numericKeys.includes(key)) {
        finalValue = parseFloat(value)
        if (isNaN(finalValue)) {
            FennecView.refreshPropertyPanel()
            return
        }
    }
    if (FennecView?.updateNodeProperty) {
        FennecView.updateNodeProperty(key, finalValue)
    }
}

const cameraX = computed(() => {
    return Math.round(uiStore.canvasDisplay.worldPosition.x * 100) / 100
})

const cameraY = computed(() => {
    return Math.round(uiStore.canvasDisplay.worldPosition.y * 100) / 100
})

const cameraZoom = computed(() => {
    return Math.round(uiStore.canvasDisplay.scale * 100) / 100
})

function handleCameraChange(key, value) {
    if (!FennecView?.canvas?.world) return
    const world = FennecView.canvas.world
    const uiStore = useUIStore()

    let numVal = parseFloat(value)
    if (isNaN(numVal)) {
        if (key === 'x') uiStore.updateWorldPosition(world.x, world.y)
        if (key === 'y') uiStore.updateWorldPosition(world.x, world.y)
        if (key === 'zoom') uiStore.updateScale(world.scale.x)
        return
    }

    if (key === 'x') {
        world.x = numVal
        uiStore.updateWorldPosition(world.x, world.y)
    } else if (key === 'y') {
        world.y = numVal
        uiStore.updateWorldPosition(world.x, world.y)
    } else if (key === 'zoom') {
        const scaleVal = Math.max(0.1, Math.min(3.0, numVal))
        world.scale.set(scaleVal)
        uiStore.updateScale(scaleVal)
    }
    FennecView.updateScale()
    if (FennecView.canvas?.app) {
        FennecView.canvas.app.render()
    }
}
</script>

<template>
    <div class="property-panel">
        <!-- Camera Settings: Permanent section at the top -->
        <div class="attributes-list camera-settings-section">
            <div class="camera-header-row">
                <span class="camera-header-title">{{ i18n.t('cameraSettings') }}</span>
            </div>
            
            <div class="attribute-row">
                <span class="attr-key">{{ i18n.t('cameraX') }}</span>
                <div class="attr-input-wrapper">
                    <input
                        type="text"
                        :value="cameraX"
                        @change="handleCameraChange('x', $event.target.value)"
                        @keydown.enter="$event.target.blur()"
                        class="attr-input"
                    />
                </div>
            </div>

            <div class="attribute-row">
                <span class="attr-key">{{ i18n.t('cameraY') }}</span>
                <div class="attr-input-wrapper">
                    <input
                        type="text"
                        :value="cameraY"
                        @change="handleCameraChange('y', $event.target.value)"
                        @keydown.enter="$event.target.blur()"
                        class="attr-input"
                    />
                </div>
            </div>

            <div class="attribute-row">
                <span class="attr-key">{{ i18n.t('cameraZoom') }}</span>
                <div class="attr-input-wrapper">
                    <input
                        type="text"
                        :value="cameraZoom"
                        @change="handleCameraChange('zoom', $event.target.value)"
                        @keydown.enter="$event.target.blur()"
                        class="attr-input"
                    />
                </div>
            </div>
        </div>

        <!-- Node Attributes / No Selection section below -->
        <div v-if="!propertyPanel.currentNode" class="no-selection-divider">
            <div class="no-selection">
                {{ i18n.t('propNoNodeSelected') }}
            </div>
        </div>
        <div v-else class="attributes-list node-attributes-section">
            <div class="node-header-row">
                <span class="node-header-title">
                    {{ i18n.locale === 'zh' ? '元素属性' : 'Element Properties' }}
                </span>
            </div>
            <div
                v-for="attr in propertyPanel.propertyAttributes"
                :key="attr.key"
                class="attribute-row"
            >
                <span class="attr-key">{{ getDisplayName(attr.key) }}</span>
                
                <div class="attr-input-wrapper">
                    <component
                        :is="controlMap[getPropertySchema(attr.key).type] || TextControl"
                        :value="attr.value"
                        :schema="getPropertySchema(attr.key)"
                        @change="handleAttributeChange(attr.key, $event)"
                    />
                </div>
            </div>

            <!-- Dynamic Texture Mode dropdown for Spine nodes -->
            <div v-if="isSpineNode" class="attribute-row pma-row">
                <span class="attr-key">{{ i18n.t('propTextureMode') }}</span>
                <select
                    v-model="textureMode"
                    class="attr-select"
                    style="max-width: 140px;"
                >
                    <option :value="0">{{ i18n.t('premultClose') }}</option>
                    <option :value="1">{{ i18n.t('premultOnUpload') }}</option>
                    <option :value="2">{{ i18n.t('premultOpen') }}</option>
                </select>
            </div>

            <!-- Live2D Tracking switch -->
            <div v-if="isLive2dNode" class="attribute-row pma-row">
                <span class="attr-key">{{ i18n.locale === 'zh' ? '视线追踪' : 'Mouse Tracking' }}</span>
                <label class="ind-switch">
                    <input 
                        type="checkbox" 
                        v-model="live2dTracking"
                    />
                    <span class="switch-slider"></span>
                </label>
            </div>

            <!-- Dynamically loaded custom property components for plugins -->
            <component 
                v-slot:default
                v-if="customPropertyComponent" 
                :is="customPropertyComponent" 
                :node="propertyPanel.currentNode" 
            />
        </div>
    </div>
</template>

<style scoped>
.property-panel {
    padding: 10px;
}

.camera-header-row {
    padding: 6px 4px;
    margin-bottom: 4px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
}

.camera-header-title {
    font-size: 13px;
    font-weight: bold;
    color: var(--text-primary);
}

.node-attributes-section {
    margin-top: 15px;
    border-top: 1px dashed var(--border-color);
    padding-top: 10px;
}

.no-selection-divider {
    margin-top: 15px;
    border-top: 1px dashed var(--border-color);
    padding-top: 10px;
}

:deep(.node-header-row) {
    padding: 6px 4px;
    margin-bottom: 4px;
    display: flex;
    align-items: center;
}

:deep(.node-header-title) {
    font-size: 13px;
    font-weight: bold;
    color: var(--text-primary);
}

.no-selection {
    text-align: center;
    color: var(--text-secondary);
    padding: 20px 0;
    font-size: 13px;
}

.attributes-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

:deep(.attribute-row) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    background-color: var(--bg-dark-input);
    border: 1px solid var(--border-color);
    font-size: 12px;
}


.pma-row {
    margin-top: 8px;
    border-top: 1px solid var(--border-color);
}

:deep(.attr-key) {
    color: var(--text-secondary);
    line-height: 22px;
}

:deep(.attr-input-wrapper) {
    flex: 1;
    max-width: 140px;
    display: flex;
    justify-content: flex-end;
}

:deep(.attr-input) {
    width: 100%;
    background-color: var(--bg-dark-panel, #1e1e1e);
    border: 1px solid var(--border-color, #333);
    color: var(--text-active, #fff);
    font-family: monospace;
    font-size: 12px;
    padding: 3px 6px;
    border-radius: 3px;
    text-align: right;
    outline: none;
    transition: border-color 0.15s ease;
    box-sizing: border-box;
}

:deep(.attr-input:focus) {
    border-color: var(--bg-dark-active, #0052d9);
}

:deep(.attr-select) {
    width: 100%;
    background-color: var(--bg-dark-panel, #1e1e1e);
    border: 1px solid var(--border-color, #333);
    color: var(--text-active, #fff);
    font-size: 11px;
    padding: 3px 6px;
    border-radius: 3px;
    outline: none;
    transition: border-color 0.15s ease;
    cursor: pointer;
    box-sizing: border-box;
}

:deep(.attr-select:focus) {
    border-color: var(--bg-dark-active, #0052d9);
}

.slider-control-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
}

.attr-slider {
    flex: 1;
    min-width: 0;
    height: 4px;
    background: var(--border-color, #333);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
}

.attr-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--text-active, #fff);
    border: 1px solid var(--border-color, #333);
    transition: background-color 0.1s;
}

.attr-slider::-webkit-slider-thumb:hover {
    background: var(--bg-dark-active, #0052d9);
}

.attr-slider::-moz-range-thumb {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--text-active, #fff);
    border: 1px solid var(--border-color, #333);
    cursor: pointer;
    transition: background-color 0.1s;
}

.attr-slider::-moz-range-thumb:hover {
    background: var(--bg-dark-active, #0052d9);
}

.slider-val-readout {
    font-family: monospace;
    font-size: 11px;
    color: var(--text-active, #fff);
    width: 32px;
    text-align: right;
}

.color-control-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
}

.attr-color-picker {
    width: 24px;
    height: 20px;
    border: 1px solid var(--border-color, #333);
    border-radius: 3px;
    background: none;
    cursor: pointer;
    padding: 0;
    box-sizing: border-box;
}

.color-hex-input {
    width: calc(100% - 30px);
}

.attr-val {
    color: var(--text-active);
    font-family: monospace;
    line-height: 22px;
}

/* Switch styling fitting Industrial Dark theme */
.ind-switch {
    position: relative;
    display: inline-block;
    width: 32px;
    height: 18px;
}

.ind-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.switch-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--bg-dark-panel, #1e1e1e);
    border: 1px solid var(--border-color, #333);
    transition: .2s;
    border-radius: 9px;
}

.switch-slider:before {
    position: absolute;
    content: "";
    height: 12px;
    width: 12px;
    left: 2px;
    bottom: 2px;
    background-color: var(--text-secondary, #888);
    transition: .2s;
    border-radius: 50%;
}

input:checked + .switch-slider {
    background-color: var(--bg-dark-active, #0052d9);
    border-color: var(--bg-dark-active, #0052d9);
}

input:checked + .switch-slider:before {
    transform: translateX(14px);
    background-color: var(--text-active, #fff);
}

.stand-diff-section {
    display: flex;
    flex-direction: column;
    width: 100%;
}

:deep(.section-divider) {
    border-top: 1px dashed var(--border-color);
    margin: 15px 0 10px 0;
}

:deep(.disabled-row) {
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
</style>
