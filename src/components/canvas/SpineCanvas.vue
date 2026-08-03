<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useUIStore } from '@/stores/uiStore'
import FennecView from '@/fennec-view/FennecView'
import CanvasControls from './CanvasControls.vue'

const props = defineProps({
    isLeftPanelCollapsed: {
        type: Boolean,
        default: true,
    },
})

const uiStore = useUIStore()

// Get canvas viewport and display variables from the Pinia store
const scale = computed(() => uiStore.canvasDisplay.scale)
const canvasPosition = computed(() => uiStore.canvasDisplay.canvasPosition)
const worldPosition = computed(() => uiStore.canvasDisplay.worldPosition)

const xRuler = ref(null)
const yRuler = ref(null)

const isRightPanelVisible = computed(() => uiStore.layerPanel.isVisible)

// Calculate visible offsets so the rulers adjust to sidebar state
const leftOffset = computed(() => {
    if (uiStore.previewMode.isActive) return 0
    return props.isLeftPanelCollapsed ? 55 : 320
})

const rightOffset = computed(() => {
    if (uiStore.previewMode.isActive) return 0
    return isRightPanelVisible.value ? 260 : 0
})

// Reactive window size tracking
const windowWidth = ref(window.innerWidth)
const windowHeight = ref(window.innerHeight)

const xRulerWidth = computed(() => {
    return windowWidth.value - leftOffset.value - (rightOffset.value + 20)
})

const yRulerHeight = computed(() => {
    return windowHeight.value - 20
})

function handleMouseDown(e) {
    if (FennecView?.handleRightClickDrag) FennecView.handleRightClickDrag(e, 0)
}
function handleMouseUp(e) {
    if (FennecView?.handleRightClickDrag) FennecView.handleRightClickDrag(e, 1)
}

// Drawing logic for X & Y rulers
function drawRulers() {
    drawXRuler()
    drawYRuler()
}

function drawXRuler() {
    const canvas = xRuler.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (width <= 0 || height <= 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    // Clear and draw background
    ctx.fillStyle = 'rgba(20, 20, 20, 0.85)'
    ctx.fillRect(0, 0, width, height)

    // Draw top horizontal boundary line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, 0.5)
    ctx.lineTo(width, 0.5)
    ctx.stroke()

    const sVal = scale.value
    const wPos = worldPosition.value

    const niceInterval = getNiceInterval(sVal)
    const step = niceInterval / 10

    const startWorldX = (leftOffset.value - wPos.x) / sVal
    const endWorldX = (leftOffset.value + width - wPos.x) / sVal

    const start = Math.floor(startWorldX / step) * step
    const end = Math.ceil(endWorldX / step) * step

    for (let wX = start; wX <= end; wX += step) {
        const absSX = wPos.x + wX * sVal
        const sX = absSX - leftOffset.value

        if (sX < 0 || sX > width) continue

        const isMajor = Math.abs(wX % niceInterval) < 1e-5
        const isMedium = Math.abs(wX % (niceInterval / 2)) < 1e-5

        if (isMajor) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
            ctx.beginPath()
            ctx.moveTo(sX, 0)
            ctx.lineTo(sX, 8)
            ctx.stroke()

            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
            ctx.font = '8px monospace'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            ctx.fillText(Math.round(wX).toString(), sX, 9)
        } else if (isMedium) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
            ctx.beginPath()
            ctx.moveTo(sX, 0)
            ctx.lineTo(sX, 6)
            ctx.stroke()
        } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
            ctx.beginPath()
            ctx.moveTo(sX, 0)
            ctx.lineTo(sX, 4)
            ctx.stroke()
        }
    }

    // Draw interactive cursor position indicator
    if (canvasPosition.value) {
        const cursorRulerX = canvasPosition.value.x - leftOffset.value
        if (cursorRulerX >= 0 && cursorRulerX <= width) {
            ctx.strokeStyle = '#0052d9'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(cursorRulerX, 0)
            ctx.lineTo(cursorRulerX, height)
            ctx.stroke()
        }
    }
}

function drawYRuler() {
    const canvas = yRuler.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (width <= 0 || height <= 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    // Clear and draw background
    ctx.fillStyle = 'rgba(20, 20, 20, 0.85)'
    ctx.fillRect(0, 0, width, height)

    // Draw left vertical boundary line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0.5, 0)
    ctx.lineTo(0.5, height)
    ctx.stroke()

    const sVal = scale.value
    const wPos = worldPosition.value

    const niceInterval = getNiceInterval(sVal)
    const step = niceInterval / 10

    const startWorldY = (0 - wPos.y) / sVal
    const endWorldY = (height - wPos.y) / sVal

    const start = Math.floor(startWorldY / step) * step
    const end = Math.ceil(endWorldY / step) * step

    for (let wY = start; wY <= end; wY += step) {
        const sY = wPos.y + wY * sVal

        if (sY < 0 || sY > height) continue

        const isMajor = Math.abs(wY % niceInterval) < 1e-5
        const isMedium = Math.abs(wY % (niceInterval / 2)) < 1e-5

        if (isMajor) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
            ctx.beginPath()
            ctx.moveTo(0, sY)
            ctx.lineTo(8, sY)
            ctx.stroke()

            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
            ctx.font = '8px monospace'
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            ctx.fillText(Math.round(wY).toString(), 10, sY)
        } else if (isMedium) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
            ctx.beginPath()
            ctx.moveTo(0, sY)
            ctx.lineTo(6, sY)
            ctx.stroke()
        } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
            ctx.beginPath()
            ctx.moveTo(0, sY)
            ctx.lineTo(4, sY)
            ctx.stroke()
        }
    }

    // Draw interactive cursor position indicator
    if (canvasPosition.value) {
        const cursorRulerY = canvasPosition.value.y
        if (cursorRulerY >= 0 && cursorRulerY <= height) {
            ctx.strokeStyle = '#0052d9'
            ctx.lineWidth = 1.5
            ctx.beginPath()
            ctx.moveTo(0, cursorRulerY)
            ctx.lineTo(width, cursorRulerY)
            ctx.stroke()
        }
    }
}

function getNiceInterval(scaleVal) {
    const rawInterval = 100 / scaleVal
    const intervals = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]
    for (let i = 0; i < intervals.length; i++) {
        if (intervals[i] >= rawInterval) {
            return intervals[i]
        }
    }
    return intervals[intervals.length - 1]
}

function handleResize() {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
    drawRulers()
}

// Watch store events and reactive coordinates to redraw
watch(
    [
        scale,
        leftOffset,
        rightOffset,
        xRulerWidth,
        yRulerHeight,
        () => worldPosition.value.x,
        () => worldPosition.value.y,
        () => canvasPosition.value?.x,
        () => canvasPosition.value?.y
    ],
    () => {
        nextTick(() => {
            drawRulers()
        })
    }
)

onMounted(() => {
    window.addEventListener('resize', handleResize)
    nextTick(() => {
        drawRulers()
    })
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})
</script>

<template>
    <div class="canvas-wrapper-inner">
        <div id="app_canvas" class="canvas-container" @mousedown="handleMouseDown" @mouseup="handleMouseUp">
            <div v-if="!uiStore.previewMode.isActive" class="canvas-info">
                <span class="appWorld-information">Scale: {{ scale.toFixed(2) }}</span>
                <span class="appWorld-information">Win:{{ canvasPosition.x }}/{{ canvasPosition.y }}</span>
                <span class="appWorld-information"
                    >World:{{ Math.round(worldPosition.x * 100) / 100 }}/{{
                        Math.round(worldPosition.y * 100) / 100
                    }}</span
                >
            </div>
        </div>

        <!-- X-axis ruler at the bottom -->
        <canvas
            v-if="!uiStore.previewMode.isActive && uiStore.mainUI.leftMenuVisible"
            ref="xRuler"
            class="ruler x-ruler"
            :style="{ left: leftOffset + 'px', width: xRulerWidth + 'px' }"
        ></canvas>

        <!-- Y-axis ruler at the right -->
        <canvas
            v-if="!uiStore.previewMode.isActive && uiStore.mainUI.leftMenuVisible"
            ref="yRuler"
            class="ruler y-ruler"
            :style="{ right: rightOffset + 'px', height: yRulerHeight + 'px' }"
        ></canvas>

        <!-- Ruler corner junction block -->
        <div
            v-if="!uiStore.previewMode.isActive && uiStore.mainUI.leftMenuVisible"
            class="ruler-corner"
            :style="{ right: rightOffset + 'px' }"
        ></div>

        <CanvasControls :right-offset="rightOffset" />
    </div>
</template>

<style scoped>
.canvas-wrapper-inner {
    position: relative;
    width: 100%;
    height: 100%;
}

.canvas-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.canvas-info {
    position: absolute;
    bottom: 24px;
    left: 60px;
    color: rgb(72, 72, 72);
}

.ruler {
    position: absolute;
    z-index: 5;
    pointer-events: none;
    background-color: var(--glass-bg-canvas);
    backdrop-filter: var(--glass-blur-canvas);
    -webkit-backdrop-filter: var(--glass-blur-canvas);
}

.x-ruler {
    bottom: 0;
    height: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.y-ruler {
    top: 0;
    width: 20px;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.ruler-corner {
    position: absolute;
    bottom: 0;
    width: 20px;
    height: 20px;
    background-color: var(--glass-bg-canvas);
    backdrop-filter: var(--glass-blur-canvas);
    -webkit-backdrop-filter: var(--glass-blur-canvas);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 5;
    pointer-events: none;
}

.btn-icon {
    width: 16px;
    height: 16px;
}
</style>
