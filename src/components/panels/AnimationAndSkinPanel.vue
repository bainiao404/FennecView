<script setup>
import { useUIStore } from '@/stores/uiStore'
import { useI18nStore } from '@/stores/i18n'
import { computed } from 'vue'
import FennecView from '@/fennec-view/FennecView'

const uiStore = useUIStore()
const i18n = useI18nStore()

const propertyPanel = computed(() => uiStore.propertyPanel)

const activeTab = computed(() => uiStore.activeTab)

function handleAnimationClick(animationName) {
    if (FennecView?.updateNodeProperty) {
        FennecView.updateNodeProperty('animation', animationName)
    }
}

function handleSkinClick(skinName) {
    if (FennecView?.updateNodeProperty) {
        FennecView.updateNodeProperty('skin', skinName)
    }
}

// Helper to check currently active animation & skin to highlight them
const activeAnimationName = computed(() => {
    return uiStore.propertyPanel.activeAnimationName || ''
})

const activeSkinName = computed(() => {
    return uiStore.propertyPanel.activeSkinName || ''
})

const isLive2D = computed(() => {
    return uiStore.propertyPanel.currentNode?.type === 'live2d'
})

const live2dTransitionMode = computed({
    get() {
        return uiStore.propertyPanel.currentNode?.transitionMode || 'loop'
    },
    set(value) {
        if (FennecView?.updateNodeProperty) {
            FennecView.updateNodeProperty('live2dTransitionMode', value)
        }
    }
})

const live2dFadeIn = computed({
    get() {
        return uiStore.propertyPanel.currentNode?.live2dFadeIn !== undefined ? uiStore.propertyPanel.currentNode.live2dFadeIn : 0.1
    },
    set(value) {
        if (FennecView?.updateNodeProperty) {
            FennecView.updateNodeProperty('live2dFadeIn', value)
        }
    }
})

const live2dFadeOut = computed({
    get() {
        return uiStore.propertyPanel.currentNode?.live2dFadeOut !== undefined ? uiStore.propertyPanel.currentNode.live2dFadeOut : 0.1
    },
    set(value) {
        if (FennecView?.updateNodeProperty) {
            FennecView.updateNodeProperty('live2dFadeOut', value)
        }
    }
})
</script>

<template>
    <div class="anim-skin-panel">
        <div v-if="!propertyPanel.currentNode" class="no-selection">
            {{ i18n.t('propNoNodeSelected') }}
        </div>
        <template v-else>
            <div class="panel-section">
                <div class="section-title">{{ i18n.t('animListTitle') }}</div>
                
                <!-- Live2D Transition Mode Option -->
                <div v-if="isLive2D" class="live2d-options-block">
                    <div class="transition-mode-row">
                        <span class="selector-label">{{ i18n.t('live2dTransitionMode') }}</span>
                        <select v-model="live2dTransitionMode" class="ind-select">
                            <option value="loop">{{ i18n.t('live2dLoop') }}</option>
                            <option value="idle">{{ i18n.t('live2dBackToIdle') }}</option>
                            <option value="once">{{ i18n.t('live2dPlayOnce') }}</option>
                        </select>
                    </div>
                    <div class="transition-param-row">
                        <div class="param-title">
                            <span>{{ i18n.t('live2dFadeIn') }}</span>
                            <span class="value-badge">{{ live2dFadeIn }}s</span>
                        </div>
                        <input
                            class="ind-range"
                            type="range"
                            min="0"
                            max="5"
                            step="0.05"
                            v-model.number="live2dFadeIn"
                        />
                    </div>
                    <div class="transition-param-row">
                        <div class="param-title">
                            <span>{{ i18n.t('live2dFadeOut') }}</span>
                            <span class="value-badge">{{ live2dFadeOut }}s</span>
                        </div>
                        <input
                            class="ind-range"
                            type="range"
                            min="0"
                            max="5"
                            step="0.05"
                            v-model.number="live2dFadeOut"
                        />
                    </div>
                </div>

                <div class="ind-list-box list-container">
                    <div 
                        v-for="animation in propertyPanel.animationList" 
                        :key="animation.name"
                        class="ind-list-item"
                        :class="{ active: activeAnimationName === animation.name }"
                        @click="handleAnimationClick(animation.name)"
                    >
                        {{ animation.name }} ({{ animation.duration }}s)
                    </div>
                    <div v-if="!propertyPanel.animationList.length" class="empty-text">
                        {{ i18n.t('noAnimSkinLoaded') }}
                    </div>
                </div>
            </div>
            
            <div class="panel-section">
                <div class="section-title">{{ i18n.t('skinListTitle') }}</div>
                <div class="ind-list-box list-container">
                    <div 
                        v-for="skin in propertyPanel.skinList" 
                        :key="skin.name"
                        class="ind-list-item"
                        :class="{ active: activeSkinName === skin.name }"
                        @click="handleSkinClick(skin.name)"
                    >
                        {{ skin.name }}
                    </div>
                    <div v-if="!propertyPanel.skinList.length" class="empty-text">
                        {{ i18n.t('noAnimSkinLoaded') }}
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
.anim-skin-panel {
    padding: 10px;
}

.no-selection {
    text-align: center;
    color: var(--text-secondary);
    padding: 20px 0;
    font-size: 13px;
}

.panel-section {
    margin-bottom: 15px;
}

.section-title {
    font-size: 13px;
    font-weight: bold;
    color: var(--text-active);
    margin-bottom: 6px;
}

.list-container {
    max-height: 180px;
}

.empty-text {
    padding: 10px;
    font-size: 12px;
    color: var(--text-secondary);
    text-align: center;
}

.transition-mode-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding: 2px 4px;
    gap: 8px;
}

.selector-label {
    font-size: 12px;
    color: var(--text-secondary);
    white-space: nowrap;
}

.ind-select {
    flex: 1;
    background-color: var(--bg-dark-input);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: 4px 8px;
    font-size: 12px;
    outline: none;
    cursor: pointer;
    font-family: inherit;
    border-radius: 2px;
}

.ind-select:focus {
    border-color: var(--bg-dark-active);
}

.live2d-options-block {
    margin-bottom: 8px;
    padding: 0 4px;
}

.transition-param-row {
    margin-top: 6px;
    padding: 0 4px;
}

.param-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--text-secondary);
}

.value-badge {
    font-size: 11px;
    color: var(--text-secondary);
    background-color: var(--bg-dark-input);
    padding: 1px 5px;
    border-radius: 2px;
}
</style>
