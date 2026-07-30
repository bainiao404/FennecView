# SpineTool UI 重构总结

## 重构目标
将 SpineTool 对象中的 UI 操作逻辑分离到各个独立的 UI 组件中，提高代码的可维护性和模块化程度。

## 新增的 UI 管理器模块

### 1. MainUIManager (主界面管理器)
**文件位置**: `script/ui/MainUIManager.js`
**职责**: 
- 主界面元素的显示/隐藏控制
- 预览模式设置
- 画布元素可见性更新

**主要方法**:
- `setUI(state)` - 设置主界面UI状态
- `updateCanvasElements(state)` - 更新画布相关元素可见性
- `setPreviewMode()` - 预览模式设置

### 2. PropertyPanelManager (属性面板管理器)
**文件位置**: `script/ui/PropertyPanelManager.js`
**职责**:
- 左侧属性面板的显示和更新
- 节点属性信息展示
- 导出按钮显示状态控制

**主要方法**:
- `updatePropertyPanel(node)` - 更新属性面板显示
- `getAttributesTxt(attributes)` - 获取属性文本
- `updateExportButtons(node)` - 更新导出按钮显示状态
- `updateNodeInfo(node)` - 更新节点信息显示

### 3. CanvasDisplayManager (画布显示管理器)
**文件位置**: `script/ui/CanvasDisplayManager.js`
**职责**:
- 画布信息显示和更新
- 坐标、缩放、FPS等信息管理
- 进度条更新

**主要方法**:
- `init()` - 初始化画布显示元素
- `updateScaleDisplay(node)` - 更新缩放显示
- `updateWorldPosition(world)` - 更新世界坐标显示
- `updateCanvasPosition(x, y)` - 更新画布坐标显示
- `updateFPS(value)` - 更新FPS显示
- `updateResolution(value)` - 更新分辨率显示
- `updateProgressBar(progress)` - 更新进度条
- `updateAnimationProgress(state)` - 更新动画进度

### 4. ExportManager (导出管理器)
**文件位置**: `script/ui/ExportManager.js`
**职责**:
- 各种导出功能的UI操作
- 导出配置管理
- 导出图标设置

**主要方法**:
- `setExportWallpaperEngineIcon()` - 设置WallpaperEngine导出图标
- `exportWallpaperEngine()` - 导出WallpaperEngine项目
- `updateWallpaperEngineConfig(key, value)` - 更新WallpaperEngine配置
- `updateMp4Config(key, value)` - 更新MP4配置

### 5. UserInteractionManager (用户交互管理器)
**文件位置**: `script/ui/UserInteractionManager.js`
**职责**:
- 用户交互相关的UI操作
- 矩形区域选择
- 参数UI更新

**主要方法**:
- `getUserRect(hintText)` - 获取用户选择的矩形区域
- `createRectangleDrawer(container, zIndex, moveCallback)` - 创建矩形绘制器
- `updateParameterUI(rect, element)` - 更新参数UI显示

### 6. DebugManager (调试管理器)
**文件位置**: `script/ui/DebugManager.js`
**职责**:
- 调试相关的UI操作
- 调试样式设置
- 调试信息显示

**主要方法**:
- `setStyle(style)` - 设置调试样式
- `toggleDebug(type)` - 切换调试显示
- `updateDebugInfo(txt)` - 更新调试信息显示
- `clearDebugInfo()` - 清除调试信息

## SpineTool 对象重构

### 重构前的问题
- UI 操作逻辑分散在 SpineTool 对象中
- 直接操作 DOM 元素
- 代码耦合度高，难以维护

### 重构后的改进
- UI 操作委托给专门的管理器
- 通过全局 window 对象暴露管理器
- 降低了 SpineTool 对象的复杂度
- 提高了代码的可测试性和可维护性

### 主要重构的函数

#### 委托给 MainUIManager:
- `setUI(state)` - 主界面UI状态控制
- `previewStart()` - 预览模式启动

#### 委托给 PropertyPanelManager:
- `informationRefresh()` - 属性面板信息刷新

#### 委托给 CanvasDisplayManager:
- `setFPS(value)` - FPS设置
- `steResolution(value)` - 分辨率设置
- `onMouseMove(event)` - 鼠标移动事件处理
- 进度条更新逻辑

#### 委托给 ExportManager:
- `setExportWallpaperEngineIcon()` - 导出图标设置
- `exportWallpaperEngine()` - WallpaperEngine导出

#### 委托给 UserInteractionManager:
- `getUserRect(txt)` - 用户矩形区域获取

#### 委托给 DebugManager:
- `debug.setStyle()` - 调试样式设置

## 脚本加载顺序更新

更新了 `src/spine-tool/initSpineTool.js` 中的脚本加载顺序，确保 UI 管理器在 SpineTool 主逻辑之前加载：

```javascript
const SCRIPT_ORDER = [
    'script/ui/MainUIManager.js',
    'script/ui/PropertyPanelManager.js', 
    'script/ui/CanvasDisplayManager.js',
    'script/ui/ExportManager.js',
    'script/ui/UserInteractionManager.js',
    'script/ui/DebugManager.js',
    // ... 其他脚本
]
```

## 兼容性保证

- 所有重构都保持了向后兼容性
- Vue 组件无需修改，继续使用原有的全局函数调用
- 添加了空值检查，确保在管理器未加载时不会出错

## 测试状态

✅ 构建成功 - 所有 UI 管理器模块正确编译和复制
✅ 脚本加载顺序更新完成
✅ 向后兼容性保持
✅ 运行时错误修复完成

### 修复的运行时错误

1. **ReferenceError: userOptions is not defined**
   - 问题：`appStart` 函数中引用了未定义的 `userOptions` 变量
   - 解决：移除了对 `userOptions` 的引用，直接传递配置对象

2. **TypeError: Cannot read properties of undefined (reading 'canvas')**
   - 问题：尝试访问 `canvas.options.canvas` 但 `options` 未存储在 canvas 对象上
   - 解决：
     - 在 `SpineToolCanvas.js` 的 `init` 函数中添加了 `canvas.options = options`
     - 修改 `appStart` 函数使用 `canvas.app` 而不是创建新的 PIXI.Application
     - 修正了 `canvas.options.ruler` 的引用路径

3. **TypeError: Cannot set properties of null (setting 'lineWidth')**
   - 问题：`DebugManager.setStyle` 尝试在 `null` 对象上设置属性
   - 解决：在设置属性前检查并初始化 `this.examples[key]` 对象

4. **TypeError: Cannot read properties of undefined (reading 'updateRuler')**
   - 问题：`upScale` 函数尝试调用 `canvas.ruler.updateRuler()` 但 ruler 未创建
   - 解决：添加 null 检查，只在 ruler 和 crosshair 存在时调用其方法

5. **TypeError: Cannot read properties of undefined (reading 'switchUI')**
   - 问题：Vue 组件在 `switchUI` 函数加载前尝试访问它
   - 解决：在 Vue 组件中添加了健壮的关闭方法，包含多种回退机制

### 修复后的关键代码变更

#### SpineToolCanvas.js
```javascript
canvas.init = function (userOptions = {}) {
    let options = {
        // ... 配置选项
        ...userOptions,
    };
    // Store options on canvas object for later access
    canvas.options = options;
    let app = (canvas.app = new PIXI.Application(options.canvas));
    // ... 其他初始化代码
};
```

#### DebugManager.js
```javascript
setStyle: function(style = {}) {
    for (let key in this.examples) {
        // Initialize example object if it's null
        if (!this.examples[key]) {
            this.examples[key] = {};
        }
        for (let key2 in style) {
            const element = document.getElementById("leftMenu-view-debug-" + key2);
            if (element) {
                if (typeof style[key2] == "boolean") {
                    element.checked = style[key2];
                } else {
                    element.value = style[key2];
                }
                this.examples[key][key2] = style[key2];
            }
        }
    }
}
```

#### SpineToolOverlay.vue
```javascript
<script setup>
// 工具面板由 ui.js 的 openTool/switchUI 通过 document.getElementById 控制

function closeTool() {
    // Try multiple methods to close the tool panel
    if (window.switchUI && typeof window.switchUI === 'function') {
        window.switchUI('tool', 0);
    } else if (typeof switchUI === 'function') {
        switchUI('tool', 0);
    } else {
        // Fallback: directly hide the tool element
        const toolElement = document.getElementById('tool');
        if (toolElement) {
            toolElement.style.display = 'none';
        }
    }
}
</script>

<template>
    <div id="tool" style="position: absolute; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.2); display: none">
        <!-- ... 工具面板内容 ... -->
        <div @click="closeTool" class="close-button">
            <img src="@/assets/img/关闭.svg" style="width: 28px" />
        </div>
    </div>
</template>
```

#### main.js
```javascript
SpineTool.appStart = function () {
    let canvas = (this.canvas = pixiGKD());
    canvas.init({
        canvas: {
            // ... 画布配置
        },
        ruler: false,
    });
    // 使用 canvas.init() 创建的 app，而不是创建新的
    let app = canvas.app;
    // ... 其他代码
    if (canvas.options.ruler) {
        // ... 刻度尺代码
    }
}

SpineTool.upScale = function () {
    let world = SpineTool.canvas.world;
    if (SpineTool.canvas.ruler && SpineTool.canvas.ruler.updateRuler) {
        SpineTool.canvas.ruler.updateRuler({
            startX: world.x,
            startY: world.y,
            scale: world.scale.x,
            width: SpineTool.canvas.app.screen.width,
            height: SpineTool.canvas.app.screen.height,
        });
    }
    if (SpineTool.canvas.crosshair && SpineTool.canvas.crosshair.upDraw) {
        SpineTool.canvas.crosshair.upDraw({
            startX: world.x,
            startY: world.y,
            scale: world.scale.x,
            width: SpineTool.canvas.app.screen.width,
            height: SpineTool.canvas.app.screen.height,
        });
    }
}
```

## 后续建议

1. **单元测试**: 为各个 UI 管理器添加单元测试
2. **类型定义**: 考虑添加 TypeScript 类型定义
3. **事件系统**: 可以考虑引入事件系统进一步解耦
4. **配置管理**: 将硬编码的配置提取到配置文件中

## 总结

通过这次重构，SpineTool 的 UI 操作逻辑被成功分离到独立的管理器模块中，实现了：

- **更好的代码组织**: 相关功能集中在专门的管理器中
- **降低耦合度**: SpineTool 对象不再直接操作 DOM
- **提高可维护性**: UI 逻辑修改不会影响核心业务逻辑
- **增强可测试性**: 各个管理器可以独立测试
- **保持兼容性**: 现有代码无需大幅修改

重构后的代码结构更加清晰，为后续的功能扩展和维护奠定了良好的基础。
