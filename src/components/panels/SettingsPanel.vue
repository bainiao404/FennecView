<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/uiStore'
import { useI18nStore } from '@/stores/i18n'
import { useLayerStore } from '@/stores/layerStore'
import FennecView from '@/fennec-view/FennecView'

const uiStore = useUIStore()
const i18n = useI18nStore()
const layerStore = useLayerStore()

function openAbout() {
    layerStore.add({ name: 'AboutView', singleton: true })
}

const canvasDisplay = computed(() => uiStore.canvasDisplay)

function setFPS(e) {
    const value = parseFloat(e.target.value)
    if (FennecView?.setFPS) {
        FennecView.setFPS(value)
    }
}

function setResolution(e) {
    const value = parseFloat(e.target.value)
    if (FennecView?.setResolution) {
        FennecView.setResolution(value)
    }
}

function setBgColor(e) {
    if (FennecView?.setBackgroundColor) {
        FennecView.setBackgroundColor('color', e.target.value)
    }
}

function setBgAlpha(e) {
    if (FennecView?.setBackgroundColor) {
        FennecView.setBackgroundColor('alpha', parseFloat(e.target.value))
    }
}
</script>

<template>
    <div class="settings-panel">
        <div class="panel-section">
            <div class="section-title">
                {{ i18n.t('targetFps') }}
                <span class="value-badge">{{ canvasDisplay.fps }}</span>
            </div>
            <input
                class="ind-range"
                type="range"
                min="5"
                max="120"
                :value="canvasDisplay.fps"
                @input="setFPS"
            />
        </div>

        <div class="panel-section">
            <div class="section-title">
                {{ i18n.t('renderResolution') }}
                <span class="value-badge">{{ canvasDisplay.resolution }}x</span>
            </div>
            <input
                class="ind-range"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                :value="canvasDisplay.resolution"
                @input="setResolution"
            />
        </div>

        <div class="panel-section">
            <div class="section-title">{{ i18n.t('backgroundColor') }}</div>
            <div class="color-row">
                <input class="color-picker" type="color" :value="canvasDisplay.backgroundColor" @input="setBgColor" />
                <input
                    class="ind-range alpha-slider"
                    type="range"
                    min="0"
                    max="1.0"
                    step="0.01"
                    :value="canvasDisplay.backgroundAlpha"
                    @input="setBgAlpha"
                />
            </div>
        </div>

        <div class="panel-section">
            <div class="section-title">{{ i18n.t('languageSelect') }}</div>
            <div class="lang-toggle">
                <div 
                    class="ind-btn lang-btn" 
                    :class="{ active: i18n.locale === 'zh' }"
                    @click="i18n.setLocale('zh')"
                >
                    中文
                </div>
                <div 
                    class="ind-btn lang-btn" 
                    :class="{ active: i18n.locale === 'en' }"
                    @click="i18n.setLocale('en')"
                >
                    English
                </div>
                <div 
                    class="ind-btn lang-btn" 
                    :class="{ active: i18n.locale === 'ja' }"
                    @click="i18n.setLocale('ja')"
                >
                    日本語
                </div>
            </div>
        </div>


        <div class="panel-section">
            <div class="section-title">
                {{ i18n.t('pixiAntialias') }}
                <span class="value-badge reload-badge">
                    {{ i18n.t('reloadRequired') }}
                </span>
            </div>
            <div class="glass-toggle">
                <div 
                    class="ind-btn toggle-btn" 
                    :class="{ active: uiStore.antialiasEnabled }"
                    @click="uiStore.setAntialiasEnabled(true)"
                >
                    {{ i18n.t('optionEnabled') }}
                </div>
                <div 
                    class="ind-btn toggle-btn" 
                    :class="{ active: !uiStore.antialiasEnabled }"
                    @click="uiStore.setAntialiasEnabled(false)"
                >
                    {{ i18n.t('optionDisabled') }}
                </div>
            </div>
        </div>

        <div class="panel-section about-section">
            <button class="ind-btn about-btn" @click="openAbout">
                <span class="about-icon">ℹ</span>
                {{ i18n.t('aboutTab') }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.settings-panel {
    padding: 10px;
}

.panel-section {
    margin-bottom: 16px;
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

.value-badge {
    font-size: 11px;
    color: var(--text-secondary);
    background-color: var(--bg-dark-input);
    padding: 1px 5px;
    border-radius: 2px;
}

.reload-badge {
    background-color: var(--bg-dark-active);
    color: var(--text-active);
}

.color-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.color-picker {
    border: 1px solid var(--border-color);
    background: transparent;
    padding: 0;
    width: 32px;
    height: 32px;
    cursor: pointer;
}

.alpha-slider {
    flex: 1;
}

.lang-toggle,
.glass-toggle {
    display: flex;
    gap: 5px;
}

.lang-btn,
.toggle-btn {
    flex: 1;
    text-align: center;
}
.lang-btn.active,
.toggle-btn.active {
    background-color: var(--bg-dark-active);
    color: var(--text-active);
    border-color: var(--bg-dark-active);
}

.about-section {
    margin-top: 24px;
}

.about-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: bold;
    background: linear-gradient(135deg, var(--bg-dark-input), rgba(30, 30, 30, 0.5));
    border-color: var(--border-light);
}

.about-icon {
    font-size: 16px;
}
</style>
