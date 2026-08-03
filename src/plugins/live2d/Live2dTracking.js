import { setParameterValue } from './Live2dParameterSetter'

export function updateLive2DTracking(coreModel, trackingState, mousePos, nodeScreenPos, appWidth, appHeight) {
    if (!coreModel) return

    const mouseX = mousePos.x - nodeScreenPos.x
    const mouseY = mousePos.y - nodeScreenPos.y

    const maxDistanceX = appWidth / 2
    const maxDistanceY = appHeight / 2

    const ratioX = mouseX / maxDistanceX
    const ratioY = mouseY / maxDistanceY

    const targetHeadX = Math.max(-30, Math.min(30, ratioX * 30))
    const targetHeadY = Math.max(-30, Math.min(30, -ratioY * 30))
    const targetHeadZ = Math.max(-30, Math.min(30, ratioX * 30))
    const targetBodyX = Math.max(-10, Math.min(10, ratioX * 10))
    const targetBodyY = Math.max(-10, Math.min(10, -ratioY * 10))
    const targetEyeX = Math.max(-1, Math.min(1, ratioX))
    const targetEyeY = Math.max(-1, Math.min(1, -ratioY))

    const smoothing = 0.1
    const current = trackingState.current
    current.headX += (targetHeadX - current.headX) * smoothing
    current.headY += (targetHeadY - current.headY) * smoothing
    current.headZ += (targetHeadZ - current.headZ) * smoothing
    current.bodyX += (targetBodyX - current.bodyX) * smoothing
    current.bodyY += (targetBodyY - current.bodyY) * smoothing
    current.eyeX += (targetEyeX - current.eyeX) * smoothing
    current.eyeY += (targetEyeY - current.eyeY) * smoothing

    setParameterValue(coreModel, 'ParamAngleX', current.headX)
    setParameterValue(coreModel, 'ParamAngleY', current.headY)
    setParameterValue(coreModel, 'ParamAngleZ', current.headZ)
    setParameterValue(coreModel, 'ParamBodyAngleX', current.bodyX)
    setParameterValue(coreModel, 'ParamBodyAngleY', current.bodyY)
    setParameterValue(coreModel, 'ParamEyeBallX', current.eyeX)
    setParameterValue(coreModel, 'ParamEyeBallY', current.eyeY)
}
