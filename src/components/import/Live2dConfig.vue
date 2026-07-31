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

const missingCrucial = computed(() => props.item.missingFiles.filter(f => f.type === 'crucial'))
const missingOptional = computed(() => props.item.missingFiles.filter(f => f.type === 'optional'))
</script>

<template>
    <div class="live2d-config">
        <!-- Node name -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '图层/节点名称' : 'Node Name' }}</label>
            <input type="text" class="ind-input-text" v-model="config.name" />
        </div>

        <!-- Model config path -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '模型描述配置' : 'Model Config' }}</label>
            <div class="info-row">
                <span class="badge badge-l2d">Live2D JSON</span>
                <span class="file-path font-mono" :title="entryFile.relativePath">
                    {{ entryFile.name }}
                </span>
            </div>
        </div>

        <!-- Crucial files -->
        <div class="form-group">
            <label class="form-label">{{ i18n.locale === 'zh' ? '核心文件 (模型与贴图)' : 'Core Files' }}</label>
            <div class="file-list">
                <div v-for="file in associatedFiles.crucial" :key="file.relativePath" class="info-row file-row">
                    <span class="badge" :class="file.name.endsWith('.moc3') || file.name.endsWith('.moc') ? 'badge-moc' : 'badge-png'">
                        {{ file.name.split('.').pop() }}
                    </span>
                    <span class="file-path font-mono" :title="file.relativePath">
                        {{ file.name }}
                    </span>
                </div>
                
                <!-- Crucial Missing -->
                <div v-for="m in missingCrucial" :key="m.name" class="info-row file-row empty">
                    <span class="warning-text">❌ 缺少核心文件: {{ m.name }}</span>
                </div>
            </div>
        </div>

        <!-- Optional files -->
        <div class="form-group" v-if="associatedFiles.optional.length > 0 || missingOptional.length > 0">
            <label class="form-label">{{ i18n.locale === 'zh' ? '附加动画/交互文件 (可选)' : 'Optional Files' }}</label>
            <div class="file-list">
                <div v-for="file in associatedFiles.optional" :key="file.relativePath" class="info-row file-row optional-row">
                    <span class="badge badge-opt">
                        {{ file.name.split('.').pop() }}
                    </span>
                    <span class="file-path font-mono" :title="file.relativePath">
                        {{ file.name }}
                    </span>
                </div>

                <!-- Optional Missing -->
                <div v-for="m in missingOptional" :key="m.name" class="info-row file-row optional-empty">
                    <span class="info-text">⚠️ 缺失附加文件: {{ m.name }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.live2d-config {
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
    border-color: rgba(224, 76, 76, 0.4);
    background-color: rgba(224, 76, 76, 0.05);
}

.info-row.optional-empty {
    border-color: rgba(217, 119, 6, 0.2);
    background-color: rgba(217, 119, 6, 0.02);
}

.file-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.file-row {
    padding: 4px 8px;
}

.file-row.optional-row {
    opacity: 0.8;
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

.badge-l2d {
    background-color: #0ea5e9;
}

.badge-moc {
    background-color: #e11d48;
}

.badge-png {
    background-color: #7c3aed;
}

.badge-opt {
    background-color: #4b5563;
}

.warning-text {
    font-size: 11px;
    color: #ef4444;
}

.info-text {
    font-size: 11px;
    color: var(--text-secondary);
}
</style>
