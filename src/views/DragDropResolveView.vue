<script setup>
import { ref, onMounted } from 'vue'
import { useImportStore } from '@/stores/importStore'
import { useLayerStore } from '@/stores/layerStore'
import { useI18nStore } from '@/stores/i18n'
import { createFileItem } from '@/services/import/models/FileItem'
import FennecView from '@/fennec-view/FennecView'

const props = defineProps({
    rawData: {
        type: String,
        required: true
    }
})

const importStore = useImportStore()
const layerStore = useLayerStore()
const i18n = useI18nStore()

const status = ref('resolving') // 'resolving' | 'downloading' | 'importing' | 'failed'
const message = ref('')

onMounted(async () => {
    await resolveDragDropData()
})

async function resolveDragDropData() {
    const textContent = props.rawData.trim()
    
    // Regular expression to match standard HTTP/HTTPS URLs
    const urlRegex = /(https?:\/\/[^\s"'<>]+)/gi
    const matches = textContent.match(urlRegex)

    if (matches && matches.length > 0) {
        const url = matches[0]
        status.value = 'downloading'
        message.value = i18n.locale === 'zh' 
            ? `正在下载资源: ${url}` 
            : `Downloading resource: ${url}`

        try {
            const response = await fetch(url)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const blob = await response.blob()
            
            // Extract filename from URL
            let filename = ''
            try {
                const urlObj = new URL(url)
                const pathname = urlObj.pathname
                filename = pathname.substring(pathname.lastIndexOf('/') + 1)
            } catch (e) {
                // Fallback if URL parsing fails
            }

            // Fallback filename and extension detection based on Content-Type
            if (!filename || !filename.includes('.')) {
                const contentType = response.headers.get('content-type') || ''
                let ext = 'png'
                if (contentType.includes('svg')) ext = 'svg'
                else if (contentType.includes('jpeg')) ext = 'jpg'
                else if (contentType.includes('gif')) ext = 'gif'
                else if (contentType.includes('webp')) ext = 'webp'
                else if (contentType.includes('mp4')) ext = 'mp4'
                else if (contentType.includes('webm')) ext = 'webm'
                else if (contentType.includes('ogg')) ext = 'ogg'
                else if (contentType.includes('json')) ext = 'json'

                filename = (filename || 'downloaded_asset') + '.' + ext
            }

            // Check if the filename/extension matches FennecView supported formats
            const nameLower = filename.toLowerCase()
            const isSupported = /\.(png|jpg|jpeg|webp|gif|mp4|webm|ogg|svg|fv)$/i.test(nameLower) ||
                                nameLower.endsWith('.model3.json') ||
                                nameLower.endsWith('.json') ||
                                nameLower.endsWith('.skel')

            if (isSupported) {
                status.value = 'importing'
                message.value = i18n.locale === 'zh'
                    ? `下载成功，正在导入资源: ${filename}`
                    : `Downloaded successfully, importing: ${filename}`

                // Construct a virtual FileItem for the downloaded resource
                const fileItem = createFileItem({
                    name: filename,
                    size: blob.size,
                    path: '',
                    relativePath: filename,
                    file: new File([blob], filename, { type: blob.type }),
                    isNative: false
                })

                await importStore.addFiles([fileItem])
                
                // Close this parsing layer specifically
                closeSelf()
                return
            } else {
                throw new Error('Downloaded file type is not supported directly in the workspace.')
            }

        } catch (error) {
            console.warn('Failed to resolve URL, falling back to text resource:', error)
            await fallbackToTextResource(textContent)
        }
    } else {
        // No URL found in the text, directly add it as a text node
        await fallbackToTextResource(textContent)
    }
}

function closeSelf() {
    const layer = layerStore.layers.find(l => l.name === 'DragDropResolveView' && l.visible)
    if (layer) {
        layer.visible = false
    }
}

async function fallbackToTextResource(text) {
    status.value = 'importing'
    message.value = i18n.locale === 'zh'
        ? '正在添加为文本节点...'
        : 'Adding content as text node...'

    try {
        if (FennecView && FennecView.addTextNode) {
            await FennecView.addTextNode(text)
        }
    } catch (e) {
        console.error('Failed to create text node:', e)
    } finally {
        // Close resolving layer
        closeSelf()
    }
}
</script>

<template>
    <div class="resolve-layer-container">
        <div class="resolve-card ind-panel">
            <div class="resolve-content">
                <!-- Spinner loader -->
                <div class="loader-spinner">
                    <div class="double-bounce1"></div>
                    <div class="double-bounce2"></div>
                </div>

                <h3 class="resolve-title">
                    {{ i18n.locale === 'zh' ? '正在处理拖放内容' : 'Processing Dropped Content' }}
                </h3>
                
                <p class="resolve-message font-mono">
                    {{ message }}
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.resolve-layer-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(10, 10, 10, 0.85); /* Solid dark mask without backdrop blur */
    box-sizing: border-box;
}

.resolve-card {
    width: 420px;
    background-color: var(--bg-dark-panel, #1d1d1d);
    border: 1px solid var(--border-color, #333333);
    border-radius: 8px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
    overflow: hidden;
    position: relative;
    padding: 0;
}


.resolve-content {
    padding: 30px 25px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 18px;
}

.resolve-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary, #ffffff);
}

.resolve-message {
    font-size: 12px;
    color: var(--text-secondary, #aaaaaa);
    line-height: 1.5;
    margin: 0;
    word-break: break-all;
    max-height: 80px;
    overflow-y: auto;
}

/* Spinner CSS */
.loader-spinner {
    width: 50px;
    height: 50px;
    position: relative;
}

.double-bounce1, .double-bounce2 {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: #0052d9;
    opacity: 0.6;
    position: absolute;
    top: 0;
    left: 0;
    animation: sk-bounce 2.0s infinite ease-in-out;
}

.double-bounce2 {
    background-color: #00c6ff;
    animation-delay: -1.0s;
}

@keyframes sk-bounce {
    0%, 100% { 
        transform: scale(0.0);
    } 50% { 
        transform: scale(1.0);
    }
}
</style>
