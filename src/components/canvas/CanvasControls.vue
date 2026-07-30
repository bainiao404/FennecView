<script setup>
import { useUIStore } from '@/stores/uiStore'
import FennecView from '@/fennec-view/FennecView'

const props = defineProps({
    rightOffset: {
        type: Number,
        required: true,
    },
})

const uiStore = useUIStore()

function handleCenterFit() {
    if (FennecView?.centerAndFitAll) {
        FennecView.centerAndFitAll()
    }
}

function handleScreenshot() {
    if (FennecView?.downloadScreenshotImg) {
        FennecView.downloadScreenshotImg()
    }
}
</script>

<template>
    <div
        v-if="!uiStore.previewMode.isActive && uiStore.mainUI.leftMenuVisible"
        class="canvas-controls"
        :style="{ right: rightOffset + 26 + 'px' }"
    >
        <!-- Center Fit Button -->
        <button
            class="control-btn"
            @click="handleCenterFit"
            :title="uiStore.locale === 'zh' ? '自适应居中所有元素' : 'Auto Center & Fit All Elements'"
        >
            <svg viewBox="0 0 16 16" fill="currentColor" class="btn-icon">
                <path
                    d="M1.5 1a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 1 0v-2.5h2.5a.5.5 0 0 0 0-1h-3zM12 1.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0v-2.5h-2.5a.5.5 0 0 1-.5-.5zM1 12a.5.5 0 0 1 .5.5v2.5h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5zm14 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1h2.5v-2.5a.5.5 0 0 1 .5-.5zM8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"
                />
            </svg>
        </button>

        <!-- Screenshot Button -->
        <button
            class="control-btn"
            @click="handleScreenshot"
            :title="uiStore.locale === 'zh' ? '截取屏幕' : 'Take Screenshot'"
        >
            <svg viewBox="0 0 16 16" fill="currentColor" class="btn-icon">
                <path
                    d="M15 12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1.172a3 3 0 0 0 2.12-.879l.83-.828A1 1 0 0 1 6.827 3h2.344a1 1 0 0 1 .707.293l.828.828A3 3 0 0 0 12.828 5H14a1 1 0 0 1 1 1v6zM2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2z"
                />
                <path d="M8 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm0 1a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
            </svg>
        </button>
    </div>
</template>

<style scoped>
.canvas-controls {
    position: absolute;
    top: 35px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 10;
}

.control-btn {
    width: 32px;
    height: 32px;
    background-color: var(--glass-bg-controls);
    border: 1px solid var(--border-color, #333);
    border-radius: 4px;
    color: var(--text-primary, #ccc);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: var(--glass-blur-controls);
}

.control-btn:hover {
    background-color: var(--bg-dark-active, #0052d9);
    border-color: var(--bg-dark-active, #0052d9);
    color: #fff;
    transform: scale(1.05);
}

.control-btn:active {
    transform: scale(0.95);
}

.btn-icon {
    width: 16px;
    height: 16px;
}
</style>
