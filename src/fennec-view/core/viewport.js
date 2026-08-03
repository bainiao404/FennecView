import { useUIStore } from '@/stores/uiStore'

export default {
    onWindowResize: function () {
        const div = document.getElementById('app_canvas')
        if (!div) return
        const canvas = this.canvas
        if (!canvas || !canvas.app) return
        const app = canvas.app
        app.renderer.resize(div.offsetWidth, div.offsetHeight)
        if (app.canvas && app.canvas.style) {
            app.canvas.style.width = div.offsetWidth + 'px'
            app.canvas.style.height = div.offsetHeight + 'px'
        }
        if (this.preview.state && this.preview.config && this.preview.config.rect) {
            this.adaptWallpaperRect()
        }
    },

    adaptWallpaperRect: function () {
        if (!this.preview.state || !this.preview.config || !this.preview.config.rect) return
        const rect = this.preview.config.rect
        const app = this.canvas.app
        if (!app) return

        const S_w = app.screen.width
        const S_h = app.screen.height
        const W_w = rect.width
        const W_h = rect.height
        if (W_w <= 0 || W_h <= 0 || S_w <= 0 || S_h <= 0) return

        // Scale to cover the screen completely
        const scaleX = S_w / W_w
        const scaleY = S_h / W_h
        const scale = Math.max(scaleX, scaleY)

        const world = this.canvas.world
        world.scale.set(scale)
        world.x = S_w / 2 - (rect.x + W_w / 2) * scale
        world.y = S_h / 2 - (rect.y + W_h / 2) * scale
    },

    centerAndFitAll: function () {
        const world = this.canvas.world
        const box = this.canvas.box
        const app = this.canvas.app
        if (!world || !box || !app || box.children.length === 0) return

        // Save current camera transform
        const oldX = world.x
        const oldY = world.y
        const oldScale = world.scale.x

        // Temporarily reset to base coordinates to compute unscaled combined bounds
        world.position.set(0, 0)
        world.scale.set(1)
        world.updateLocalTransform()

        const bounds = box.getBounds()

        const W_w = bounds.width
        const W_h = bounds.height

        if (W_w <= 0 || W_h <= 0) {
            // Restore original on invalid bounds
            world.position.set(oldX, oldY)
            world.scale.set(oldScale)
            world.updateLocalTransform()
            return
        }

        const centerWorldX = bounds.x + W_w / 2
        const centerWorldY = bounds.y + W_h / 2

        const S_w = app.screen.width
        const S_h = app.screen.height

        // Calculate fitting scale (85% of screen size to keep margins)
        const scaleX = (S_w * 0.85) / W_w
        const scaleY = (S_h * 0.85) / W_h
        let targetScale = Math.min(scaleX, scaleY)
        targetScale = Math.max(0.1, Math.min(3.0, targetScale))

        // Center on screen
        const targetX = S_w / 2 - centerWorldX * targetScale
        const targetY = S_h / 2 - centerWorldY * targetScale

        world.scale.set(targetScale)
        world.x = targetX
        world.y = targetY
        world.updateLocalTransform()

        const uiStore = useUIStore()
        uiStore.updateWorldPosition(world.x, world.y)
        uiStore.updateScale(targetScale)

        this.updateScale()
        app.render()
    },

    setBackgroundColor: function (type, value) {
        if (!this.canvas.background) return
        const uiStore = useUIStore()
        switch (type) {
            case 'color':
                this.canvas.background.redraw(value)
                uiStore.updateBackgroundColor(value)
                break
            case 'alpha':
                this.canvas.background.alpha = Number(value)
                uiStore.updateBackgroundAlpha(Number(value))
                break
        }
    },

    resetScale: function () {
        if (this.canvas && this.canvas.world) {
            this.canvas.world.scale.set(1)
            this.canvas.world.position.set(0, 0)
            this.updateScale()
            const uiStore = useUIStore()
            uiStore.updateScale(1)
            uiStore.updateWorldPosition(0, 0)
        }
    },

    centerWorld: function () {
        if (this.preview && this.preview.state) return
        if (this.canvas && this.canvas.world && this.canvas.app) {
            const centerX = this.canvas.app.screen.width / 2
            const centerY = this.canvas.app.screen.height / 2
            this.canvas.world.position.set(centerX, centerY)
            this.updateScale()
            const uiStore = useUIStore()
            uiStore.updateWorldPosition(centerX, centerY)
        }
    },

    updateScale: function () {
        const world = this.canvas.world
        if (this.canvas.crosshair && this.canvas.crosshair.redraw) {
            this.canvas.crosshair.redraw({
                startX: world.x,
                startY: world.y,
                scale: world.scale.x,
                width: this.canvas.app.screen.width,
                height: this.canvas.app.screen.height,
            })
        }
    },

    setFPS: function (value) {
        const uiStore = useUIStore()
        uiStore.updateFPS(value)
        if (this.canvas && this.canvas.app) {
            this.canvas.app.ticker.maxFPS = value
        }
    },

    setResolution: function (value) {
        const uiStore = useUIStore()
        uiStore.updateResolution(value)
        if (this.canvas && this.canvas.app) {
            this.canvas.app.renderer.resolution = value
        }
        this.onWindowResize()
    },
}
