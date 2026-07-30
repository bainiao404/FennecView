# SpineTool Vue 3 响应式改造总结

## 改造目标
将左侧菜单栏和右侧图层面板的内容从硬插入 HTML 方式改为使用 Vue 3 的响应式数据绑定，实现：
- 响应式数据更新
- 更好的状态管理
- 组件化的事件处理
- 更清晰的代码结构

## 核心改造

### 1. UI Store 增强

#### 新增响应式状态
```javascript
// 属性面板状态 - 改为数组格式
propertyPanel: {
  currentNode: null,
  attributes: {},
  animationList: [],  // 从 HTML 字符串改为对象数组
  skinList: [],       // 从 HTML 字符串改为对象数组
  slotsList: [],      // 从 HTML 字符串改为对象数组
  propertyText: ''
},

// 图层面板状态 - 新增
layerPanel: {
  sceneFiles: [],        // 场景文件列表
  batchSelection: [],    // 批量选择列表
  batchInstructions: []  // 批量选择说明
}
```

#### 数据结构转换
```javascript
// 之前：HTML 字符串
animationList: `<div class='listDiv' onclick="window.SpineTool.setSpine('animation','walk')">walk[1.2s]</div>`

// 现在：对象数组
animationList: [{
  name: 'walk',
  duration: 1.2,
  onclick: () => window.SpineTool?.setSpine?.('animation', 'walk')
}]
```

### 2. 左侧菜单面板改造

#### SpineLeftMenuPanel.vue 更新

**Script 部分**:
```javascript
import { useUIStore } from '../stores/uiStore'
import { computed } from 'vue'

const uiStore = useUIStore()
const propertyPanel = computed(() => uiStore.propertyPanel)

// 事件处理函数
function handleAnimationClick(animationName) {
    if (window.SpineTool?.setSpine) {
        window.SpineTool.setSpine('animation', animationName)
    }
}
```

**Template 部分**:
```vue
<!-- 之前：静态 div -->
<div id="leftMenu-view-animationList" class="listBox"></div>

<!-- 现在：响应式列表 -->
<div id="leftMenu-view-animationList" class="listBox">
    <div 
        v-for="animation in propertyPanel.animationList" 
        :key="animation.name"
        class="listDiv"
        @click="handleAnimationClick(animation.name)"
    >
        {{ animation.name }}[{{ animation.duration }}s]
    </div>
</div>
```

### 3. 右侧图层面板改造

#### SpineRightLayerPanel.vue 更新

**新增功能**:
- 场景文件响应式列表
- 批量选择响应式列表
- 事件处理函数

**Template 改造**:
```vue
<!-- 场景文件列表 -->
<div class="listBox" id="file_layer_div">
    <div 
        v-for="file in layerPanel.sceneFiles" 
        :key="file.index"
        class="listDiv"
        @click="handleSceneFileClick(file)"
    >
        <div class="listDiv_txt">{{ file.name }}</div>
        <div class="listDiv_div">
            <img 
                src="@/assets/img/播放.png" 
                class="listDiv_img"
                @click.stop="handleSceneFilePlay(file)"
            />
            <img 
                src="@/assets/img/隐藏.png" 
                class="listDiv_img"
                @click.stop="handleSceneFileVisible(file)"
            />
        </div>
    </div>
</div>

<!-- 批量选择列表 -->
<div class="listBox" id="file_layer_div_batch">
    <div 
        v-for="item in layerPanel.batchSelection" 
        :key="`batch-${item.index}`"
        class="listDiv"
        @click="handleBatchItemClick(item)"
        @mouseover="handleBatchItemMouseOver(item)"
        @mouseout="handleBatchItemMouseOut(item)"
        @mousedown="handleBatchItemRemove(item, $event)"
        :data-spineposition="item.index"
    >
        {{ item.name }}
    </div>
</div>
```

## 架构优势

### 1. 响应式更新
- **自动同步**: 数据变化自动更新 UI
- **性能优化**: Vue 的虚拟 DOM 只更新变化的部分
- **状态一致性**: 数据和 UI 始终保持同步

### 2. 组件化事件处理
- **清晰分离**: 事件处理逻辑集中在组件内
- **类型安全**: 通过函数参数传递，避免字符串拼接
- **可测试性**: 事件处理函数可以单独测试

### 3. 数据驱动
- **声明式**: 使用 v-for 等指令声明 UI 结构
- **可维护**: 数据结构清晰，易于理解和修改
- **可扩展**: 新增字段只需修改数据结构

## 向后兼容性

### DOM 同步机制
UI Store 保留了 DOM 同步方法，确保与现有 SpineTool 脚本的兼容性：

```javascript
syncPropertyPanelToDOM() {
  // 属性文本显示
  const propertyElement = document.getElementById('leftMenu-view-property-text')
  if (propertyElement) {
    propertyElement.innerHTML = this.propertyPanel.propertyText
  }
  
  // 动画列表显示 - 保持向后兼容
  const animationElement = document.getElementById('leftMenu-view-animation')
  if (animationElement) {
    animationElement.innerHTML = this.propertyPanel.animationList
      .map(item => `<div class='listDiv' onclick="window.SpineTool.setSpine('animation','${item.name}')">${item.name}[${item.duration}s]</div>`)
      .join('')
  }
}
```

### 双重数据流
- **Vue 组件**: 使用响应式数据直接渲染
- **SpineTool 脚本**: 通过 DOM 同步方法更新
- **数据一致性**: 两种方式访问同一数据源

## 使用方式对比

### 之前：硬插入 HTML
```javascript
// SpineTool 脚本中
function Batch_add_node_Refresh() {
    var txt = "";
    for (var i = 0; i < batch.length; i++) {
        txt += `<div onmousedown="Batch_add_node(event,this,'del')" data-spineposition='${batch[i]}' class='listDiv'>${children[batch[i]].name}</div>`;
    }
    document.getElementById("file_layer_div_batch").innerHTML = txt;
}
```

### 现在：响应式数据
```javascript
// UI Store 中
updateBatchSelection(batchList) {
  this.layerPanel.batchSelection = batchList.map((index, i) => ({
    name: children[index]?.name || `Item${i}`,
    index: index,
    onRemove: () => window.Batch_add_node_del?.(i),
    onMouseOver: () => window.MouseoverList?.(index),
    onMouseOut: () => window.MouseoutList?.(index),
    onClick: () => window.Click_List?.(index)
  }))
  this.syncLayerPanelToDOM()
}

// Vue 组件中
<div 
    v-for="item in layerPanel.batchSelection" 
    :key="`batch-${item.index}`"
    class="listDiv"
    @click="handleBatchItemClick(item)"
    @mouseover="handleBatchItemMouseOver(item)"
    @mouseout="handleBatchItemMouseOut(item)"
    @mousedown="handleBatchItemRemove(item, $event)"
>
    {{ item.name }}
</div>
```

## 测试验证

### 构建测试 ✅
- 所有 Vue 组件正确编译
- 响应式数据绑定正常工作
- 事件处理函数正确绑定

### 功能测试
- [x] 动画列表响应式渲染
- [x] 皮肤列表响应式渲染
- [x] 插槽列表响应式渲染
- [x] 场景文件列表响应式渲染
- [x] 批量选择列表响应式渲染
- [x] 事件处理函数正常工作

## 后续建议

### 1. 完全迁移
- 将所有 SpineTool 脚本中的 DOM 操作迁移到 Store actions
- 移除硬编码的 HTML 生成
- 统一使用 Vue 响应式数据

### 2. 性能优化
- 使用 Vue 的 `v-memo` 优化大列表渲染
- 实现虚拟滚动处理大量数据
- 添加加载状态和错误处理

### 3. 类型安全
- 添加 TypeScript 类型定义
- 使用接口定义数据结构
- 实现严格的类型检查

### 4. 交互增强
- 添加拖拽排序功能
- 实现批量操作
- 添加键盘快捷键支持

## 总结

Vue 3 响应式改造为 SpineTool 带来了：

- **🔄 响应式更新** - 数据变化自动同步到 UI
- **🧩 组件化** - 更清晰的组件结构和事件处理
- **📊 数据驱动** - 声明式 UI，易于维护
- **🔙 向后兼容** - 保持现有功能不受影响
- **⚡ 性能提升** - Vue 虚拟 DOM 优化渲染

这为 SpineTool 的现代化和功能扩展奠定了坚实的基础。
