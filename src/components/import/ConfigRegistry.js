import SpineConfig from './SpineConfig.vue'
import Live2dConfig from './Live2dConfig.vue'
import SpritesheetConfig from './SpritesheetConfig.vue'
import MediaConfig from './MediaConfig.vue'
import AnimatedSpriteConfig from './AnimatedSpriteConfig.vue'
import SpritesheetGridConfig from './SpritesheetGridConfig.vue'
import StandDiffConfig from './StandDiffConfig.vue'

const registry = {
    spine: SpineConfig,
    live2d: Live2dConfig,
    spritesheet: SpritesheetConfig,
    animated_sprite: AnimatedSpriteConfig,
    spritesheet_grid: SpritesheetGridConfig,
    stand_diff: StandDiffConfig,
    image: MediaConfig,
    video: MediaConfig,
    audio: MediaConfig
}

export function getConfigComponent(type) {
    return registry[type] || MediaConfig
}
