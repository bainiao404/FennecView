let isLive2DMiddlewareRegistered = false

export function registerLive2DMiddleware() {
    if (isLive2DMiddlewareRegistered) return
    if (
        typeof PIXI !== 'undefined' &&
        PIXI.live2d &&
        PIXI.live2d.Live2DFactory &&
        PIXI.live2d.Live2DFactory.live2DModelMiddlewares
    ) {
        isLive2DMiddlewareRegistered = true

        function patchSettings(settings) {
            if (!settings || settings._patchedResolveURL) return
            settings._patchedResolveURL = true
            const originalResolve = settings.resolveURL
            if (typeof originalResolve === 'function') {
                settings.resolveURL = function (path) {
                    if (
                        typeof path === 'string' &&
                        (path.startsWith('blob:') ||
                            path.startsWith('data:') ||
                            path.startsWith('http:') ||
                            path.startsWith('https:'))
                    ) {
                        return path
                    }
                    return originalResolve.call(this, path)
                }
            }
        }

        const patchMiddleware = async (context, next) => {
            if (context.settings) {
                patchSettings(context.settings)
            }
            Object.defineProperty(context, 'settings', {
                get() {
                    return this._settingsVal
                },
                set(val) {
                    this._settingsVal = val
                    if (val) {
                        patchSettings(val)
                    }
                },
                configurable: true,
                enumerable: true,
            })
            await next()
        }

        PIXI.live2d.Live2DFactory.live2DModelMiddlewares.unshift(patchMiddleware)
    }
}
