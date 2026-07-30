<script setup>
import { computed, ref } from 'vue'
import { useUIStore } from '@/stores/uiStore'

const uiStore = useUIStore()

// 根据用户交互状态计算显示状态
const isVisible = computed(() => uiStore.userInteraction.isSelectingRect)
const hintText = computed(() => uiStore.userInteraction.rectHint)
const parameterText = computed(() => uiStore.userInteraction.rectParameters)

// 暴露 DOM 元素引用给外部脚本
const userRectRef = ref(null)
const hintTextRef = ref(null)
const parameterTextRef = ref(null)

defineExpose({
    userRectRef,
    hintTextRef,
    parameterTextRef
})
</script>

<template>
    <div
        id="userRect"
        ref="userRectRef"
        class="user-rect-overlay"
        v-show="isVisible"
    >
        <div
            id="userRectHintText"
            ref="hintTextRef"
            class="hint-text"
        >
            {{ hintText }}
        </div>
        <div
            id="userRectParameterText"
            ref="parameterTextRef"
            class="parameter-text"
        >{{ parameterText }}</div>
    </div>
</template>

<style scoped>
.user-rect-overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: rgba(149, 0, 0, 0.5);
}

.hint-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    font-size: 25px;
    pointer-events: none;
    color: aliceblue;
}

.parameter-text {
    position: absolute;
    top: 30px;
    left: 50%;
    width: 100%;
    transform: translateX(-50%);
    font-size: 20px;
    color: aliceblue;
    text-align: center;
}
</style>

