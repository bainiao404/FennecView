# SpineTool Pinia 集成总结

## 集成目标
将 SpineTool 的 UI 状态管理从直接 DOM 操作迁移到 Pinia 状态管理，实现：
- 集中化的状态管理
- 响应式的 UI 更新
- 更好的组件间通信
- 状态持久化和调试能力

## 新增文件

### 1. UI Store (`src/stores/uiStore.js`)
完整的 Pinia store，包含所有 UI 相关状态：

**状态模块：**
- `mainUI` - 主界面显示状态
- `toolPanel` - 工具面板状态
- `canvasDisplay` - 画布显示信息
- `propertyPanel` - 属性面板状态
- `exportConfig` - 导出配置状态
- `debug` - 调试状态
- `userInteraction` - 用户交互状态
- `previewMode` - 预览模式状态

**主要功能：**
- 状态管理和获取器
- DOM 同步方法
- 响应式更新
- 回退机制

### 2. Pinia 插件 (`src/plugins/piniaPlugin.js`)
将 UI store 暴露给全局 window 对象，使 SpineTool 可以访问：
- 全局 `window.UIStore` 访问
- 兼容性 `window.switchUI` 方法
- Store 与 DOM 操作的桥接

## 更新的文件

### 1. Vue 组件更新

#### SpineToolOverlay.vue
```javascript
<script setup>
import { useUIStore } from '../stores/uiStore'

const uiStore = useUIStore()

function closeTool() {
    uiStore.hideTool()
}

function openAbout() {
    uiStore.switchTool('about')
}
</script>
```

#### SpineWindowButtons.vue
```javascript
<script setup>
import { useUIStore } from '../stores/uiStore'

const uiStore = useUIStore()

function openAbout() {
    uiStore.switchTool('about')
}
</script>
```

### 2. 主应用更新 (`src/main.js`)
```javascript
import { createPiniaPlugin } from './plugins/piniaPlugin'

const pinia = createPinia()
pinia.use(createPiniaPlugin())

app.use(pinia)
```

### 3. UI 管理器更新

#### MainUIManager.js
```javascript
setUI: function (state) {
    // 优先使用 Pinia store
    if (window.UIStore) {
        window.UIStore.setMainUIVisibility(state);
        return;
    }
    // 回退到直接 DOM 操作
    // ...
}
```

#### CanvasDisplayManager.js
```javascript
updateFPS: function (value) {
    if (window.UIStore) {
        window.UIStore.updateFPS(value);
        return;
    }
    // 回退到直接 DOM 操作
    // ...
}
```

## 架构优势

### 1. 状态集中管理
- 所有 UI 状态在一个地方管理
- 避免状态散布在各个组件中
- 便于状态调试和持久化

### 2. 响应式更新
- Pinia 提供响应式状态
- 状态变化自动更新相关组件
- 减少手动 DOM 操作

### 3. 组件解耦
- Vue 组件通过 store 通信
- 减少组件间直接依赖
- 更好的可测试性

### 4. 向后兼容性
- 保持原有 UI 管理器接口
- 提供 DOM 操作回退机制
- 渐进式迁移策略

## 使用方式

### Vue 组件中
```javascript
import { useUIStore } from '../stores/uiStore'

const uiStore = useUIStore()

// 读取状态
const isToolVisible = computed(() => uiStore.isToolVisible)

// 修改状态
uiStore.showTool('about')
uiStore.hideTool()
```

### SpineTool 脚本中
```javascript
// 通过全局 store 访问
if (window.UIStore) {
    window.UIStore.updateFPS(60)
    window.UIStore.setMainUIVisibility(false)
}

// 或通过管理器（已更新为使用 store）
window.MainUIManager.setUI(false)
window.CanvasDisplayManager.updateFPS(60)
```

## 迁移策略

### 阶段 1: 基础集成 ✅
- 创建 Pinia store 和插件
- 更新主要 Vue 组件
- 更新核心 UI 管理器

### 阶段 2: 深度集成 (建议)
- 完全迁移所有 UI 操作到 store
- 移除直接 DOM 操作
- 添加状态持久化

### 阶段 3: 优化完善 (建议)
- 添加 TypeScript 类型定义
- 实现状态持久化
- 添加开发工具支持

## 测试验证

### 构建测试 ✅
- 所有新增文件正确编译
- Pinia store 正常集成
- Vue 组件正确引用

### 运行时错误修复 ✅
- **TypeError: Cannot read properties of undefined (reading 'openTool')** - 已修复
  - 更新了 SpineLeftMenuPanel.vue 中的所有 window.openTool 调用
  - 使用 uiStore.showTool() 替代
  - 添加了 openBatchRename() 函数

### 功能测试
- [x] Vue 组件状态响应
- [x] SpineTool 状态同步
- [x] UI 管理器回退机制
- [x] 跨组件状态通信

## 后续建议

### 1. 完全迁移
- 将所有 UI 操作迁移到 store actions
- 移除直接 DOM 操作依赖
- 统一状态更新接口

### 2. 增强功能
- 添加状态持久化到 localStorage
- 实现状态历史记录
- 添加状态重置功能

### 3. 开发体验
- 添加 Vue DevTools 集成
- 添加状态变化日志
- 添加时间旅行调试

### 4. 类型安全
- 添加 TypeScript 类型定义
- 实现严格的类型检查
- 添加 IntelliSense 支持

## 总结

Pinia 集成为 SpineTool 带来了：

- **更好的状态管理** - 集中化、响应式
- **组件解耦** - 通过 store 通信
- **向后兼容** - 渐进式迁移
- **开发体验** - 更好的调试和工具支持

这为 SpineTool 的长期维护和功能扩展奠定了坚实的基础。
