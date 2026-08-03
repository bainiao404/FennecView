<script setup>
defineProps({
    value: [Number, String],
    schema: { type: Object, default: () => ({}) }
})

defineEmits(['change'])
</script>

<template>
    <div class="slider-control-wrapper">
        <input
            type="range"
            :value="value"
            :min="schema.min ?? 0"
            :max="schema.max ?? 1"
            :step="schema.step ?? 0.01"
            @input="$emit('change', Number($event.target.value))"
            class="attr-slider"
        />
        <span class="slider-val-readout" :style="{ width: schema.suffix ? 'auto' : '32px' }">
            {{ value }}{{ schema.suffix || '' }}
        </span>
    </div>
</template>

<style scoped>
.slider-control-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
}

.attr-slider {
    flex: 1;
    min-width: 0;
    height: 4px;
    background: var(--border-color, #333);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
}

.attr-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--text-active, #fff);
    border: 1px solid var(--border-color, #333);
    transition: background-color 0.1s;
}

.attr-slider::-webkit-slider-thumb:hover {
    background: var(--bg-dark-active, #0052d9);
}

.attr-slider::-moz-range-thumb {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--text-active, #fff);
    border: 1px solid var(--border-color, #333);
    cursor: pointer;
    transition: background-color 0.1s;
}

.attr-slider::-moz-range-thumb:hover {
    background: var(--bg-dark-active, #0052d9);
}

.slider-val-readout {
    font-family: monospace;
    font-size: 11px;
    color: var(--text-active, #fff);
    width: 32px;
    text-align: right;
}
</style>
