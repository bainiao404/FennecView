<script setup>
import { useI18nStore } from '@/stores/i18n'
import FennecView from '@/fennec-view/FennecView'

const i18n = useI18nStore()

async function handleAddText() {
    if (FennecView?.addTextNode) {
        await FennecView.addTextNode(i18n.locale === 'zh' ? '双击编辑文本' : 'Double click to edit text', {
            fontSize: 36,
            fill: '#ffffff',
            fontFamily: 'Arial',
            align: 'left',
            name: i18n.locale === 'zh' ? '文本节点' : 'Text Node'
        })
    }
}

async function handleAddRect() {
    if (FennecView?.addRectNode) {
        await FennecView.addRectNode({
            width: 200,
            height: 150,
            fill: '#0052d9',
            radius: 0,
            name: i18n.locale === 'zh' ? '矩形节点' : 'Rectangle Node'
        })
    }
}

async function handleAddVideo() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'video/mp4,video/webm,video/ogg'
    input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (FennecView?.fileHandleDropWeb) {
            await FennecView.fileHandleDropWeb([file])
        }
    }
    input.click()
}
</script>

<template>
    <div class="add-panel">
        <div class="panel-section">
            <div class="section-title">
                {{ i18n.locale === 'zh' ? '添加元素' : 'Add Elements' }}
            </div>
            
            <div class="action-row" style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; gap: 8px;">
                    <button class="ind-btn primary-btn" @click="handleAddText" style="flex: 1; font-weight: bold; padding: 10px;">
                        {{ i18n.locale === 'zh' ? '添加文本' : 'Add Text' }}
                    </button>
                    <button class="ind-btn primary-btn" @click="handleAddRect" style="flex: 1; font-weight: bold; padding: 10px;">
                        {{ i18n.locale === 'zh' ? '添加矩形' : 'Add Rect' }}
                    </button>
                </div>
                <button class="ind-btn primary-btn" @click="handleAddVideo" style="width: 100%; font-weight: bold; padding: 10px;">
                    {{ i18n.locale === 'zh' ? '添加视频' : 'Add Video' }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.add-panel {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.panel-section {
    margin-bottom: 16px;
}

.section-title {
    font-size: 13px;
    font-weight: bold;
    color: var(--text-active);
    margin-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 6px;
}

.primary-btn {
    background-color: var(--bg-dark-active);
    color: var(--text-active);
    border-color: var(--bg-dark-active);
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.2s, border-color 0.2s;
}

.primary-btn:hover {
    background-color: var(--accent-orange);
    border-color: var(--accent-orange);
}
</style>
