<script setup>
defineProps({
    value: Boolean,
    schema: { type: Object, default: () => ({}) }
})

defineEmits(['change'])
</script>

<template>
    <label class="ind-switch">
        <input
            type="checkbox"
            :checked="value"
            @change="$emit('change', $event.target.checked)"
        />
        <span class="switch-slider"></span>
    </label>
</template>

<style scoped>
.ind-switch {
    position: relative;
    display: inline-block;
    width: 32px;
    height: 18px;
}

.ind-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.switch-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--bg-dark-panel, #1e1e1e);
    border: 1px solid var(--border-color, #333);
    transition: .2s;
    border-radius: 9px;
}

.switch-slider:before {
    position: absolute;
    content: "";
    height: 12px;
    width: 12px;
    left: 2px;
    bottom: 2px;
    background-color: var(--text-secondary, #888);
    transition: .2s;
    border-radius: 50%;
}

input:checked + .switch-slider {
    background-color: var(--bg-dark-active, #0e639c);
    border-color: var(--bg-dark-active, #0e639c);
}

input:checked + .switch-slider:before {
    transform: translateX(14px);
    background-color: var(--text-active, #fff);
}
</style>
