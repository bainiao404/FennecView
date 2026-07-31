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

const isSkel = computed(() => entryFile.value.name.toLowerCase().endsWith('.skel'))
</script>

<template>
    <div class="spine-config">
        <!-- Asset Name Config -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '图层/节点名称' : 'Node Name' }}</label>
            <input type="text" class="ind-input-text" v-model="config.name" />
        </div>

        <!-- Skeleton Info -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '骨骼数据源' : 'Skeleton Data' }}</label>
            <div class="info-row">
                <span class="badge" :class="isSkel ? 'badge-skel' : 'badge-json'">
                    {{ isSkel ? 'Skel Binary' : 'JSON' }}
                </span>
                <span class="file-path font-mono" :title="entryFile.relativePath">
                    {{ entryFile.name }}
                </span>
            </div>
        </div>

        <!-- Atlas Info -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '图集描述文件 (.atlas)' : 'Atlas File' }}</label>
            <div v-if="associatedFiles.atlas" class="info-row">
                <span class="badge badge-atlas">Atlas</span>
                <span class="file-path font-mono" :title="associatedFiles.atlas.relativePath">
                    {{ associatedFiles.atlas.name }}
                </span>
            </div>
            <div v-else class="info-row empty">
                <span class="warning-text">⚠️ 缺少 .atlas 文件</span>
            </div>
        </div>

        <!-- Textures Info -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '关联纹理贴图' : 'Textures' }}</label>
            <div class="textures-list" v-if="associatedFiles.textures.length > 0">
                <div v-for="tex in associatedFiles.textures" :key="tex.relativePath" class="info-row texture-row">
                    <span class="badge badge-png">PNG</span>
                    <span class="file-path font-mono" :title="tex.relativePath">
                        {{ tex.name }}
                    </span>
                </div>
            </div>
            <div v-else class="info-row empty">
                <span class="warning-text">⚠️ 未检测到关联纹理</span>
            </div>
        </div>

        <!-- Spine Premultiplied Alpha Texture Mode -->
        <div class="form-group">
            <label class="form-label">{{ i18n.t('propTextureMode') }}</label>
            <select v-model="config.textureMode" class="attr-select">
                <option :value="0">{{ i18n.t('premultClose') }}</option>
                <option :value="1">{{ i18n.t('premultOnUpload') }}</option>
                <option :value="2">{{ i18n.t('premultOpen') }}</option>
                <option :value="3">{{ i18n.t('premultAuto') }}</option>
            </select>
        </div>
    </div>
</template>

<style scoped>
.spine-config {
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

.textures-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.texture-row {
    padding: 4px 8px;
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

.badge-skel {
    background-color: #d97706;
}

.badge-json {
    background-color: #2563eb;
}

.badge-atlas {
    background-color: #059669;
}

.badge-png {
    background-color: #7c3aed;
}

.warning-text {
    font-size: 11px;
    color: var(--accent-orange);
}

.attr-select {
    width: 100%;
    background-color: var(--bg-dark-input);
    border: 1px solid var(--border-color);
    color: var(--text-active);
    font-size: 12px;
    padding: 6px;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
}

.attr-select:focus {
    border-color: var(--bg-dark-active);
}
</style>
