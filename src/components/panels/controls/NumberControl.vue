<script setup>
defineProps({
    value: [Number, String],
    schema: { type: Object, default: () => ({}) }
})

defineEmits(['change'])
</script>

<template>
    <input
        type="number"
        :value="value"
        :step="schema.step ?? 1"
        @change="$emit('change', $event.target.value)"
        @keydown.enter="$event.target.blur()"
        class="attr-input"
    />
</template>

<style scoped>
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

/* Hide number input spinners on Chrome/Safari/Edge and Firefox */
input[type=number] {
    -moz-appearance: textfield;
}

input[type=number]::-webkit-outer-spin-button,
input[type=number]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
</style>
