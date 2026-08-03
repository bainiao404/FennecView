import { defineStore } from 'pinia'
import FennecView from '@/fennec-view/FennecView'

/**
 * UI 状态管理 Store
 * 使用 Pinia 集中管理所有 UI 相关状态
 */
export const useUIStore = defineStore('ui', {
  state: () => ({


    antialiasEnabled: (() => {
      const saved = localStorage.getItem('antialiasEnabled');
      return saved === 'true';
    })(),

    // 主界面状态
    mainUI: {
      windowsMenuVisible: true,
      menuLayerVisible: true,
      leftMenuVisible: true,
      leftMenuDivVisible: true,
      windowsTopMenuVisible: true,
      toolVisible: true
    },
    
    // 工具面板状态
    toolPanel: {
      currentTool: null, // 当前打开的工具 ('about', 'settings', etc.)
      isVisible: false
    },
    
    // 画布显示状态
    canvasDisplay: {
      fps: 60,
      resolution: 1,
      scale: 1,
      worldPosition: { x: 0, y: 0 },
      canvasPosition: { x: 0, y: 0 },
      progressBar: 0,
      backgroundColor: '#ffffff',
      backgroundAlpha: 0
    },
    
    // 属性面板状态
    propertyPanel: {
      currentNode: null,
      attributes: {},
      animationList: [],
      skinList: [],
      slotsList: [],
      propertyAttributes: [],
      activeAnimationName: '',
      activeSkinName: '',
      schema: {},
      live2dParametersList: [],
      live2dPartsList: []
    },
    
    // 图层面板状态
    layerPanel: {
      sceneFiles: [],
      batchSelection: [],
      batchInstructions: [
        '1.鼠标右键点击',
        '　上方场景文件',
        '　加入批量选择',
        '　',
        '2.右键点击列表',
        '　取消该次选择'
      ],
      isVisible: false
    },
    
    // 导出配置状态
    exportConfig: {
      wallpaperEngine: {
        title: 'FennecViewExport',
        fps: 30,
        resolution: 1,
        iconArrayBuffer: null,
        rect: null
      },
      mp4: {
        fps: 30,
        resolution: 1,
        autoDuration: true,
        duration: 5,
        title: 'FennecViewExport'
      },
      gif: {
        fps: 15,
        resolution: 1,
        autoDuration: true,
        duration: 5,
        quality: 10,
        title: 'FennecViewExport',
        iconArrayBuffer: null,
        rect: null,
        transparentBg: false
      }
    },
    exportMp4Status: {
      codecInfo: '',
      sizeInfo: '0x0',
      progressInfo: '0%'
    },
    exportGifStatus: {
      sizeInfo: '0x0',
      progressInfo: '0%'
    },
    
    // 调试状态
    debug: {
      isVisible: false,
      enabled: false,
      style: {
        lineWidth: 4,
        drawMeshHull: false,
        drawMeshTriangles: false,
        drawBones: true,
        drawPaths: false,
        drawBoundingBoxes: true,
        drawClipping: false,
        drawRegionAttachments: false
      },
      examples: {
        spine: {},
        spine42: {}
      }
    },
    
    // 用户交互状态
    userInteraction: {
      isSelectingRect: false,
      rectHint: '',
      rectParameters: ''
    },
    
    // 预览模式状态
    previewMode: {
      isActive: false,
      config: null
    },
    
    // Cordova 文件浏览器状态
    cordovaFileView: {
      display: false,
      title: '文件浏览器',
      multiple: true,
      onlyFolder: false,
      openPath: '',
      onSelect: null
    }
  }),

  getters: {
    // 主界面显示状态
    isMainUIVisible: (state) => {
      return state.mainUI.windowsMenuVisible && 
             state.mainUI.menuLayerVisible && 
             state.mainUI.leftMenuVisible
    },
    
    // 当前工具状态
    currentTool: (state) => state.toolPanel.currentTool,
    isToolVisible: (state) => state.toolPanel.isVisible,
    
    // 画布信息
    canvasInfo: (state) => state.canvasDisplay,
    
    // 当前节点信息
    currentNodeInfo: (state) => state.propertyPanel.currentNode
  },

  actions: {
    // 主界面控制
    setMainUIVisibility(visible) {
      this.mainUI.windowsMenuVisible = visible
      this.mainUI.menuLayerVisible = visible
      this.mainUI.leftMenuVisible = visible
      this.mainUI.leftMenuDivVisible = visible
      this.mainUI.windowsTopMenuVisible = visible
      this.mainUI.toolVisible = visible
    },
    
    setPreviewMode() {
      this.previewMode.isActive = true
      this.setMainUIVisibility(false)
      
      // 预览模式样式由组件通过响应式绑定自动处理
    },
    
    // 工具面板控制
    showTool(toolName) {
      this.toolPanel.currentTool = toolName
      this.toolPanel.isVisible = true
    },
    
    hideTool() {
      this.toolPanel.isVisible = false
      this.toolPanel.currentTool = null
    },
    
    switchTool(toolName) {
      if (this.toolPanel.currentTool === toolName) {
        this.hideTool()
      } else {
        this.showTool(toolName)
      }
    },
    

    
    // 图层面板切换
    toggleLayerPanel() {
      this.layerPanel.isVisible = !this.layerPanel.isVisible
    },
    
    // 导出配置更新
    updateExportConfig(type, config) {
      if (type === 'wallpaperEngine') {
        Object.assign(this.exportConfig.wallpaperEngine, config)
        if (FennecView && FennecView.exportWallpaperEngineConfig) {
          Object.assign(FennecView.exportWallpaperEngineConfig, config)
        }
      } else if (type === 'mp4') {
        Object.assign(this.exportConfig.mp4, config)
      } else if (type === 'gif') {
        Object.assign(this.exportConfig.gif, config)
      }
    },
    
    // 画布显示更新
    updateBackgroundColor(color) {
      this.canvasDisplay.backgroundColor = color
    },
    
    updateBackgroundAlpha(alpha) {
      this.canvasDisplay.backgroundAlpha = alpha
    },
    
    updateFPS(fps) {
      this.canvasDisplay.fps = fps
    },
    
    updateResolution(resolution) {
      this.canvasDisplay.resolution = resolution
    },
    
    updateScale(scale) {
      this.canvasDisplay.scale = scale
    },
    
    updateWorldPosition(x, y) {
      this.canvasDisplay.worldPosition = { x, y }
    },
    
    updateCanvasPosition(x, y) {
      this.canvasDisplay.canvasPosition = { x, y }
    },
    
    updateProgressBar(progress) {
      this.canvasDisplay.progressBar = progress
    },



    setAntialiasEnabled(enabled) {
      this.antialiasEnabled = enabled
      localStorage.setItem('antialiasEnabled', enabled ? 'true' : 'false')
    },

    updateExportMp4Status(status) {
      this.exportMp4Status = { ...this.exportMp4Status, ...status }
    },
    
    updateExportGifStatus(status) {
      this.exportGifStatus = { ...this.exportGifStatus, ...status }
    },
    
    updatePropertyPanel(node) {
      if (!node) {
        this.propertyPanel.currentNode = null
        this.propertyPanel.attributes = {}
        this.propertyPanel.animationList = []
        this.propertyPanel.skinList = []
        this.propertyPanel.slotsList = []
        this.propertyPanel.propertyAttributes = []
        this.propertyPanel.schema = {}
        this.propertyPanel.activeAnimationName = ''
        this.propertyPanel.activeSkinName = ''
        this.propertyPanel.live2dParametersList = []
        this.propertyPanel.live2dPartsList = []
        return
      }

      const nodeInstance = node.nodeData
      if (!nodeInstance) {
        this.propertyPanel.currentNode = null
        this.propertyPanel.attributes = {}
        this.propertyPanel.animationList = []
        this.propertyPanel.skinList = []
        this.propertyPanel.slotsList = []
        this.propertyPanel.propertyAttributes = []
        this.propertyPanel.schema = {}
        this.propertyPanel.activeAnimationName = ''
        this.propertyPanel.activeSkinName = ''
        this.propertyPanel.live2dParametersList = []
        this.propertyPanel.live2dPartsList = []
        return
      }

      const serialized = nodeInstance.getSerializableState()
      if (serialized) {
        const box = FennecView.canvas?.box
        if (box && box.children) {
          serialized.index = box.children.indexOf(node)
        } else {
          serialized.index = -1
        }
      }

      this.propertyPanel.currentNode = serialized

      if (node && node.nodeData) {
        const attributes = node.nodeData.getAttributes()
        this.propertyPanel.attributes = attributes
        
        // 保存当前激活的动画/皮肤名到 Pinia，确保 Vue 能响应式侦听变化
        if (serialized) {
          this.propertyPanel.activeAnimationName = serialized.activeAnimationName || ''
          this.propertyPanel.activeSkinName = serialized.activeSkinName || ''
        } else {
          this.propertyPanel.activeAnimationName = ''
          this.propertyPanel.activeSkinName = ''
        }
        
        // 处理动画列表
        if (attributes.animations) {
          this.propertyPanel.animationList = attributes.animations.map(e => ({
            name: e.name,
            duration: Math.round(e.duration * 100) / 100,
            onclick: () => FennecView?.updateNodeProperty?.('animation', e.name)
          }))
        }
        
        // 处理皮肤列表
        if (attributes.skins) {
          this.propertyPanel.skinList = attributes.skins.map(e => {
            const skinName = typeof e === 'string' ? e : e.name || 'Unknown'
            return {
              name: skinName,
              onclick: () => FennecView?.updateNodeProperty?.('skin', skinName)
            }
          })
        }
        
        // 处理插槽列表
        if (attributes.slots) {
          const attachments = attributes.attachments || [];
          this.propertyPanel.slotsList = attributes.slots.map((e, i) => {
            const slotName = e.data ? e.data.name : e;
            const slotData = e.data || e;
            const attachment = attachments[i] || {};
            let currentAttachment = 'Empty';
            
            // 构建附件列表
            const attachmentList = [];
            attachmentList.push({
              name: 'Empty',
              onclick: () => FennecView?.updateNodeProperty?.('attachment', [slotName, null])
            });
            
            for (let key in attachment) {
              const a = attachment[key];
              if (e.attachment && e.attachment.name === a.name) {
                currentAttachment = a.name;
              }
              attachmentList.push({
                name: a.name,
                onclick: () => FennecView?.updateNodeProperty?.('attachment', [slotName, a.name])
              });
            }
            
            return {
              name: slotName,
              alpha: slotData.color?.a ?? 1,
              index: i,
              currentAttachment: currentAttachment,
              attachments: attachmentList,
              onAlphaChange: (value) => FennecView?.updateNodeProperty?.('slotsAlpha', [i, value])
            };
          });
        }
        
        // 处理 Live2D 参数列表
        if (attributes.live2dParameters) {
          this.propertyPanel.live2dParametersList = attributes.live2dParameters.map((param) => {
            return {
              name: param.name,
              min: param.min,
              max: param.max,
              value: param.value,
              defaultValue: param.defaultValue,
              state: param.state,
              onValueChange: (val) => FennecView?.updateNodeProperty?.('live2dParameter', [param.name, val]),
              onStateChange: (state) => FennecView?.updateNodeProperty?.('live2dParameterState', [param.name, state])
            };
          });
        } else {
          this.propertyPanel.live2dParametersList = [];
        }
        
        // 处理 Live2D 部件列表
        if (attributes.live2dParts) {
          this.propertyPanel.live2dPartsList = attributes.live2dParts.map((part) => {
            return {
              name: part.name,
              opacity: part.opacity,
              state: part.state,
              onOpacityChange: (val) => FennecView?.updateNodeProperty?.('live2dPart', [part.name, val]),
              onStateChange: (state) => FennecView?.updateNodeProperty?.('live2dPartState', [part.name, state])
            };
          });
        } else {
          this.propertyPanel.live2dPartsList = [];
        }
        
        // 保存可选自定义架构
        this.propertyPanel.schema = attributes.schema || {}
        
        // 生成结构化属性数据（响应式）
        this.propertyPanel.propertyAttributes = this.getAttributesArray(attributes.attributes || {})
      }
    },
    
    // 图层面板更新
    updateSceneFiles(sceneFiles) {
      this.layerPanel.sceneFiles = sceneFiles.map((file, index) => ({
        ...file,
        index,
        onClick: () => FennecView.selectNodeFromList(index),
        onPlay: () => FennecView.updateNodeProperty('play', null, index),
        onVisible: () => FennecView.updateNodeProperty('visible', null, index),
        onBatchAdd: (event) => FennecView.toggleBatchSelection(event, { dataset: { spineposition: index } }, 'add')
      }))
    },
    
    updateBatchSelection(batchList) {
      const box = FennecView.canvas?.box;
      this.layerPanel.batchSelection = batchList.map((poStr) => {
        const index = parseInt(poStr, 10);
        const node = box?.children[index];
        return {
          index: index,
          name: node ? node.name : `Instance ${index}`,
          onClick: () => FennecView.selectNodeFromList(index),
          onMouseOver: () => FennecView.hoverNodeFromList(index),
          onMouseOut: () => FennecView.unhoverNodeFromList(index),
          onRemove: () => {
            const idx = FennecView.click.batchList.indexOf(poStr);
            if (idx > -1) {
              FennecView.click.batchList.splice(idx, 1);
              FennecView.refreshBatchSelection();
            }
          }
        };
      });
    },
    
    // 导出配置更新
    updateExportConfigValue(type, key, value) {
      if (type === 'wallpaperEngine') {
        this.exportConfig.wallpaperEngine[key] = value
        if (FennecView && FennecView.exportWallpaperEngineConfig) {
          FennecView.exportWallpaperEngineConfig[key] = value
        }
      } else if (type === 'mp4') {
        this.exportConfig.mp4[key] = value
      } else if (type === 'gif') {
        this.exportConfig.gif[key] = value
      }
    },
    
    // 调试状态更新
    updateDebugStyle(style) {
      this.debug.style = { ...this.debug.style, ...style }
    },

    setDebugEnabled(enabled) {
      this.debug.enabled = enabled
    },
    
    toggleDebug(type) {
      this.debug.isVisible = !this.debug.isVisible
    },
    
    // 用户交互更新
    startRectSelection(hint = '请划取区域') {
      this.userInteraction.isSelectingRect = true
      this.userInteraction.rectHint = hint
    },
    
    updateRectParameters(rect) {
      if (FennecView && FennecView.getWindowRectToWorldRect) {
        const worldRect = FennecView.getWindowRectToWorldRect(rect)
        this.userInteraction.rectParameters = 
          `X:${Math.round(worldRect.x)}/Y:${Math.round(worldRect.y)}/W:${Math.round(worldRect.width)}/H:${Math.round(worldRect.height)}`
      }
    },
    
    endRectSelection() {
      this.userInteraction.isSelectingRect = false
      this.userInteraction.rectHint = ''
    },
    
    getAttributesArray(obj) {
      const result = []
      function _get(obj) {
        for (let key in obj) {
          if (obj[key] && typeof obj[key] === 'object') {
            _get(obj[key])
          } else {
            let displayValue = obj[key]
            if (typeof displayValue === 'number') {
              if (key === 'rotation') {
                displayValue = Math.round((displayValue * 180 / Math.PI) * 100) / 100
              } else {
                displayValue = Math.trunc(displayValue * 100) / 100
              }
            }
            result.push({ key, value: displayValue })
          }
        }
      }
      _get(obj)
      return result
    },

    updateCurrentNodeProperty(property, value, index = undefined) {
      if (FennecView && typeof FennecView.updateNodeProperty === 'function') {
        if (index !== undefined && index !== null) {
          FennecView.updateNodeProperty(property, value, index)
        } else {
          FennecView.updateNodeProperty(property, value)
        }
      }
    },

    syncCurrentNodeLive2D(parametersList, partsList) {
      if (FennecView && FennecView.canvas && FennecView.canvas.box && this.propertyPanel.currentNode) {
        const index = this.propertyPanel.currentNode.index
        const node = FennecView.canvas.box.children[index]
        if (node && node.nodeData && typeof node.nodeData.syncLive2DParametersAndParts === 'function') {
          node.nodeData.syncLive2DParametersAndParts(parametersList, partsList)
        }
      }
    },

    openCordovaFileView(options = {}) {
      this.cordovaFileView = {
        display: true,
        title: options.title || '文件浏览器',
        multiple: options.multiple !== false,
        onlyFolder: !!options.onlyFolder,
        openPath: options.openPath || '',
        onSelect: options.onSelect || null
      }
    },
    
    closeCordovaFileView() {
      this.cordovaFileView.display = false
    }
  }
})
