import { defineStore } from 'pinia'
import { ref, markRaw, defineAsyncComponent } from 'vue'
import {
    AdjustmentIcon,
    FilmIcon,
    LayersIcon,
    ViewListIcon,
    ImportIcon,
    DownloadIcon,
    BugIcon,
    ToolsIcon,
    SettingIcon,
    AddIcon
} from 'tdesign-icons-vue-next'

export const usePanelStore = defineStore('panels', () => {
    const registeredTabs = ref([
        { id: 'property', nameKey: 'tabProperty', icon: markRaw(AdjustmentIcon), component: markRaw(defineAsyncComponent(() => import('@/components/panels/PropertyPanel.vue'))) },
        { id: 'animationAndSkin', nameKey: 'tabAnimationSkin', icon: markRaw(FilmIcon), component: markRaw(defineAsyncComponent(() => import('@/components/panels/AnimationAndSkinPanel.vue'))) },
        { id: 'layers', nameKey: 'tabLayers', icon: markRaw(LayersIcon), component: markRaw(defineAsyncComponent(() => import('@/components/panels/LayersPanel.vue'))) },
        { id: 'slots', nameKey: 'tabSlots', icon: markRaw(ViewListIcon), component: markRaw(defineAsyncComponent(() => import('@/components/panels/SlotsPanel.vue'))) },
        { id: 'import', nameKey: 'tabImport', icon: markRaw(ImportIcon), component: markRaw(defineAsyncComponent(() => import('@/components/panels/ImportPanel.vue'))) },
        { id: 'add', nameKey: 'tabAdd', icon: markRaw(AddIcon), component: markRaw(defineAsyncComponent(() => import('@/components/panels/AddPanel.vue'))) },
        { id: 'export', nameKey: 'tabExport', icon: markRaw(DownloadIcon), component: markRaw(defineAsyncComponent(() => import('@/components/panels/ExportPanel.vue'))) },
        { id: 'debug', nameKey: 'tabDebug', icon: markRaw(BugIcon), component: markRaw(defineAsyncComponent(() => import('@/components/panels/DebugPanel.vue'))) },
        { id: 'tool', nameKey: 'tabTools', icon: markRaw(ToolsIcon), component: markRaw(defineAsyncComponent(() => import('@/components/panels/ToolPanel.vue'))) },
        { id: 'settings', nameKey: 'tabSettings', icon: markRaw(SettingIcon), component: markRaw(defineAsyncComponent(() => import('@/components/panels/SettingsPanel.vue'))) }
    ])

    function registerTab(tabConfig) {
        if (registeredTabs.value.some(t => t.id === tabConfig.id)) {
            console.warn(`Tab with id ${tabConfig.id} is already registered.`)
            return
        }
        registeredTabs.value.push({
            id: tabConfig.id,
            nameKey: tabConfig.nameKey,
            icon: markRaw(tabConfig.icon),
            component: markRaw(tabConfig.component)
        })
    }

    function unregisterTab(id) {
        registeredTabs.value = registeredTabs.value.filter(t => t.id !== id)
    }

    return {
        registeredTabs,
        registerTab,
        unregisterTab
    }
})
