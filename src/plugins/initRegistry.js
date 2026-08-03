import { nodeRegistry } from '@/fennec-view/core/NodeRegistry'

// Import built-in core plugins
import imgPlugin from './img'
import spinePlugin from './spine'
import live2dPlugin from './live2d'
import videoPlugin from './video'
import textPlugin from './text'
import rectPlugin from './rect'
import animatedSpritePlugin from './animated-sprite'

// Import external plugins
import standDiffPlugin from './stand-diff'
import svgPlugin from './svg'

// Install all plugins
imgPlugin.install(nodeRegistry)
spinePlugin.install(nodeRegistry)
live2dPlugin.install(nodeRegistry)
videoPlugin.install(nodeRegistry)
textPlugin.install(nodeRegistry)
rectPlugin.install(nodeRegistry)
animatedSpritePlugin.install(nodeRegistry)

standDiffPlugin.install(nodeRegistry)
svgPlugin.install(nodeRegistry)
