<script setup>
defineProps({
    value: String,
    schema: { type: Object, default: () => ({}) }
})

defineEmits(['change'])
</script>

<template>
    <div class="color-control-wrapper">
        <input
            type="color"
            :value="value"
            @input="$emit('change', $event.target.value)"
            class="attr-color-picker"
        />
        <input
            type="text"
            :value="value"
            @change="$emit('change', $event.target.value)"
            @keydown.enter="$event.target.blur()"
            class="attr-input color-hex-input"
        />
    </div>
</template>

<style scoped>
.color-control-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
}

.attr-color-picker {
    width: 24px;
    height: 20px;
    border: 1px solid var(--border-color, #333);
    border-radius: 3px;
    background: none;
    cursor: pointer;
    padding: 0;
    box-sizing: border-box;
}

.attr-input {
    width: 100%;
    background-color: var(--bg-dark-panel, #1e1e1e);
    border: 1px solid var(--border-color, #333);
    color: var(--text-active, #fff);
    font-family: monospace;
    font-size: 12px;
    padding: 3px 6px;
    border-radius: 3px;
    text-align: right;
    outline: none;
    transition: border-color 0.15s ease;
    box-sizing: border-box;
}

.attr-input:focus {
    border-color: var(--bg-dark-active, #0052d9);
}

.color-hex-input {
    width: calc(100% - 30px);
}
</style>
