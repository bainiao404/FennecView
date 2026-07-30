/**
 * Pinia 插件 - 将 UI store 暴露给全局 window 对象
 * 这样 FennecView 和其他非 Vue 组件可以访问 UI 状态
 */
export function createPiniaPlugin() {
  // 直接返回 store 处理函数，不要嵌套 pinia.use()
  return ({ store }) => {
    if (store.$id === 'ui') {
      // 将 UI store 暴露给全局对象
      window.UIStore = store
      console.log('Pinia Plugin: UI Store initialized and exposed to window')
    }
    if (store.$id === 'layers') {
      window.LayerStore = store
      console.log('Pinia Plugin: Layer Store initialized and exposed to window')
    }
  }
}
