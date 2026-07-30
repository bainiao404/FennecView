<script setup>
import { useI18nStore } from '@/stores/i18n'
import { computed } from 'vue'

const i18n = useI18nStore()
const appVersion = 'v1.2.0'
</script>

<template>
    <div class="about-view ind-content">
        <!-- Hero Section -->
        <div class="about-hero ind-panel glass-panel">
            <div class="hero-accent-bar"></div>
            <div class="hero-content">
                <h1 class="logo-title">FennecView</h1>
                <p class="tagline">{{ i18n.t('aboutTechStackText') }}</p>
                <div class="version-badge">{{ appVersion }}</div>
            </div>
        </div>

        <div class="about-grid">
            <!-- Left Side: Tech Architecture & Supported Versions -->
            <div class="grid-col">
                <div class="about-card ind-panel glass-panel">
                    <div class="ind-header">{{ i18n.t('aboutTechStackTitle') }}</div>
                    <div class="card-body">
                        <div class="tech-item">
                            <span class="tech-label">Framework</span>
                            <span class="tech-val font-mono">Vue 3 (Composition API)</span>
                        </div>
                        <div class="tech-item">
                            <span class="tech-label">State Management</span>
                            <span class="tech-val font-mono">Pinia Store</span>
                        </div>
                        <div class="tech-item">
                            <span class="tech-label">Rendering Engine</span>
                            <span class="tech-val font-mono">PixiJS v8</span>
                        </div>
                        <div class="tech-item">
                            <span class="tech-label">Video Encoder</span>
                            <span class="tech-val font-mono">WebCodecs API & MP4Box</span>
                        </div>
                    </div>
                </div>

                <div class="about-card ind-panel glass-panel">
                    <div class="ind-header">{{ i18n.t('aboutSupportedVersions') }}</div>
                    <div class="card-body highlight-body">
                        <p class="versions-text">{{ i18n.t('aboutSupportedList') }}</p>
                    </div>
                </div>
            </div>

            <!-- Right Side: Core Features -->
            <div class="grid-col">
                <div class="about-card ind-panel glass-panel">
                    <div class="ind-header">{{ i18n.t('aboutFeaturesTitle') }}</div>
                    <div class="card-body scrollable-body">
                        <ul class="features-list">
                            <li v-for="(feat, index) in i18n.t('aboutFeatureItems')" :key="index">
                                <span class="feature-bullet">✦</span>
                                <span class="feature-text">{{ feat }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- Full Width: User Instructions -->
        <div class="about-card ind-panel glass-panel instructions-card">
            <div class="ind-header">{{ i18n.t('aboutInstructionsTitle') }}</div>
            <div class="card-body scrollable-body">
                <ul class="instructions-list">
                    <li v-for="(line, index) in i18n.t('aboutInstructionLines')" :key="index">
                        <span class="instruction-num">{{ index + 1 }}</span>
                        <span class="instruction-text">{{ line }}</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<style scoped>
.about-view {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    background-color: var(--bg-dark-app);
    box-sizing: border-box;
}

/* Glassmorphism panel base */
.glass-panel {
    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);
    border: var(--glass-border);
    transition: all 0.3s ease;
}

/* Hero Section */
.about-hero {
    position: relative;
    padding: 24px;
    border-radius: 6px;
    overflow: hidden;
    background: linear-gradient(135deg, rgba(30, 30, 30, 0.8), rgba(20, 20, 20, 0.9));
}

.hero-accent-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, var(--bg-dark-active), var(--accent-orange));
}

.logo-title {
    margin: 0 0 8px 0;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: 1px;
    background: linear-gradient(90deg, #ffffff, #aaaaaa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.tagline {
    margin: 0;
    font-size: 13px;
    color: var(--text-primary);
    max-width: 700px;
    line-height: 1.5;
}

.version-badge {
    position: absolute;
    top: 24px;
    right: 24px;
    background-color: var(--bg-dark-active);
    color: var(--text-active);
    padding: 2px 8px;
    font-size: 11px;
    font-weight: bold;
    border-radius: 4px;
    font-family: monospace;
}

/* Grid Layout */
.about-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

@media (max-width: 768px) {
    .about-grid {
        grid-template-columns: 1fr;
    }
}

.grid-col {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.about-card {
    border-radius: 6px;
    overflow: hidden;
}

.card-body {
    padding: 16px;
    background-color: rgba(30, 30, 30, 0.45);
    font-size: 13px;
    line-height: 1.6;
}

.highlight-body {
    background: linear-gradient(135deg, rgba(217, 119, 6, 0.1), rgba(14, 99, 156, 0.05));
}

.versions-text {
    margin: 0;
    font-family: monospace;
    font-size: 13px;
    color: var(--accent-orange);
    font-weight: bold;
}

/* Tech List */
.tech-item {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.tech-item:last-child {
    border-bottom: none;
}
.tech-label {
    color: var(--text-secondary);
}
.tech-val {
    color: var(--text-active);
}

/* Feature List */
.features-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.features-list li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

.feature-bullet {
    color: var(--bg-dark-active);
    font-weight: bold;
}

.feature-text {
    color: var(--text-primary);
}

/* Instructions */
.instructions-card {
    margin-bottom: 20px;
}

.instructions-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.instructions-list li {
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.instruction-num {
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: bold;
    flex-shrink: 0;
}

.instruction-text {
    color: var(--text-primary);
    padding-top: 1px;
}
</style>
