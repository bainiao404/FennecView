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

const ext = computed(() => entryFile.value.name.split('.').pop().toLowerCase())
const isVideo = computed(() => props.item.type === 'video')

// Format file size helper
function formatBytes(bytes) {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<template>
    <div class="media-config">
        <!-- Node name -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '图层/节点名称' : 'Node Name' }}</label>
            <input type="text" class="ind-input-text" v-model="config.name" />
        </div>

        <!-- Media file info -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '源媒体文件' : 'Media File' }}</label>
            <div class="info-row">
                <span class="badge" :class="isVideo ? 'badge-video' : 'badge-img'">
                    {{ isVideo ? 'Video (' + ext + ')' : 'Image (' + ext + ')' }}
                </span>
                <span class="file-path font-mono" :title="entryFile.relativePath">
                    {{ entryFile.name }}
                </span>
            </div>
        </div>

        <!-- File size info -->
        <div class="form-group" v-if="entryFile.size > 0">
            <label class="form-label">{{ i18n.locale === 'zh' ? '文件大小' : 'File Size' }}</label>
            <div class="info-row size-row">
                <span class="size-val font-mono">{{ formatBytes(entryFile.size) }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.media-config {
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

.size-row {
    font-size: 12px;
    color: var(--text-secondary);
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

.badge-img {
    background-color: #059669;
}

.badge-video {
    background-color: #d97706;
}
</style>
