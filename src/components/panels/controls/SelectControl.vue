<script setup>
defineProps({
    value: [String, Number],
    schema: { type: Object, default: () => ({ options: [] }) }
})

defineEmits(['change'])
</script>

<template>
    <select
        :value="value"
        @change="$emit('change', $event.target.value)"
        class="attr-select"
    >
        <option
            v-for="opt in schema.options"
            :key="opt.value"
            :value="opt.value"
        >
            {{ opt.label }}
        </option>
    </select>
</template>

<style scoped>
.attr-select {
    width: 100%;
    background-color: var(--bg-dark-panel, #1e1e1e);
    border: 1px solid var(--border-color, #333);
    color: var(--text-active, #fff);
    font-size: 11px;
    padding: 3px 6px;
    border-radius: 3px;
    outline: none;
    transition: border-color 0.15s ease;
    cursor: pointer;
    box-sizing: border-box;
}

.attr-select:focus {
    border-color: var(--bg-dark-active, #0052d9);
}
</style>
