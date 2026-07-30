# FennecView

一个基于 Vue 3 + Vite 构建的跨平台 Spine & Live2D 骨骼动画可视化交互与编辑客户端（原名 SpineTool）。本项目结合 Pixi.js (v8) 渲染引擎，提供纯前端的动画导入、属性调整、皮肤切换、插槽检查、批量重命名以及多端打包部署的完整工作流。

## 核心特性

- **多骨骼动画引擎支持**：
  - **Spine 骨骼动画**：基于 `simple-pixi-spine` (Pixi v8 兼容版)，支持各版本 Spine 骨骼的导入、播放控制、皮肤/动作切换、以及插槽数据视口调整。
  - **Live2D 角色动画**：基于 `untitled-pixi-live2d-engine`，支持 Cubism 动作交互及配置文件动态加载。
- **丰富的可视化编辑与工具链**：
  - **图层与视口属性调整**：支持动态调整骨骼节点的位置、缩放、旋转、透明度等。
  - **批量重命名工具**：提供针对骨骼名称、贴图文件以及图层资产的批量重命名引擎。
  - **高级导出**：支持将骨骼动画渲染并录制导出为常见的 GIF 动图、MP4 视频或高清壁纸资源。
  - **精灵图导入**：支持自定义 Spritesheet 导入和网格裁切。
- **跨平台运行时支持**：支持构建为网页端 (Web Target)、桌面端客户端 (Electron Target) 以及移动端 App (Cordova App Target)。

---

## 本地开发指南

### 1. 安装依赖
安装项目依赖时，系统会自动触发后置脚本 `scripts/install-electron.cjs`。该脚本会自动下载并提取对应平台的原生 Electron 运行时至本地 `dist/electron` 目录：
```bash
npm install
```

### 2. 启动本地开发服务器
```bash
npm run dev
```

---

## 多端打包编译命令

打包生成的静态资源和客户端可执行文件统一输出在项目根目录的 `dist/` 目录下进行隔离：

### 1. 网页端部署 (Web Target)
```bash
npm run build:web
```
- **产物目录**：`dist/web/`
- **说明**：生成纯前端静态 SPA 资源包，可直接部署于 Nginx、Apache、CDN 静态托管服务上。

### 2. 桌面客户端打包 (Electron Target)
```bash
npm run build:electron
```
- **产物目录**：`dist/electron/`
- **说明**：在编译前端代码后，脚本会自动将 Electron 主进程配置及外壳文件复制部署至 `dist/electron/resources/app`。
- **运行方式**：直接运行 `dist/electron/fennec-view.exe` 启动桌面端。

### 3. 移动端 App 构建 (Cordova Target)
```bash
npm run build:cordova
```
- **产物目录**：`dist/cordova/`
- **说明**：编译生成移动端优化的资产，并自动同步至 `cordova/www/` 目录下。

### 4. 白鸟GKD 容器联调 (BainiaoGKD Target)
```bash
npm run build:bainiaogkd
```
- **说明**：编译打包后，将最新资产同步拷贝到主程序 `../../app/FennecView/www` 目录，便于容器进行联调和整合测试。

---

## Cordova 打包 Android 应用包流程

在执行完多端打包命令后，若需要编译为 Android 原生 APK，请遵循以下流程：

### 前置条件
确保本地已安装 **Java JDK 8**、**Android SDK (Command Line Tools)** 并全局安装了 **Cordova CLI** 工具。

### 打包步骤
```bash
# 1. 编译前端 Cordova 资产并自动同步
npm run build:cordova

# 2. 进入 cordova 文件夹
cd cordova

# 3. 添加 Android 平台工程 (仅需在首次打包时运行)
cordova platform add android

# 4. 运行编译指令，生成 Android 安装包 (.apk)
cordova build android

# 5. 生成的 APK 文件位于以下路径：
# cordova/platforms/android/app/build/outputs/apk/debug/app-debug.apk
```
