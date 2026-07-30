<template>
    <header class="page-header">
        <div class="header-left">
            <button v-if="showBack" class="header-back-btn" @click="handleBack" aria-label="返回">
                <chevron-left-icon size="16px" />
            </button>
        </div>
        <div class="header-center">
            <h1 class="header-title">{{ title }}</h1>
        </div>
        <div class="header-right">
            <slot name="actions"></slot>
        </div>
    </header>
</template>

<script setup>
import { ChevronLeftIcon } from 'tdesign-icons-vue-next'
import { useLayerStore } from '@/stores/layerStore'

const props = defineProps({
    title: {
        type: String,
        default: '',
    },
    showBack: {
        type: Boolean,
        default: true,
    },
    customBack: {
        type: Function,
        default: null,
    },
})

const emit = defineEmits(['back'])
const layerStore = useLayerStore()

function handleBack() {
    if (props.customBack) {
        props.customBack()
    } else {
        emit('back')
        // Default back handler if not intercepted
        layerStore.back()
    }
}
</script>

<style scoped>
.page-header {
    width: 100%;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    border-bottom: 1px solid var(--border-color, #333333);
    background: var(--bg-dark-sidebar, #252526);
    box-sizing: border-box;
    position: relative;
    z-index: 10;
    user-select: none;
}

.header-left,
.header-right {
    min-width: 30px;
    display: flex;
    align-items: center;
}

.header-left {
    justify-content: flex-start;
}

.header-right {
    justify-content: flex-end;
    gap: 6px;
}

.header-back-btn {
    width: 26px;
    height: 26px;
    border-radius: 0px;
    border: 1px solid var(--border-color, #333333);
    background: var(--bg-dark-input, #2d2d2d);
    color: var(--text-primary, #cccccc);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s ease;
}

.header-back-btn:hover {
    background: var(--bg-dark-hover, #333333);
}

.header-back-btn:active {
    background: var(--bg-dark-active, #0e639c);
}

.header-center {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    overflow: hidden;
}

.header-title {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-active, #ffffff);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
}
</style>
