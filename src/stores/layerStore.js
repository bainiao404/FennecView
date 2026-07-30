import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLayerStore = defineStore('layers', () => {
    const layers = ref([])
    const nextId = ref(1)

    // Sorted active layers to determine render order (lowest z first)
    const orderedLayers = computed(() => {
        return [...layers.value].sort((a, b) => {
            if (a.z !== b.z) {
                return a.z - b.z
            }
            return a.id - b.id
        })
    })

    // Compute the topmost active/visible layer in the stack
    const activeTopLayer = computed(() => {
        const visibleLayers = layers.value.filter((l) => l.visible)
        if (visibleLayers.length === 0) return null
        return [...visibleLayers].sort((a, b) => {
            if (b.z !== a.z) {
                return b.z - a.z
            }
            return b.id - a.id
        })[0]
    })

    // Add a new layer (supports singleton/single-instance mode)
    function add({
        name,
        z,
        direction = 'right-to-left',
        duration = 700,
        props = {},
        singleton = false,
        showMenuBtn = true,
    }) {
        if (name === 'Home') {
            singleton = true
        }
        if (singleton) {
            const existingLayer = layers.value.find((l) => l.name === name)
            if (existingLayer) {
                // If it is already the active top visible layer, do nothing to prevent reload
                if (activeTopLayer.value && activeTopLayer.value.id === existingLayer.id && existingLayer.visible) {
                    return existingLayer
                }
                // Calculate the new highest z-index to bring it to the top
                const otherLayers = layers.value.filter((l) => l.id !== existingLayer.id)
                let finalZ = z
                if (finalZ === undefined || finalZ === null || finalZ === '') {
                    if (otherLayers.length === 0) {
                        finalZ = 10
                    } else {
                        const maxZ = Math.max(...otherLayers.map((l) => l.z))
                        finalZ = maxZ + 10
                    }
                } else {
                    finalZ = Number(finalZ)
                }

                // Create a updated layer structure with a new unique ID
                // to trigger Vue's Transition element animation when switching
                const updatedLayer = {
                    id: nextId.value++,
                    name: existingLayer.name,
                    z: finalZ,
                    direction: direction || 'right-to-left',
                    duration: duration !== undefined && duration !== null && duration !== '' ? Number(duration) : 700,
                    visible: true,
                    props:
                        props && Object.keys(props).length > 0
                            ? { ...existingLayer.props, ...props }
                            : existingLayer.props,
                    showMenuBtn: showMenuBtn !== false,
                }

                // Replace the old layer with the animated new ID instance in place
                const index = layers.value.findIndex((l) => l.id === existingLayer.id)
                if (index !== -1) {
                    layers.value[index] = updatedLayer
                }
                return updatedLayer
            }
        }

        let finalZ = z
        if (finalZ === undefined || finalZ === null || finalZ === '') {
            if (layers.value.length === 0) {
                finalZ = 10
            } else {
                const maxZ = Math.max(...layers.value.map((l) => l.z))
                finalZ = maxZ + 10
            }
        } else {
            finalZ = Number(finalZ)
        }

        const newLayer = {
            id: nextId.value++,
            name,
            z: finalZ,
            direction: direction || 'right-to-left',
            duration: duration !== undefined && duration !== null && duration !== '' ? Number(duration) : 700,
            visible: true, // Vue transition flag
            props: props || {}, // custom props passed to component
            showMenuBtn: showMenuBtn !== false,
        }
        layers.value.push(newLayer)
        return newLayer
    }

    // Set visible flag to false to trigger exit animation
    function remove(id) {
        const layer = layers.value.find((l) => l.id === id)
        if (layer) {
            const visibleLayers = layers.value.filter((l) => l.visible)
            if (layer.name === 'Home' && visibleLayers.length === 1 && visibleLayers[0].id === id) {
                // Do not allow removing the last visible Home page to prevent reload
                return
            }
            layer.visible = false
        }
    }

    // Back operation: remove the top-most visible layer
    function back() {
        if (layers.value.length === 0) return false

        // Search from top (highest z first, then highest id)
        const sorted = [...layers.value].sort((a, b) => {
            if (b.z !== a.z) {
                return b.z - a.z
            }
            return b.id - a.id
        })

        const topLayer = sorted.find((l) => l.visible)
        if (topLayer) {
            const visibleLayers = layers.value.filter((l) => l.visible)
            if (topLayer.name === 'Home' && visibleLayers.length === 1) {
                // Already the bottom Home page, do not pop to prevent reload
                return false
            }
            topLayer.visible = false
            return true
        }
        return false
    }

    // Actually delete the layer from array (called after transition ends)
    // If it's Home, we do not delete it, but put it at the bottom (z = 10) and restore visibility.
    function finalizeRemove(id) {
        const layer = layers.value.find((l) => l.id === id)
        if (layer && layer.name === 'Home') {
            layer.z = 10
            layer.visible = true
            layer.id = nextId.value++
        } else {
            layers.value = layers.value.filter((l) => l.id !== id)
        }
    }

    // Clear all layers (each transitions out)
    function clear() {
        const homeLayer = layers.value.find((l) => l.name === 'Home')
        if (homeLayer) {
            layers.value.forEach((l) => {
                if (l.id !== homeLayer.id) {
                    l.visible = false
                } else {
                    l.visible = true
                    l.z = 10 // Reset Home to bottom z-index
                }
            })
        } else {
            layers.value.forEach((l) => {
                l.visible = false
            })
        }
    }

    return {
        layers,
        orderedLayers,
        activeTopLayer,
        add,
        remove,
        back,
        finalizeRemove,
        clear,
    }
})
