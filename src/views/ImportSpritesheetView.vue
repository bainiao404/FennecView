<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useLayerStore } from '@/stores/layerStore'
import { useI18nStore } from '@/stores/i18n'
import FennecView from '@/fennec-view/FennecView'
import { blobRegistry } from '@/services/resources/BlobRegistry'

const props = defineProps({
    file: {
        type: Object,
        default: null
    }
})

const layerStore = useLayerStore()
const i18n = useI18nStore()
const PIXI = window.PIXI

const selectedFile = ref(null)
const imageUrl = ref('')
const gridRows = ref(1)
const gridCols = ref(1)

// Safe texture loading helper
async function loadTexture(url) {
    let loadOptions = url
    if (url && typeof url === 'string' && url.startsWith('blob:')) {
        loadOptions = {
            src: url,
            loadParser: 'loadTextures'
        }
    }
    return await PIXI.Assets.load(loadOptions)
}

function setFile(file) {
    if (imageUrl.value) {
        blobRegistry.revokeURL(imageUrl.value)
        imageUrl.value = ''
    }
    selectedFile.value = file
    if (file) {
        imageUrl.value = blobRegistry.createURL(file)
    }
}

// Watch props.file for initial value
watch(
    () => props.file,
    (newFile) => {
        if (newFile) {
            setFile(newFile)
        }
    },
    { immediate: true }
)

onUnmounted(() => {
    if (imageUrl.value) {
        blobRegistry.revokeURL(imageUrl.value)
    }
})

function selectFile() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setFile(file)
            gridRows.value = 1
            gridCols.value = 1
        }
    }
    input.click()
}

function closeView() {
    layerStore.back()
}

async function confirmImport() {
    if (!selectedFile.value) return
    const file = selectedFile.value
    
    try {
        const imageSrc = imageUrl.value
        const baseTexture = await loadTexture(imageSrc)
        
        const rows = gridRows.value
        const cols = gridCols.value
        const frameW = baseTexture.width / cols
        const frameH = baseTexture.height / rows
        
        const textures = []
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const rect = new PIXI.Rectangle(c * frameW, r * frameH, frameW, frameH)
                const frameTexture = new PIXI.Texture(baseTexture.baseTexture || baseTexture, rect)
                textures.push(frameTexture)
            }
        }
        
        if (textures.length > 0 && typeof FennecView.addAnimatedSpriteNode === 'function') {
            const name = file.name.replace(/\.[^/.]+$/, "")
            await FennecView.addAnimatedSpriteNode(textures, 'grid', {
                name: name + '_grid',
                imageSrc,
                imageName: file.name,
                rows,
                cols
            })
        }
    } catch (err) {
        console.error('导入单图精灵表分割失败:', err)
    } finally {
        closeView()
    }
}
</script>

<template>
    <div class="import-spritesheet ind-content">
        <div class="form-container ind-panel">
            <div class="ind-header">
                {{ i18n.locale === 'zh' ? '导入精灵表 (网格分割)' : 'Import Spritesheet (Grid Split)' }}
            </div>
            
            <div class="form-body">
                <!-- Drop/Select File Area when no file selected -->
                <div class="form-group drop-section" v-if="!selectedFile">
                    <label class="form-label">{{ i18n.locale === 'zh' ? '选择源图片' : 'Select Source Image' }}</label>
                    <div class="file-drop-area" @click="selectFile">
                        <div class="upload-icon">📁</div>
                        <div class="upload-text">
                            {{ i18n.locale === 'zh' ? '点击此处选择图片' : 'Click here to select an image' }}
                        </div>
                    </div>
                </div>
                
                <!-- Parameter Controls and Realtime Preview Layout -->
                <div v-else class="spritesheet-layout">
                    <!-- Left Column: Config Panel -->
                    <div class="config-panel">
                        <div class="form-group">
                            <label class="form-label">{{ i18n.locale === 'zh' ? '文件名' : 'File Name' }}</label>
                            <input type="text" class="ind-input-text" :value="selectedFile.name" disabled />
                        </div>
                        
                        <div class="form-group">
                            <div class="label-row">
                                <label class="form-label">{{ i18n.locale === 'zh' ? '分割行数 (Rows)' : 'Rows' }}</label>
                                <span class="value-badge">{{ gridRows }}</span>
                            </div>
                            <input 
                                class="ind-range"
                                type="range"
                                min="1"
                                max="64"
                                v-model.number="gridRows"
                            />
                        </div>
                        
                        <div class="form-group">
                            <div class="label-row">
                                <label class="form-label">{{ i18n.locale === 'zh' ? '分割列数 (Cols)' : 'Cols' }}</label>
                                <span class="value-badge">{{ gridCols }}</span>
                            </div>
                            <input 
                                class="ind-range"
                                type="range"
                                min="1"
                                max="64"
                                v-model.number="gridCols"
                            />
                        </div>
                        
                        <div class="actions-row">
                            <button class="ind-btn action-btn flex-1" @click="closeView">
                                {{ i18n.locale === 'zh' ? '取消' : 'Cancel' }}
                            </button>
                            <button class="ind-btn action-btn primary-btn flex-1" @click="confirmImport">
                                {{ i18n.locale === 'zh' ? '确认导入' : 'Import' }}
                            </button>
                        </div>
                    </div>
                    
                    <!-- Right Column: Interactive Grid Slicing Preview -->
                    <div class="preview-panel">
                        <div class="preview-title">
                            {{ i18n.locale === 'zh' ? '可视化网格预览' : 'Visual Grid Preview' }}
                        </div>
                        <div class="preview-container">
                            <div class="image-wrapper">
                                <img :src="imageUrl" class="spritesheet-img" />
                                <!-- Grid Lines Overlay -->
                                <div class="grid-overlay">
                                    <div 
                                        v-for="r in gridRows - 1" 
                                        :key="'row-'+r" 
                                        class="grid-line horizontal"
                                        :style="{ top: (r / gridRows) * 100 + '%' }"
                                    ></div>
                                    <div 
                                        v-for="c in gridCols - 1" 
                                        :key="'col-'+c" 
                                        class="grid-line vertical"
                                        :style="{ left: (c / gridCols) * 100 + '%' }"
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.import-spritesheet {
    padding: 20px;
    height: calc(100% - 40px);
    background-color: var(--bg-dark-app);
    display: flex;
    justify-content: center;
    align-items: flex-start;
}

.form-container {
    width: 100%;
    max-width: 900px;
    border-radius: 4px;
    overflow: hidden;
}

.form-body {
    padding: 20px;
    background-color: var(--bg-dark-panel);
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.drop-section {
    min-height: 250px;
    justify-content: center;
}

.file-drop-area {
    border: 2px dashed var(--border-color);
    border-radius: 6px;
    padding: 60px 40px;
    text-align: center;
    cursor: pointer;
    background-color: var(--bg-dark-input);
    color: var(--text-secondary);
    transition: all 0.2s ease-in-out;
}

.file-drop-area:hover {
    border-color: var(--text-active);
    color: var(--text-primary);
    background-color: #1e1e1e;
}

.upload-icon {
    font-size: 48px;
    margin-bottom: 12px;
}

.upload-text {
    font-size: 14px;
}

.spritesheet-layout {
    display: flex;
    gap: 24px;
    min-height: 400px;
}

.config-panel {
    flex: 0 0 280px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-label {
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: bold;
}

.label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.value-badge {
    font-size: 11px;
    color: var(--text-active);
    background-color: var(--bg-dark-input);
    padding: 1px 6px;
    font-family: monospace;
}

.actions-row {
    display: flex;
    gap: 10px;
    margin-top: auto;
}

.flex-1 {
    flex: 1;
}

.action-btn {
    padding: 8px 16px;
}

.primary-btn {
    background-color: var(--bg-dark-active);
    color: var(--text-active);
    border-color: var(--bg-dark-active);
}

.preview-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-left: 1px solid var(--border-color);
    padding-left: 24px;
}

.preview-title {
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: bold;
}

.preview-container {
    flex: 1;
    background-color: #0c0c0c;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    overflow: auto;
    max-height: 480px;
    padding: 12px;
}

.image-wrapper {
    position: relative;
    display: inline-block;
}

.spritesheet-img {
    max-width: 100%;
    max-height: 420px;
    display: block;
    object-fit: contain;
}

.grid-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    box-sizing: border-box;
    border: 1px solid rgba(255, 69, 0, 0.5);
}

.grid-line {
    position: absolute;
    background-color: rgba(255, 69, 0, 0.65);
}

.grid-line.horizontal {
    left: 0;
    width: 100%;
    height: 1px;
}

.grid-line.vertical {
    top: 0;
    height: 100%;
    width: 1px;
}
</style>
