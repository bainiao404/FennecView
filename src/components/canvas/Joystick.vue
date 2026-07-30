<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/uiStore'
import FennecView from '@/fennec-view/FennecView'

const uiStore = useUIStore()

const isMobile = computed(() => {
    if (typeof window === 'undefined') return false
    return !!window.cordova || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent)
})

const dragging = ref(false)
const vx = ref(0)
const vy = ref(0)
const knobStyle = ref({
    transform: 'translate(-50%, -50%)'
})

const maxDistance = 30 // Max dragging radius in px
let startX = 0
let startY = 0
let animationFrameId = null

function handlePointerDown(e) {
    // Prevent default scroll/zoom gestures
    e.preventDefault()
    dragging.value = true
    startX = e.clientX
    startY = e.clientY
    vx.value = 0
    vy.value = 0
    
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    
    // Start continuous movement loop
    stopLoop()
    startLoop()
}

function handlePointerMove(e) {
    if (!dragging.value) return
    let dx = e.clientX - startX
    let dy = e.clientY - startY
    
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance > maxDistance) {
        dx = (dx / distance) * maxDistance
        dy = (dy / distance) * maxDistance
    }
    
    vx.value = dx / maxDistance
    vy.value = dy / maxDistance
    
    knobStyle.value = {
        transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
    }
}

function handlePointerUp() {
    dragging.value = false
    vx.value = 0
    vy.value = 0
    knobStyle.value = {
        transform: 'translate(-50%, -50%)'
    }
    
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    stopLoop()
}

function startLoop() {
    const updateLoop = () => {
        if (dragging.value) {
            const baseSpeed = 8 // base panning speed in screen pixels
            const deltaX = -vx.value * baseSpeed
            const deltaY = -vy.value * baseSpeed
            
            if (FennecView?.canvas?.world) {
                const world = FennecView.canvas.world
                world.x += deltaX
                world.y += deltaY
                FennecView.updateScale()
                uiStore.updateWorldPosition(world.x, world.y)
            }
            animationFrameId = requestAnimationFrame(updateLoop)
        }
    }
    animationFrameId = requestAnimationFrame(updateLoop)
}

function stopLoop() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
    }
}

onUnmounted(() => {
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    stopLoop()
})
</script>

<template>
    <div
        v-if="isMobile && !uiStore.previewMode.isActive"
        class="virtual-joystick"
        @pointerdown="handlePointerDown"
    >
        <div class="joystick-ring"></div>
        <div class="joystick-knob" :style="knobStyle"></div>
    </div>
</template>

<style scoped>
.virtual-joystick {
    position: absolute;
    bottom: 30px;
    right: 30px;
    width: 84px;
    height: 84px;
    background: var(--glass-bg-canvas);
    border: 2px solid rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    backdrop-filter: var(--glass-blur-joystick);
    -webkit-backdrop-filter: var(--glass-blur-joystick);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    z-index: 1000;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
}

.joystick-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    box-sizing: border-box;
}

.joystick-knob {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 36px;
    height: 36px;
    background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.8) 0%, rgba(220, 220, 220, 0.6) 50%, rgba(180, 180, 180, 0.5) 100%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.4);
    pointer-events: none;
}

.virtual-joystick:active {
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(40, 40, 40, 0.55);
}
</style>
