<template>
    <div v-show="display" class="file-explorer-container">
        <div class="header">
            <div class="header-content">
                <div class="title">{{ title }}</div>
                <div class="breadcrumb-container">
                    <template v-for="(seg, index) in breadcrumbs" :key="seg.path">
                        <span class="breadcrumb-item" @click="getFile(seg.path)">{{ seg.name }}</span>
                        <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator">/</span>
                    </template>
                </div>
            </div>
        </div>

        <!-- History Directory Navigation Bar -->
        <div class="history-bar" v-if="historyDirectories.length > 0">
            <span class="history-title">历史目录:</span>
            <div class="history-items">
                <span
                    v-for="hist in historyDirectories"
                    :key="hist"
                    class="history-item-btn"
                    @click="getFile(hist)"
                    :title="hist"
                >
                    {{ getFolderDisplayName(hist) }}
                </span>
                <span class="clear-history" @click="clearHistory">清除</span>
            </div>
        </div>

        <div class="back-menu" title="返回上一级" @click="goBack">
            <ChevronLeftIcon />
        </div>
        <div class="off-menu" title="关闭" @click="$emit('close')">
            <CloseIcon />
        </div>

        <div class="file-list-wrapper">
            <div class="file-item select-all-bar" v-if="sortedFileList.length > 0 && multiple">
                <div class="checkbox" :class="{ checked: isAllSelected }" @click="toggleSelectAll"></div>
                <span class="file-name" @click="toggleSelectAll">全选当前目录 ({{ sortedFileList.length }})</span>
            </div>

            <div
                v-for="file in sortedFileList"
                :key="file.path"
                class="file-item"
                :class="{
                    'is-selected': isItemSelected(file),
                    'is-disabled': onlyFolder && file.type === 'file',
                }"
            >
                <div
                    v-if="!(onlyFolder && file.type === 'file')"
                    class="checkbox"
                    :class="{ checked: isItemSelected(file) }"
                    @click.stop="toggleSelection(file)"
                ></div>
                <div v-else class="checkbox-placeholder"></div>

                <div class="item-content" @click="handleItemClick(file)">
                    <FileIcon v-if="file.type === 'file'" class="file-icon item-file" />
                    <FolderIcon v-else class="file-icon item-folder" />
                    <span class="file-name">{{ file.name }}</span>
                </div>
            </div>

            <div v-if="currentFileList.length === 0" class="empty-state">该目录为空</div>
        </div>

        <div class="footer-action-bar">
            <div class="selected-info">
                已选择 <span>{{ selectedItems.length }}</span> {{ onlyFolder ? '个文件夹' : '项' }}
            </div>
            <div class="btn-group">
                <button class="btn-cancel" @click="selectedItems = []">清空选择</button>
                <button class="btn-confirm" :disabled="selectedItems.length === 0" @click="submitSelection">
                    确定选择
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { FileIcon, FolderIcon, ChevronLeftIcon, CloseIcon } from 'tdesign-icons-vue-next'

const props = defineProps({
    display: Boolean,
    openPath: String,
    title: { type: String, default: '文件浏览器' },
    multiple: { type: Boolean, default: true },
    onlyFolder: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'select'])
const currentFileList = ref([])
const currentPath = ref('')
const selectedItems = ref([])
const historyDirectories = ref([])

const breadcrumbs = computed(() => {
    const root = window.cordova?.file?.externalRootDirectory || '/'
    let relativePath = currentPath.value.replace(root, '')
    if (relativePath.endsWith('/')) relativePath = relativePath.slice(0, -1)
    const parts = relativePath.split('/').filter((p) => p)
    const result = [{ name: '根目录', path: root }]
    let tempPath = root
    parts.forEach((part) => {
        tempPath += part + '/'
        result.push({ name: part, path: tempPath })
    })
    return result
})

const sortedFileList = computed(() => {
    return [...currentFileList.value].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
        return a.name.localeCompare(b.name, 'zh-CN', { numeric: true })
    })
})

const isItemSelected = (item) => selectedItems.value.some((i) => i.path === item.path)
const isAllSelected = computed(() => {
    const selectable = props.onlyFolder ? sortedFileList.value.filter((f) => f.type === 'folder') : sortedFileList.value
    return selectable.length > 0 && selectable.every((item) => isItemSelected(item))
})

function toggleSelection(item) {
    if (props.onlyFolder && item.type === 'file') return
    const index = selectedItems.value.findIndex((i) => i.path === item.path)
    if (index > -1) selectedItems.value.splice(index, 1)
    else {
        if (!props.multiple) selectedItems.value = [item]
        else selectedItems.value.push(item)
    }
}

function toggleSelectAll() {
    const selectable = props.onlyFolder ? sortedFileList.value.filter((f) => f.type === 'folder') : sortedFileList.value
    if (isAllSelected.value) {
        const paths = selectable.map((f) => f.path)
        selectedItems.value = selectedItems.value.filter((i) => !paths.includes(i.path))
    } else {
        selectable.forEach((item) => {
            if (!isItemSelected(item)) selectedItems.value.push(item)
        })
    }
}

function handleItemClick(item) {
    if (item.type === 'folder') getFile(item.path)
    else if (!props.onlyFolder) toggleSelection(item)
}

function submitSelection() {
    let paths = selectedItems.value.map((e) => {
        return {
            ...e,
            path: decodeURIComponent(e.path),
        }
    })
    addToHistory(currentPath.value)
    emit('select', props.multiple ? paths : paths[0])
    emit('close')
}

function addToHistory(path) {
    if (!path) return
    let normPath = path
    if (!normPath.endsWith('/')) normPath += '/'

    let list = [...historyDirectories.value]
    const idx = list.indexOf(normPath)
    if (idx > -1) {
        list.splice(idx, 1)
    }
    list.unshift(normPath)
    if (list.length > 8) {
        list = list.slice(0, 8)
    }
    historyDirectories.value = list
    localStorage.setItem('fennecview_explorer_history', JSON.stringify(list))
}

function loadHistory() {
    try {
        const saved = localStorage.getItem('fennecview_explorer_history')
        if (saved) {
            historyDirectories.value = JSON.parse(saved)
        }
    } catch (e) {
        console.error(e)
    }
}

function clearHistory() {
    historyDirectories.value = []
    localStorage.removeItem('fennecview_explorer_history')
}

function getFolderDisplayName(path) {
    let p = path.replace(/\/$/, '')
    let name = p.substring(p.lastIndexOf('/') + 1)
    if (!name) {
        return '根目录'
    }
    try {
        name = decodeURIComponent(name)
    } catch (e) {}
    return name
}

function getFile(path) {
    if (!path.endsWith('/')) path += '/'
    currentPath.value = path
    if (!window.resolveLocalFileSystemURL) return
    window.resolveLocalFileSystemURL(path, (dirEntry) => {
        const reader = dirEntry.createReader()
        reader.readEntries((entries) => {
            currentFileList.value = entries
                .filter((e) => !e.name.startsWith('.'))
                .map((e) => ({
                    name: e.name,
                    path: e.nativeURL || path + e.name,
                    type: e.isFile ? 'file' : 'folder',
                }))
        })
    })
}

function goBack() {
    const root = window.cordova?.file?.externalRootDirectory
    if (currentPath.value === root || currentPath.value === root + '/') {
        MessagePlugin.info('已经是根目录')
        return
    }
    let path = currentPath.value.replace(/\/$/, '')
    getFile(path.substring(0, path.lastIndexOf('/') + 1))
}

function init() {
    loadHistory()
    if (props.display) getFile(props.openPath || window.cordova?.file?.externalRootDirectory || '/')
}
watch(
    () => props.display,
    (v) => v && init(),
)
onMounted(() => {
    if (window.cordova) document.addEventListener('deviceready', init, false)
    else init()
})
</script>

<style scoped>
.file-explorer-container {
    position: absolute;
    inset: 0;
    background: var(--bg-dark-app, #121212);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    top: 0px;
    left: 0px;
    color: var(--text-primary, #cccccc);
    font-family: Consolas, "Courier New", monospace;
}

.header {
    height: 50px;
    padding: 0 55px; /* Leave space for left and right menu buttons */
    border-bottom: 1px solid var(--border-color, #333333);
    display: flex;
    align-items: center;
    background: var(--bg-dark-panel, #1e1e1e);
}

.header-content {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 100%;
}

.title {
    font-weight: bold;
    font-size: 14px;
    color: var(--text-active, #ffffff);
}

.breadcrumb-container {
    display: flex;
    align-items: center;
    font-size: 11px;
    margin-top: 2px;
    overflow-x: auto;
    white-space: nowrap;
    scrollbar-width: none;
}

.breadcrumb-container::-webkit-scrollbar {
    display: none;
}

.breadcrumb-item {
    color: var(--bg-dark-active, #0e639c);
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
}

.breadcrumb-item:active {
    background: var(--bg-dark-hover, #333333);
}

.breadcrumb-item:last-child {
    color: var(--text-secondary, #858585);
    pointer-events: none;
    font-weight: normal;
}

.breadcrumb-separator {
    margin: 0 2px;
    color: var(--text-secondary, #858585);
}

.history-bar {
    display: flex;
    align-items: center;
    padding: 6px 15px;
    background: var(--bg-dark-panel, #1e1e1e);
    border-bottom: 1px solid var(--border-color, #333333);
    font-size: 11px;
    gap: 8px;
    overflow: hidden;
}

.history-title {
    color: var(--text-secondary, #858585);
    flex-shrink: 0;
}

.history-items {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;
    flex: 1;
}

.history-items::-webkit-scrollbar {
    display: none;
}

.history-item-btn {
    background-color: var(--bg-dark-input, #2d2d2d);
    border: 1px solid var(--border-color, #333333);
    border-radius: 3px;
    padding: 2px 8px;
    color: var(--text-primary, #cccccc);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;
}

.history-item-btn:hover {
    background-color: var(--bg-dark-hover, #3c3c3c);
    color: var(--text-active, #ffffff);
}

.clear-history {
    color: #882222;
    cursor: pointer;
    font-weight: bold;
    padding: 2px 6px;
    margin-left: auto;
    flex-shrink: 0;
}

.clear-history:hover {
    color: #aa3333;
}

.back-menu,
.off-menu {
    position: absolute;
    top: 0;
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    font-size: 20px;
    z-index: 10;
    transition: background 0.2s;
}

.back-menu {
    left: 0;
    border-right: 1px solid var(--border-color, #333333);
    color: var(--text-primary, #cccccc);
}

.back-menu:active {
    background: var(--bg-dark-hover, #333333);
}

.off-menu {
    right: 0;
    background: #882222;
    color: #ffcccc;
}

.off-menu:active {
    background: #aa3333;
}

.file-list-wrapper {
    flex: 1;
    overflow-y: auto;
    background: var(--bg-dark-app, #121212);
}

.file-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color, #333333);
    transition: background 0.2s;
    user-select: none;
}

.file-item:active {
    background-color: var(--bg-dark-hover, #333333);
}

.file-item.is-selected {
    background-color: rgba(14, 99, 156, 0.25);
}

.file-item.is-disabled {
    opacity: 0.3;
}

.item-content {
    display: flex;
    align-items: center;
    flex: 1;
    overflow: hidden;
    margin-left: 4px;
    cursor: pointer;
}

.file-icon {
    font-size: 20px;
    margin-right: 10px;
    flex-shrink: 0;
}

.file-icon.item-folder {
    color: var(--accent-orange, #d97706);
}

.file-icon.item-file {
    color: var(--text-primary, #cccccc);
}

.file-name {
    font-size: 13px;
    color: var(--text-primary, #cccccc);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.checkbox {
    width: 18px;
    height: 18px;
    border: 2px solid var(--text-secondary, #858585);
    border-radius: 50%;
    flex-shrink: 0;
    position: relative;
    transition: all 0.2s;
    margin-right: 8px;
    cursor: pointer;
}

.checkbox.checked {
    background: var(--bg-dark-active, #0e639c);
    border-color: var(--bg-dark-active, #0e639c);
}

.checkbox.checked::after {
    content: '';
    position: absolute;
    width: 5px;
    height: 8px;
    border: 2px solid var(--text-active, #ffffff);
    border-top: 0;
    border-left: 0;
    left: 5px;
    top: 2px;
    transform: rotate(45deg);
}

.checkbox-placeholder {
    width: 18px;
    margin-right: 8px;
}

.select-all-bar {
    background: var(--bg-dark-panel, #1e1e1e);
    position: sticky;
    top: 0;
    z-index: 5;
    font-weight: bold;
}

.footer-action-bar {
    padding: 12px 16px;
    border-top: 1px solid var(--border-color, #333333);
    background: var(--bg-dark-panel, #1e1e1e);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

.selected-info {
    font-size: 12px;
    color: var(--text-secondary, #858585);
}

.selected-info span {
    color: var(--text-active, #ffffff);
    font-weight: bold;
    margin: 0 2px;
}

.btn-group {
    display: flex;
    gap: 10px;
}

button {
    padding: 8px 16px;
    border-radius: 4px;
    border: 1px solid var(--border-color, #333333);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
}

.btn-cancel {
    background: var(--bg-dark-input, #2d2d2d);
    color: var(--text-primary, #cccccc);
}

.btn-confirm {
    background: var(--bg-dark-active, #0e639c);
    color: var(--text-active, #ffffff);
    border-color: var(--bg-dark-active, #0e639c);
}

button:active {
    opacity: 0.8;
}

button:disabled {
    background: var(--bg-dark-input, #2d2d2d);
    color: var(--text-secondary, #858585);
    cursor: not-allowed;
    opacity: 0.6;
}

.empty-state {
    padding: 80px 0;
    text-align: center;
    color: var(--text-secondary, #858585);
    font-size: 13px;
}
</style>
