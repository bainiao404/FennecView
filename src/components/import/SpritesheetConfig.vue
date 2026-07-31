<script setup>
import { computed } from 'vue'
import { useI18nStore } from '@/stores/i18n'

const props = defineProps({
    item: {
        type: Object,
        required: true
    }
})

const i18n = useI18nStore()

const config = computed(() => props.item.config)
const entryFile = computed(() => props.item.entryFile)
const associatedFiles = computed(() => props.item.associatedFiles)

const totalFrames = computed(() => {
    const json = config.value.originalJson
    if (!json || !json.frames) return 0
    return Object.keys(json.frames).length
})
</script>

<template>
    <div class="spritesheet-config">
        <!-- Node name -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '图层/节点名称' : 'Node Name' }}</label>
            <input type="text" class="ind-input-text" v-model="config.name" />
        </div>

        <!-- Spritesheet JSON path -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '精灵图 JSON 配置' : 'Spritesheet JSON' }}</label>
            <div class="info-row">
                <span class="badge badge-json">JSON</span>
                <span class="file-path font-mono" :title="entryFile.relativePath">
                    {{ entryFile.name }}
                </span>
            </div>
        </div>

        <!-- Spritesheet Image path -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '匹配图片纹理' : 'Matched Texture Image' }}</label>
            <div v-if="associatedFiles.image" class="info-row">
                <span class="badge badge-png">PNG</span>
                <span class="file-path font-mono" :title="associatedFiles.image.relativePath">
                    {{ associatedFiles.image.name }}
                </span>
            </div>
            <div v-else class="info-row empty">
                <span class="warning-text">⚠️ 缺失匹配的图片纹理</span>
            </div>
        </div>

        <!-- Spritesheet stats -->
        <div class="form-group" v-if="totalFrames > 0">
            <label class="form-label">{{ i18n.locale === 'zh' ? '切片统计信息' : 'Stats' }}</label>
            <div class="info-row stats-row">
                <span class="stats-label">{{ i18n.locale === 'zh' ? '包含帧数:' : 'Total Frames:' }}</span>
                <span class="stats-value font-mono">{{ totalFrames }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.spritesheet-config {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-label {
    font-size: 12px;
    font-weight: bold;
    color: var(--text-secondary);
}

.info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: var(--bg-dark-input);
    border: 1px solid var(--border-color);
    padding: 6px 10px;
    border-radius: 3px;
}

.info-row.empty {
    border-color: rgba(217, 119, 6, 0.4);
    background-color: rgba(217, 119, 6, 0.05);
}

.stats-row {
    justify-content: space-between;
    font-size: 12px;
}

.stats-label {
    color: var(--text-secondary);
}

.stats-value {
    color: var(--text-active);
    font-weight: bold;
}

.file-path {
    font-size: 12px;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.badge {
    font-size: 10px;
    font-weight: bold;
    padding: 1px 5px;
    border-radius: 2px;
    color: #fff;
    text-transform: uppercase;
}

.badge-json {
    background-color: #2563eb;
}

.badge-png {
    background-color: #7c3aed;
}

.warning-text {
    font-size: 11px;
    color: var(--accent-orange);
}
</style>
