import { createApp } from 'vue'
import TDesign from 'tdesign-vue-next'
import { createPinia } from 'pinia'
import * as PIXINamespace from 'pixi.js'
import { Live2DModel, Live2DPlugin, MotionPreloadStrategy } from 'untitled-pixi-live2d-engine'
import SimpleSpine from 'simple-pixi-spine'
import GKD from '@/assets/gkd-js-0.2'

// Create a mutable wrapper containing all PIXI exports
const PIXI = { ...PIXINamespace }

// Register Live2D plugin in PixiJS v8
PIXINamespace.extensions.add(Live2DPlugin)
PIXI.live2d = { Live2DModel, MotionPreloadStrategy }

// Setup flat filter mapping for compatibility
PIXI.filters = {
    ColorMatrixFilter: PIXINamespace.ColorMatrixFilter
}

window.PIXI = PIXI
window.SimpleSpine = SimpleSpine
SimpleSpine.registerPIXI(PIXI)
window.GKD = GKD


import App from './App.vue'
import router from './router'
import { createPiniaPlugin } from './plugins/piniaPlugin'

// 引入组件库的少量全局样式变量
import 'tdesign-vue-next/es/style/index.css'
// FennecView 样式 - 整合 0.css, default.css, 0_pc.css，摆脱外部 CSS 依赖
import '@/assets/styles/fennec-view.css'

// 基础工具函数（供 FennecView 脚本使用）
import '@/utils/baseScript'

const pinia = createPinia()
pinia.use(createPiniaPlugin())

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(TDesign)
app.mount('#app')
