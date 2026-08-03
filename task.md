# FennecView 组件优化迭代任务列表

本项目共有 47 个 Vue 组件。我们将采取分组迭代的方式，每次对 3 个组件进行深度代码分析与优化设计，经用户确认后实施并更新任务列表。

## 🚀 迭代状态 (已全部完成 47/47)
- [x] **第 1 组**：`ToolPanel.vue`, `SettingsPanel.vue`, `LayersPanel.vue` <!-- id: g1 -->
  - [x] 分析与优化建议设计 <!-- id: g1-1 -->
  - [x] 实施优化并打包验证 <!-- id: g1-2 -->
- [x] **第 2 组**：`PropertyPanel.vue`, `ImportPanel.vue`, `ExportPanel.vue` <!-- id: g2 -->
  - [x] 分析与优化建议设计 <!-- id: g2-1 -->
  - [x] 实施优化并打包验证 <!-- id: g2-2 -->
- [x] **第 3 组**：`SlotsPanel.vue`, `DebugPanel.vue`, `AnimationAndSkinPanel.vue` <!-- id: g3 -->
  - [x] 分析与优化建议设计 <!-- id: g3-1 -->
  - [x] 实施优化并打包验证 <!-- id: g3-2 -->
- [x] **第 4 组**：`AddPanel.vue`, `AppShell.vue`, `LayerList.vue` <!-- id: g4 -->
  - [x] 分析与优化建议设计 <!-- id: g4-1 -->
  - [x] 实施优化并打包验证 <!-- id: g4-2 -->
- [x] **第 5 组**：`LayerViewport.vue`, `SpineCanvas.vue`, `CanvasControls.vue` <!-- id: g5 -->
  - [x] 分析与优化建议设计 <!-- id: g5-1 -->
  - [x] 实施优化并打包验证 <!-- id: g5-2 -->
- [x] **第 6 组**：`TitleBar.vue`, `Window.vue`, `SpineUserRectOverlay.vue` <!-- id: g6 -->
  - [x] 分析与优化建议设计 <!-- id: g6-1 -->
  - [x] 实施优化并打包验证 <!-- id: g6-2 -->
- [x] **第 7 组**：`PageHeader.vue`, `StandDiffPropertiesPanel.vue`, `App.vue` <!-- id: g7 -->
  - [x] 分析与优化建议设计 <!-- id: g7-1 -->
  - [x] 实施优化并打包验证 <!-- id: g7-2 -->
- [x] **第 8 组**：`HomeView.vue`, `AboutView.vue`, `ImportPrepareView.vue` <!-- id: g8 -->
  - [x] 分析与优化建议设计 <!-- id: g8-1 -->
  - [x] 实施优化并打包验证 <!-- id: g8-2 -->
- [x] **第 9 组**：`SpineConvertView.vue`, `ExportWallpaperView.vue`, `ExportMp4View.vue` <!-- id: g9 -->
  - [x] 分析与优化建议设计 <!-- id: g9-1 -->
  - [x] 实施优化并打包验证 <!-- id: g9-2 -->
- [x] **第 10 组**：`ExportGifView.vue`, `CordovaFileView.vue`, `BatchRenameView.vue` <!-- id: g10 -->
  - [x] 分析与优化建议设计 <!-- id: g10-1 -->
  - [x] 实施优化并打包验证 <!-- id: g10-2 -->
- [x] **第 11 组**：`AnimatedSpriteConfig.vue`, `AssetConfigContainer.vue`, `AssetList.vue` <!-- id: g11 -->
  - [x] 分析与优化建议设计 <!-- id: g11-1 -->
  - [x] 实施优化并打包验证 <!-- id: g11-2 -->
- [x] **第 12 组**：`Live2dConfig.vue`, `MediaConfig.vue`, `OrphanedList.vue` <!-- id: g12 -->
  - [x] 分析与优化建议设计 <!-- id: g12-1 -->
  - [x] 实施优化并打包验证 <!-- id: g12-2 -->
- [x] **第 13 组**：`SpineConfig.vue`, `SpritesheetConfig.vue`, `SpritesheetGridConfig.vue` <!-- id: g13 -->
  - [x] 分析与优化建议设计 <!-- id: g13-1 -->
  - [x] 实施优化并打包验证 <!-- id: g13-2 -->
- [x] **第 14 组**：`StandDiffConfig.vue` 以及全部属性配置通用控件 <!-- id: g14 -->
  - [x] 分析与优化建议设计 <!-- id: g14-1 -->
  - [x] 实施优化并打包验证 <!-- id: g14-2 -->

---

## 📋 完整组件清单
### 📂 views (视图页面)
- [x] `SpineConvertView.vue`
- [x] `ImportPrepareView.vue`
- [x] `HomeView.vue`
- [x] `ExportWallpaperView.vue`
- [x] `ExportMp4View.vue`
- [x] `ExportGifView.vue`
- [x] `CordovaFileView.vue`
- [x] `BatchRenameView.vue`
- [x] `AboutView.vue`

### 📂 plugins & panels (面板组件)
- [x] `StandDiffPropertiesPanel.vue`
- [x] `ToolPanel.vue`
- [x] `SlotsPanel.vue`
- [x] `SettingsPanel.vue`
- [x] `PropertyPanel.vue`
- [x] `LayersPanel.vue`
- [x] `ImportPanel.vue`
- [x] `ExportPanel.vue`
- [x] `DebugPanel.vue`
- [x] `AnimationAndSkinPanel.vue`
- [x] `AddPanel.vue`

### 📂 layout & canvas (布局与画布)
- [x] `Window.vue`
- [x] `TitleBar.vue`
- [x] `SpineUserRectOverlay.vue`
- [x] `PageHeader.vue`
- [x] `LayerViewport.vue`
- [x] `LayerList.vue`
- [x] `AppShell.vue`
- [x] `SpineCanvas.vue`
- [x] `CanvasControls.vue`
- [x] `App.vue`

### 📂 import & config (导入与配置)
- [x] `StandDiffConfig.vue`
- [x] `SpritesheetGridConfig.vue`
- [x] `SpritesheetConfig.vue`
- [x] `SpineConfig.vue`
- [x] `OrphanedList.vue`
- [x] `MediaConfig.vue`
- [x] `Live2dConfig.vue`
- [x] `AssetList.vue`
- [x] `AssetConfigContainer.vue`
- [x] `AnimatedSpriteConfig.vue`

### 📂 controls (通用参数控件)
- [x] `TextControl.vue`
- [x] `SliderControl.vue`
- [x] `SelectControl.vue`
- [x] `ReadonlyControl.vue`
- [x] `NumberControl.vue`
- [x] `ColorControl.vue`
- [x] `BooleanControl.vue`

---

## 📝 备注
- `SlotsPanel.vue`、`AnimationAndSkinPanel.vue` 组件需要后续 of 深度解耦和重构。
