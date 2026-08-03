<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/uiStore'
import { useI18nStore } from '@/stores/i18n'
import FennecView from '@/fennec-view/FennecView'

const uiStore = useUIStore()
const i18n = useI18nStore()

const debugStyle = computed(() => uiStore.debug.style)

function setDebug(key, val) {
    if (FennecView?.debug?.setStyle) {
        FennecView.debug.setStyle({ [key]: val })
    }
}

function toggleDebugEnabled(val) {
    uiStore.setDebugEnabled(val);
    
    // Immediately apply/clear debug visualization on active nodes
    const box = FennecView.canvas?.box;
    if (box && box.children) {
        box.children.forEach(child => {
            if (child.setDebug) {
                // If enabling, show debug only for the currently selected node
                const isSelected = FennecView.click?.current === child;
                child.setDebug(val && isSelected);
            }
        });
    }
}
</script>

<template>
    <div class="debug-panel">
        <!-- Enable Debug Switch -->
        <div class="panel-row debug-switch-row">
            <label class="ind-checkbox-label main-switch-label">
                <input
                    type="checkbox"
                    :checked="uiStore.debug.enabled"
                    @change="(e) => toggleDebugEnabled(e.target.checked)"
                />
                {{ i18n.t('debugEnableSwitch') }}
            </label>
        </div>

        <div class="section-title">{{ i18n.t('debugDrawItems') }}</div>
        
        <div class="panel-row">
            <span class="row-label">{{ i18n.t('debugLineWidth') }} ({{ debugStyle.lineWidth }})</span>
            <input
                class="ind-range"
                type="range"
                min="1"
                max="10"
                :value="debugStyle.lineWidth"
                @input="(e) => setDebug('lineWidth', parseInt(e.target.value))"
            />
        </div>

        <div class="checkbox-group">
            <label class="ind-checkbox-label">
                <input
                    type="checkbox"
                    :checked="debugStyle.drawMeshHull"
                    @change="(e) => setDebug('drawMeshHull', e.target.checked)"
                />
                MeshHull
            </label>
            <label class="ind-checkbox-label">
                <input
                    type="checkbox"
                    :checked="debugStyle.drawMeshTriangles"
                    @change="(e) => setDebug('drawMeshTriangles', e.target.checked)"
                />
                MeshTriangles
            </label>
            <label class="ind-checkbox-label">
                <input
                    type="checkbox"
                    :checked="debugStyle.drawBones"
                    @change="(e) => setDebug('drawBones', e.target.checked)"
                />
                Bones
            </label>
            <label class="ind-checkbox-label">
                <input
                    type="checkbox"
                    :checked="debugStyle.drawPaths"
                    @change="(e) => setDebug('drawPaths', e.target.checked)"
                />
                drawPaths
            </label>
            <label class="ind-checkbox-label">
                <input
                    type="checkbox"
                    :checked="debugStyle.drawBoundingBoxes"
                    @change="(e) => setDebug('drawBoundingBoxes', e.target.checked)"
                />
                BoundingBoxes
            </label>
            <label class="ind-checkbox-label">
                <input
                    type="checkbox"
                    :checked="debugStyle.drawClipping"
                    @change="(e) => setDebug('drawClipping', e.target.checked)"
                />
                drawClipping
            </label>
            <label class="ind-checkbox-label">
                <input
                    type="checkbox"
                    :checked="debugStyle.drawRegionAttachments"
                    @change="(e) => setDebug('drawRegionAttachments', e.target.checked)"
                />
                RegionAttachments
            </label>
        </div>
    </div>
</template>

<style scoped>
.debug-panel {
    padding: 10px;
}

.debug-switch-row {
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px dashed var(--border-light);
}

.main-switch-label {
    font-size: 13px;
    font-weight: bold;
    color: var(--text-active);
}

.section-title {
    font-size: 13px;
    font-weight: bold;
    color: var(--text-active);
    margin-bottom: 12px;
}

.panel-row {
    margin-bottom: 12px;
}

.row-label {
    font-size: 12px;
    color: var(--text-secondary);
}

.checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
</style>
