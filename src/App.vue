<script setup>
import { onMounted } from 'vue'
import AutomaticRefresh from '@/components/layout/AutomaticRefresh.vue'
import AppShell from '@/components/layout/AppShell.vue'
import { initFennecView } from './fennec-view/initFennecView'

onMounted(async () => {
    await initFennecView()
})
</script>

<template>
    <AppShell />
    <AutomaticRefresh :up-time="2000" />
</template>
