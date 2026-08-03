<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

// 假设设计稿基准宽度为 1280
const DESIGN_WIDTH = 1280
const gameSystem = { dpi: 1 }

const scale = ref(1)

/** 网页窗口适配逻辑 */
function updateScale() {
    // 如果是 Cordova 环境则根据宽度计算比例，否则保持 1:1
    if (window.cordova) {
        scale.value = (window.innerWidth / DESIGN_WIDTH) * gameSystem.dpi
    } else {
        scale.value = gameSystem.dpi
    }
}

// 响应式样式绑定
const containerStyle = computed(() => ({
    transform: `scale(${scale.value})`,
    transformOrigin: 'left top', // 从左上角开始缩放
    width: window.cordova ? `${DESIGN_WIDTH}px` : '100%',
    height: window.cordova ? `${window.innerHeight / scale.value}px` : '100%',
}))

onMounted(() => {
    updateScale()
    window.addEventListener('resize', updateScale)
})

onUnmounted(() => {
    window.removeEventListener('resize', updateScale)
})

updateScale()
</script>

<template>
    <div class="app-container" :style="containerStyle">
        <div class="boxMode1">
            <slot></slot>
        </div>
    </div>
</template>

<style scoped>
.app-container {
    position: absolute;
    left: 0;
    top: 0;
    background: var(--bg-dark-app, #121212);
}

.boxMode1 {
    position: absolute;
    height: 100%;
    width: 100%;
    left: 0;
    top: 0;
}
</style>
