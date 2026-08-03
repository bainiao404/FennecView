<script setup>
defineProps({
    value: [String, Number, Boolean],
    schema: { type: Object, default: () => ({}) }
})
</script>

<template>
    <span class="attr-val">{{ value }}</span>
</template>

<style scoped>
.attr-val {
    color: var(--text-active, #fff);
    font-family: monospace;
    line-height: 22px;
    font-size: 12px;
}
</style>
