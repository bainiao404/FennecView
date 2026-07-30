<script setup>
import { ref, computed, markRaw } from 'vue'
import {
    BrowseIcon,
    BrowseOffIcon,
    AdjustmentIcon,
    FilmIcon,
    LayersIcon,
    SettingIcon,
    DownloadIcon,
    BugIcon,
    ToolsIcon,
    ViewListIcon,
    ImportIcon,
    PlayIcon,
    PauseIcon,
    AddIcon
} from 'tdesign-icons-vue-next'
import { useUIStore } from '@/stores/uiStore'
import { useI18nStore } from '@/stores/i18n'
import SpineCanvas from '@/components/canvas/SpineCanvas.vue'
import SpineUserRectOverlay from '@/components/layout/SpineUserRectOverlay.vue'
import LayerList from '@/components/layout/LayerList.vue'

// Import redesigned panel components
import PropertyPanel from '@/components/panels/PropertyPanel.vue'
import AnimationAndSkinPanel from '@/components/panels/AnimationAndSkinPanel.vue'
import LayersPanel from '@/components/panels/LayersPanel.vue'
import SlotsPanel from '@/components/panels/SlotsPanel.vue'
import ImportPanel from '@/components/panels/ImportPanel.vue'
import ExportPanel from '@/components/panels/ExportPanel.vue'
import DebugPanel from '@/components/panels/DebugPanel.vue'
import ToolPanel from '@/components/panels/ToolPanel.vue'
import SettingsPanel from '@/components/panels/SettingsPanel.vue'
import AddPanel from '@/components/panels/AddPanel.vue'

const uiStore = useUIStore()
const i18n = useI18nStore()

const isElectron =
    typeof window !== 'undefined' &&
    (!!window.process || (window.navigator && window.navigator.userAgent.indexOf('Electron') !== -1))

const activeTab = ref('property')
const isPanelHidden = ref(true)

function handleTabClick(tab) {
    if (activeTab.value === tab) {
        isPanelHidden.value = !isPanelHidden.value
    } else {
        activeTab.value = tab
        isPanelHidden.value = false
    }
}

// Data-driven tabs configuration
const sidebarTabs = [
    { id: 'property', nameKey: 'tabProperty', icon: AdjustmentIcon, component: markRaw(PropertyPanel) },
    { id: 'animationAndSkin', nameKey: 'tabAnimationSkin', icon: FilmIcon, component: markRaw(AnimationAndSkinPanel) },
    { id: 'layers', nameKey: 'tabLayers', icon: LayersIcon, component: markRaw(LayersPanel) },
    { id: 'slots', nameKey: 'tabSlots', icon: ViewListIcon, component: markRaw(SlotsPanel) },
    { id: 'import', nameKey: 'tabImport', icon: ImportIcon, component: markRaw(ImportPanel) },
    { id: 'add', nameKey: 'tabAdd', icon: AddIcon, component: markRaw(AddPanel) },
    { id: 'export', nameKey: 'tabExport', icon: DownloadIcon, component: markRaw(ExportPanel) },
    { id: 'debug', nameKey: 'tabDebug', icon: BugIcon, component: markRaw(DebugPanel) },
    { id: 'tool', nameKey: 'tabTools', icon: ToolsIcon, component: markRaw(ToolPanel) },
    { id: 'settings', nameKey: 'tabSettings', icon: SettingIcon, component: markRaw(SettingsPanel) }
]

const activeTabInfo = computed(() => {
    return sidebarTabs.find(tab => tab.id === activeTab.value)
})

const activeTabTitle = computed(() => {
    return activeTabInfo.value ? i18n.t(activeTabInfo.value.nameKey) : ''
})

const activeTabComponent = computed(() => {
    return activeTabInfo.value ? activeTabInfo.value.component : null
})

// Scene hierarchy and batch selection computes
const layerPanel = computed(() => uiStore.layerPanel)

function handleBatchItemClick(item) {
    if (item.onClick) item.onClick()
}

function handleBatchItemMouseOver(item) {
    if (item.onMouseOver) item.onMouseOver()
}

function handleBatchItemMouseOut(item) {
    if (item.onMouseOut) item.onMouseOut()
}

function handleBatchItemRemove(item, event) {
    event.preventDefault()
    if (item.onRemove) item.onRemove()
}

function handleBatchItemContextMenu(item, event) {
    event.preventDefault()
    if (item.onRemove) item.onRemove(event)
}
</script>

<template>
    <div
        class="home-workspace"
        :class="{ 'is-electron': isElectron, 'selecting-rect': uiStore.userInteraction.isSelectingRect }"
    >
        <!-- 1. Left Dock Panel Container (Sidebar tabs + active panel content) -->
        <div v-if="!uiStore.previewMode.isActive" class="left-dock ind-panel" :class="{ collapsed: isPanelHidden }">
            <div class="tabs-bar">
                <button
                    v-for="tab in sidebarTabs"
                    :key="tab.id"
                    class="tab-btn"
                    :class="{ active: activeTab === tab.id && !isPanelHidden }"
                    @click="handleTabClick(tab.id)"
                    :title="i18n.t(tab.nameKey)"
                >
                    <component :is="tab.icon" class="tab-icon" />
                    <span class="tab-text-label">{{ i18n.t(tab.nameKey) }}</span>
                </button>
            </div>
            <div v-show="!isPanelHidden" class="panel-container">
                <div class="ind-header">{{ activeTabTitle }}</div>
                <div class="panel-content-scroll">
                    <component :is="activeTabComponent" />
                </div>
            </div>
        </div>

        <!-- 2. Center Canvas View (flex: 1) -->
        <div class="center-workspace">
            <div class="canvas-wrapper">
                <SpineCanvas :is-left-panel-collapsed="isPanelHidden" />
                <SpineUserRectOverlay />
            </div>
        </div>

        <!-- 3. Right Dock Panel (Scene hierarchy list) -->
        <div v-if="layerPanel.isVisible && !uiStore.previewMode.isActive" class="right-dock ind-panel">
            <div class="ind-header">
                {{ i18n.locale === 'zh' ? '场景层级' : 'Scene Hierarchy' }}
            </div>

            <div class="dock-scroll-content">
                <div class="hierarchy-section">
                    <div class="section-sub-title">{{ i18n.locale === 'zh' ? '场景模型' : 'Loaded Skeletons' }}</div>
                    <div class="ind-list-box hierarchy-list">
                        <LayerList :detailed="false" />
                    </div>
                </div>

                <div class="hierarchy-section">
                    <div class="section-sub-title">{{ i18n.t('batchTitle') }}</div>
                    <div class="ind-list-box batch-list">
                        <div
                            v-if="!layerPanel.batchSelection.length"
                            v-for="(instruction, index) in layerPanel.batchInstructions"
                            :key="`instruction-${index}`"
                            class="batch-instruction-item"
                        >
                            {{ instruction }}
                        </div>
                        <div
                            v-else
                            v-for="item in layerPanel.batchSelection"
                            :key="`batch-${item.index}`"
                            class="hierarchy-item batch-selected-item"
                            @click="handleBatchItemClick(item)"
                            @mouseover="handleBatchItemMouseOver(item)"
                            @mouseout="handleBatchItemMouseOut(item)"
                            @mousedown="handleBatchItemRemove(item, $event)"
                            @contextmenu="(e) => handleBatchItemContextMenu(item, e)"
                            :data-spineposition="item.index"
                        >
                            <span class="item-name" :title="item.name">{{ item.name }}</span>
                            <span class="remove-badge">×</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.home-workspace {
    display: flex;
    width: 100%;
    height: 100%;
    background-color: var(--bg-dark-app);
    overflow: hidden;
    position: relative;
}

/* Left dock design */
.left-dock {
    width: 320px;
    height: 100%;
    display: flex;
    flex-direction: row;
    border-right: 1px solid var(--border-color);
    background-color: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    position: absolute;
    left: 0;
    top: 0;
    z-index: 10;
    transition: width 0.2s ease, border-color 0.2s ease;
    overflow: hidden;
}

.left-dock.collapsed {
    width: 55px; /* 54px tabs-bar + 1px border */
    border-right: 1px solid var(--border-color);
}

.tabs-bar {
    width: 54px;
    height: 100%;
    background-color: var(--glass-bg-active);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 10px;
    padding-bottom: 10px;
    gap: 4px;
    overflow-y: auto;
    scrollbar-width: none; /* Firefox */
}

.tabs-bar::-webkit-scrollbar {
    display: none; /* WebKit */
}

.tab-btn {
    width: 44px;
    height: 48px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4px;
    font-size: 9px;
    transition: all 0.15s ease;
    border-radius: 4px;
    padding: 2px;
    flex-shrink: 0;
}
.tab-btn:hover {
    background-color: var(--bg-dark-hover);
    color: var(--text-primary);
}
.tab-btn.active {
    background-color: rgba(30, 30, 30, 0.75);
    color: var(--text-active);
    border-left: 2px solid var(--bg-dark-active);
    border-radius: 4px 0 0 4px;
}

.tab-icon {
    font-size: 16px;
    color: currentColor;
}

.tab-text-label {
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
}

.panel-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--glass-bg);
    min-width: 0;
}

.panel-container .ind-header {
    background-color: rgba(30, 30, 30, 0.4);
}

.panel-content-scroll {
    flex: 1;
    overflow-y: auto;
}

/* Center canvas area */
.center-workspace {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
}

.canvas-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

/* Right dock hierarchy */
.right-dock {
    width: 260px;
    height: 100%;
    border-left: 1px solid var(--border-color);
    background-color: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    position: absolute;
    right: 0;
    top: 0;
    z-index: 10;
}

.right-dock .ind-header {
    background-color: rgba(30, 30, 30, 0.4);
}

.dock-scroll-content {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.hierarchy-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.section-sub-title {
    font-size: 11px;
    text-transform: uppercase;
    color: var(--text-secondary);
    font-weight: bold;
    letter-spacing: 0.5px;
}

.hierarchy-list,
.batch-list {
    max-height: 240px;
    background-color: rgba(45, 45, 45, 0.4);
}

.hierarchy-item {
    padding: 6px 8px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-size: 12px;
}
.hierarchy-item:hover {
    background-color: var(--bg-dark-hover);
    color: var(--text-active);
}
.hierarchy-item.active {
    background-color: var(--bg-dark-active);
    color: var(--text-active);
}

.item-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-right: 8px;
}

.item-actions {
    display: flex;
    gap: 4px;
}

.action-icon-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-secondary);
    padding: 2px 4px;
    border-radius: 2px;
}
.action-icon-btn:hover {
    color: var(--text-active);
    background-color: var(--bg-dark-hover);
}

.small-icon {
    font-size: 10px;
}

.batch-instruction-item {
    padding: 6px 8px;
    font-size: 11px;
    color: var(--text-secondary);
    line-height: 1.4;
    border-bottom: 1px dashed var(--border-color);
}

.batch-selected-item {
    color: var(--accent-orange);
}
.remove-badge {
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: bold;
}
.hierarchy-item:hover .remove-badge {
    color: #f56c6c;
}

.home-workspace.is-electron .left-dock {
    top: 32px;
    height: calc(100% - 32px);
}

.home-workspace.is-electron .right-dock {
    top: 32px;
    height: calc(100% - 32px);
}

.home-workspace.selecting-rect .left-dock,
.home-workspace.selecting-rect .right-dock,
.home-workspace.selecting-rect .bottom-timeline {
    display: none !important;
}
</style>
