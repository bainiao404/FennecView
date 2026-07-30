<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/uiStore'
import { useI18nStore } from '@/stores/i18n'
import FennecView from '@/fennec-view/FennecView'
import { 
    BrowseIcon, 
    BrowseOffIcon, 
    PlayIcon, 
    PauseIcon, 
    DeleteIcon, 
    ChevronUpIcon, 
    ChevronDownIcon 
} from 'tdesign-icons-vue-next'

const props = defineProps({
    detailed: {
        type: Boolean,
        default: false
    }
})

const uiStore = useUIStore()
const i18n = useI18nStore()

const reversedLayers = computed(() => {
    return [...uiStore.layerPanel.sceneFiles].reverse()
})

const batchSelectedIndices = computed(() => {
    return uiStore.layerPanel.batchSelection.map(item => item.index)
})

const isActive = (layer) => {
    return uiStore.propertyPanel.currentNode?.index === layer.index
}

const isBatchSelected = (layer) => {
    return batchSelectedIndices.value.includes(layer.index)
}

function handleSelect(layer) {
    FennecView.selectNodeFromList(layer.index)
}

function handleHoverStart(layer) {
    if (!props.detailed) {
        FennecView.hoverNodeFromList(layer.index)
    }
}

function handleHoverEnd(layer) {
    if (!props.detailed) {
        FennecView.unhoverNodeFromList(layer.index)
    }
}

function toggleBatch(layer) {
    if (!FennecView.click.batchList) {
        FennecView.click.batchList = []
    }
    const idxStr = layer.index.toString()
    const index = FennecView.click.batchList.indexOf(idxStr)
    if (index > -1) {
        FennecView.click.batchList.splice(index, 1)
    } else {
        FennecView.click.batchList.push(idxStr)
    }
    FennecView.refreshBatchSelection()
}

function handlePlay(layer) {
    layer.playing = !layer.playing
    FennecView.updateNodeProperty('play', null, layer.index)
}

function handleVisible(layer) {
    layer.visible = !layer.visible
    FennecView.updateNodeProperty('visible', null, layer.index)
}

function handleDelete(layer) {
    FennecView.selectNodeFromList(layer.index)
    FennecView.deleteNode()
}

function handleContextMenu(layer, event) {
    if (!props.detailed) {
        event.preventDefault()
        if (layer.index !== undefined) {
            toggleBatch(layer)
        }
    }
}

// Drag & Drop
let dragStartIndex = null

function handleDragStart(layer, event) {
    dragStartIndex = layer.index
    FennecView.click.drag = event.target
    event.stopPropagation()
}

function handleDragOver(event) {
    event.preventDefault()
}

function handleDrop(targetLayer, event) {
    event.stopPropagation()
    if (dragStartIndex === null || dragStartIndex === targetLayer.index) return

    const box = FennecView?.canvas?.box
    if (box) {
        box.setChildIndex(box.children[dragStartIndex], targetLayer.index)
        FennecView.click.batchList = []
        FennecView.refreshBatchSelection()
        FennecView.refreshList()
    }
    dragStartIndex = null
}

function moveUp(layer) {
    const index = layer.index
    const box = FennecView.canvas?.box
    if (!box) return
    const node = box.children[index]
    if (!node) return
    if (index < box.children.length - 1) {
        box.setChildIndex(node, index + 1)
        FennecView.refreshList()
    }
}

function moveDown(layer) {
    const index = layer.index
    const box = FennecView.canvas?.box
    if (!box) return
    const node = box.children[index]
    if (!node) return
    if (index > 0) {
        box.setChildIndex(node, index - 1)
        FennecView.refreshList()
    }
}

function getLayerTypeLabel(layer) {
    return (layer.type || 'image').toUpperCase()
}
</script>

<template>
    <div class="layer-list-container" :class="{ 'detailed-list': detailed, 'simple-list': !detailed }">
        <div 
            v-for="layer in reversedLayers" 
            :key="layer.index"
            class="layer-item"
            :class="{ active: isActive(layer) }"
            @click="handleSelect(layer)"
            @mouseover="handleHoverStart(layer)"
            @mouseout="handleHoverEnd(layer)"
            @contextmenu="handleContextMenu(layer, $event)"
            @dragstart="handleDragStart(layer, $event)"
            @dragover="handleDragOver"
            @drop="handleDrop(layer, $event)"
            draggable="true"
            :data-spineposition="layer.index"
        >
            <div class="layer-main-row">
                <!-- Checkbox (Detailed only) -->
                <div v-if="detailed" class="layer-checkbox-container" @click.stop>
                    <input 
                        type="checkbox" 
                        class="layer-checkbox"
                        :checked="isBatchSelected(layer)"
                        @change="toggleBatch(layer)"
                    />
                </div>
                
                <!-- Layer Info -->
                <div class="layer-info">
                    <div class="layer-header-row">
                        <span class="layer-name-container">
                            <span class="layer-name" :title="layer.name">{{ layer.name }}</span>
                            <span v-if="isActive(layer) && detailed" class="active-badge">
                                {{ i18n.locale === 'zh' ? '(当前选中)' : '(Selected)' }}
                            </span>
                        </span>
                        <!-- Type Badge (Detailed only) -->
                        <span v-if="detailed" class="layer-type" :class="getLayerTypeLabel(layer).toLowerCase()">
                            {{ getLayerTypeLabel(layer) }}
                        </span>
                    </div>
                </div>
                
                <!-- Simplified Actions (Simple/Right Dock only) -->
                <div v-if="!detailed" class="item-actions" @click.stop>
                    <button class="action-icon-btn" @click="handlePlay(layer)">
                        <PauseIcon v-if="layer.playing" size="12px" />
                        <PlayIcon v-else size="12px" />
                    </button>
                    <button class="action-icon-btn" @click="handleVisible(layer)">
                        <BrowseIcon v-if="layer.visible" size="12px" />
                        <BrowseOffIcon v-else size="12px" />
                    </button>
                </div>
            </div>
            
            <!-- Detailed Actions (Detailed/Left Panel only) -->
            <div v-if="detailed" class="layer-actions" @click.stop>
                <!-- Order buttons -->
                <button 
                    class="action-btn" 
                    :disabled="layer.index === reversedLayers[0].index" 
                    @click="moveUp(layer)" 
                    :title="i18n.locale === 'zh' ? '移至上一层' : 'Move Up'"
                >
                    <ChevronUpIcon size="14px" />
                </button>
                <button 
                    class="action-btn" 
                    :disabled="layer.index === reversedLayers[reversedLayers.length - 1].index" 
                    @click="moveDown(layer)" 
                    :title="i18n.locale === 'zh' ? '移至下一层' : 'Move Down'"
                >
                    <ChevronDownIcon size="14px" />
                </button>
                
                <!-- Play/Pause for models -->
                <button 
                    v-if="getLayerTypeLabel(layer) !== 'IMAGE'"
                    class="action-btn" 
                    @click="handlePlay(layer)"
                    :title="i18n.locale === 'zh' ? '播放/暂停' : 'Play/Pause'"
                >
                    <PauseIcon v-if="layer.playing" size="14px" />
                    <PlayIcon v-else size="14px" />
                </button>
                
                <!-- Visibility -->
                <button 
                    class="action-btn" 
                    @click="handleVisible(layer)"
                    :title="i18n.locale === 'zh' ? '显示/隐藏' : 'Visibility'"
                >
                    <BrowseIcon v-if="layer.visible" size="14px" />
                    <BrowseOffIcon v-else size="14px" />
                </button>
                
                <!-- Delete -->
                <button 
                    class="action-btn delete-btn" 
                    @click="handleDelete(layer)"
                    :title="i18n.locale === 'zh' ? '删除' : 'Delete'"
                >
                    <DeleteIcon size="14px" />
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Common List Container Styles */
.layer-list-container {
    display: flex;
    flex-direction: column;
}

/* Detailed List Mode Styles */
.detailed-list {
    gap: 6px;
}

.detailed-list .layer-item {
    padding: 8px 10px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-dark-panel);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.detailed-list .layer-item:hover {
    border-color: var(--border-hover, #555555);
    background-color: var(--bg-dark-hover);
}

.detailed-list .layer-item.active {
    border-color: var(--border-light, #444444);
    background-color: #121212;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.6);
}

.detailed-list .layer-main-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.detailed-list .layer-checkbox-container {
    display: flex;
    align-items: center;
    justify-content: center;
}

.detailed-list .layer-checkbox {
    appearance: none;
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border: 1px solid var(--border-light, #444444);
    border-radius: 2px;
    background-color: var(--bg-dark-input, #2d2d2d);
    cursor: pointer;
    position: relative;
    outline: none;
    transition: all 0.15s ease;
    display: inline-block;
}

.detailed-list .layer-checkbox:hover {
    border-color: var(--text-secondary, #858585);
}

.detailed-list .layer-checkbox:checked {
    background-color: var(--bg-dark-active, #0e639c);
    border-color: var(--bg-dark-active, #0e639c);
}

.detailed-list .layer-checkbox:checked::after {
    content: "✓";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #ffffff;
    font-size: 10px;
    font-weight: bold;
}

.detailed-list .layer-info {
    flex: 1;
    min-width: 0;
}

.detailed-list .layer-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
}

.detailed-list .layer-name-container {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
}

.detailed-list .layer-name {
    color: var(--text-primary);
    font-weight: bold;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 110px;
}

.detailed-list .layer-item.active .layer-name {
    color: var(--text-active);
}

.detailed-list .active-badge {
    font-size: 10px;
    color: var(--text-secondary, #858585);
    font-weight: normal;
    white-space: nowrap;
}

.detailed-list .layer-type {
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: bold;
    flex-shrink: 0;
}

.detailed-list .layer-type.spine {
    background-color: rgba(0, 82, 217, 0.15);
    color: #2b73e6;
}

.detailed-list .layer-type.live2d {
    background-color: rgba(43, 179, 114, 0.15);
    color: #2bb372;
}

.detailed-list .layer-type.image {
    background-color: rgba(227, 125, 41, 0.15);
    color: #e37d29;
}

.detailed-list .layer-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 6px;
    margin-left: 22px;
}

.detailed-list .action-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    padding: 4px;
    cursor: pointer;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
}

.detailed-list .action-btn:hover:not(:disabled) {
    background-color: var(--bg-dark-hover);
    color: var(--text-active);
}

.detailed-list .action-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.detailed-list .delete-btn:hover:not(:disabled) {
    background-color: rgba(227, 77, 89, 0.15);
    color: #e74c3c;
}

/* Simple List Mode Styles (Right Dock) */
.simple-list .layer-item {
    display: flex;
    flex-direction: column;
    padding: 6px 10px;
    background-color: var(--bg-dark-panel);
    border-bottom: 1px solid var(--border-color);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
}

.simple-list .layer-item:hover {
    background-color: var(--bg-dark-hover);
}

.simple-list .layer-item.active {
    background-color: var(--bg-dark-active);
    color: var(--text-active);
}

.simple-list .layer-main-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
}

.simple-list .layer-info {
    flex: 1;
    min-width: 0;
}

.simple-list .layer-name {
    color: inherit;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    max-width: 150px;
}

.simple-list .item-actions {
    display: flex;
    align-items: center;
    gap: 4px;
}

.simple-list .action-icon-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 2px;
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s ease;
}

.simple-list .action-icon-btn:hover {
    color: var(--text-active);
}
</style>
