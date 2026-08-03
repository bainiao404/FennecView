<script setup>
import { useUIStore } from '@/stores/uiStore'
import { useI18nStore } from '@/stores/i18n'
import { computed, watch, onUnmounted } from 'vue'

const uiStore = useUIStore()
const i18n = useI18nStore()

const propertyPanel = computed(() => uiStore.propertyPanel)

const resetLive2dParameters = () => {
    uiStore.updateCurrentNodeProperty('resetLive2dParameters', propertyPanel.value.live2dParametersList)
}

const resetLive2dParts = () => {
    uiStore.updateCurrentNodeProperty('resetLive2dParts', propertyPanel.value.live2dPartsList)
}

let syncTimer = null;

const syncLoop = () => {
    if (propertyPanel.value.currentNode?.type !== 'live2d') {
        return
    }
    uiStore.syncCurrentNodeLive2D(
        propertyPanel.value.live2dParametersList,
        propertyPanel.value.live2dPartsList
    )
    syncTimer = setTimeout(syncLoop, 100) // 10fps is enough for slider update
}

watch(() => propertyPanel.value.currentNode?.type, (newType) => {
    if (syncTimer) {
        clearTimeout(syncTimer)
        syncTimer = null
    }
    if (newType === 'live2d') {
        syncLoop()
    }
}, { immediate: true })

onUnmounted(() => {
    if (syncTimer) clearTimeout(syncTimer)
})
</script>

<template>
    <div class="slots-panel">
        <div v-if="!propertyPanel.currentNode" class="no-selection">
            {{ i18n.t('propNoNodeSelected') }}
        </div>
        <div v-else class="panel-content">
            <!-- Parameters / Spine Slots Section -->
            <div class="section-title">
                {{ propertyPanel.currentNode.type === 'live2d' ? (i18n.locale === 'zh' ? 'Live2D 参数' : 'Live2D Parameters') : i18n.t('slotsTitle') }}
                <span 
                    v-if="propertyPanel.currentNode.type === 'live2d'" 
                    class="reset-btn" 
                    @click="resetLive2dParameters"
                >
                    {{ i18n.locale === 'zh' ? '重置全部' : 'Reset All' }}
                </span>
            </div>
            
            <div class="ind-list-box slot-list-container flex-container">
                <template v-if="propertyPanel.currentNode.type === 'live2d'">
                    <div 
                        v-for="param in propertyPanel.live2dParametersList" 
                        :key="param.name"
                        class="slot-item"
                    >
                        <div class="slot-header">
                            <span class="slot-name" :title="param.name">{{ param.name }}</span>
                            <span class="slot-alpha-text">{{ Math.round(param.value * 100) / 100 }}</span>
                        </div>
                        <div class="param-control-row">
                            <input 
                                type="checkbox" 
                                class="param-override-cb" 
                                :checked="param.state" 
                                @change="(e) => param.onStateChange(e.target.checked)"
                                :title="i18n.locale === 'zh' ? '强制覆盖' : 'Force Override'"
                            >
                            <input 
                                class="ind-range slot-range" 
                                type="range" 
                                :min="param.min" 
                                :max="param.max" 
                                step="0.01" 
                                :value="param.value"
                                @input="(e) => param.onValueChange(e.target.value)"
                            >
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div 
                        v-for="slot in propertyPanel.slotsList" 
                        :key="slot.name"
                        class="slot-item"
                    >
                    <div class="slot-header">
                        <span class="slot-name" :title="slot.name">{{ slot.name }}</span>
                        <span class="slot-alpha-text">{{ Math.round(slot.alpha * 100) }}%</span>
                    </div>
                    <input 
                        class="ind-range slot-range" 
                        name="spine_premult" 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        :value="slot.alpha"
                        @input="(e) => slot.onAlphaChange(e.target.value)"
                    >
                    <details class="attachments-details">
                        <summary class="details-summary" :id="'currentAttachmentTitle-' + slot.name">
                            {{ slot.currentAttachment }}
                        </summary>
                        <div class="attachments-dropdown">
                            <div 
                                v-for="attachment in slot.attachments" 
                                :key="attachment.name"
                                class="attachment-option"
                                :class="{ active: slot.currentAttachment === attachment.name }"
                                @click="attachment.onclick"
                            >
                                {{ attachment.name }}
                            </div>
                        </div>
                    </details>
                </div>
                </template>
            </div>

            <!-- Live2D Parts Section -->
            <template v-if="propertyPanel.currentNode.type === 'live2d' && propertyPanel.live2dPartsList.length > 0">
                <div class="section-title parts-title">
                    {{ i18n.locale === 'zh' ? 'Live2D 部件' : 'Live2D Parts' }}
                    <span 
                        class="reset-btn" 
                        @click="resetLive2dParts"
                    >
                        {{ i18n.locale === 'zh' ? '重置全部' : 'Reset All' }}
                    </span>
                </div>
                <div class="ind-list-box slot-list-container flex-container">
                    <div 
                        v-for="part in propertyPanel.live2dPartsList" 
                        :key="part.name"
                        class="slot-item"
                    >
                        <div class="slot-header">
                            <span class="slot-name" :title="part.name">{{ part.name }}</span>
                            <span class="slot-alpha-text">{{ Math.round(part.opacity * 100) }}%</span>
                        </div>
                        <div class="param-control-row">
                            <input 
                                type="checkbox" 
                                class="param-override-cb" 
                                :checked="part.state" 
                                @change="(e) => part.onStateChange(e.target.checked)"
                                :title="i18n.locale === 'zh' ? '强制覆盖' : 'Force Override'"
                            >
                            <input 
                                class="ind-range slot-range" 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.01" 
                                :value="part.opacity"
                                @input="(e) => part.onOpacityChange(e.target.value)"
                            >
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.slots-panel {
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

.section-title {
    font-size: 13px;
    font-weight: bold;
    color: var(--text-active);
    margin-bottom: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.parts-title {
    margin-top: 15px;
}

.reset-btn {
    font-size: 11px;
    color: var(--text-secondary);
    cursor: pointer;
    font-weight: normal;
}
.reset-btn:hover {
    color: var(--text-primary);
    text-decoration: underline;
}

.slot-list-container {
    max-height: 420px;
}

.flex-container {
    flex: 1;
    overflow-y: auto;
    min-height: 100px;
    max-height: none;
}

.slot-item {
    padding: 8px 10px;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--bg-dark-panel);
}

.param-control-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 5px 0 8px 0;
}

.param-override-cb {
    margin: 0;
    cursor: pointer;
}

.slot-header {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
}

.slot-name {
    color: var(--text-primary);
    font-weight: bold;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.slot-alpha-text {
    color: var(--text-secondary);
}

.slot-range {
    margin: 0;
    flex-grow: 1;
}

/* Details and Accordions */
.attachments-details {
    background-color: var(--bg-dark-input);
    border: 1px solid var(--border-color);
    font-size: 11px;
}

.details-summary {
    padding: 4px 8px;
    cursor: pointer;
    color: var(--text-active);
    outline: none;
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
}
.details-summary::-webkit-details-marker {
    display: none;
}
.details-summary::after {
    content: "▼";
    font-size: 8px;
    color: var(--text-secondary);
}

.attachments-details[open] .details-summary::after {
    content: "▲";
}

.attachments-dropdown {
    border-top: 1px solid var(--border-color);
    max-height: 120px;
    overflow-y: auto;
    background-color: var(--bg-dark-panel);
}

.attachment-option {
    padding: 4px 10px;
    cursor: pointer;
    color: var(--text-primary);
}
.attachment-option:hover {
    background-color: var(--bg-dark-hover);
    color: var(--text-active);
}
.attachment-option.active {
    background-color: var(--bg-dark-active);
    color: var(--text-active);
}
</style>
