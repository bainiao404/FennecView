export function setParameterValue(coreModel, name, value) {
    if (!coreModel) return false
    // 1. Try Cubism 4/5
    const params = coreModel._model?.parameters
    if (params && params.ids) {
        let idx = params.ids.indexOf(name)
        if (idx === -1) {
            const lowerName = name.toLowerCase()
            idx = params.ids.findIndex(id => id.toLowerCase() === lowerName)
        }
        if (idx !== -1) {
            if (typeof coreModel.setParameterValueByIndex === 'function') {
                coreModel.setParameterValueByIndex(idx, value)
            } else if (params.values) {
                params.values[idx] = value
            }
            return true
        }
    }
    // 2. Try Cubism 2
    if (coreModel._parameterIds) {
        let idx = coreModel._parameterIds.indexOf(name)
        if (idx === -1) {
            const lowerName = name.toLowerCase()
            idx = coreModel._parameterIds.findIndex(id => id.toLowerCase() === lowerName)
        }
        if (idx !== -1) {
            if (typeof coreModel.setParameterValueByIndex === 'function') {
                coreModel.setParameterValueByIndex(idx, value)
            } else if (coreModel._parameterValues) {
                coreModel._parameterValues[idx] = value
            }
            return true
        }
    }
    // 3. Fallback
    if (typeof coreModel.setParameterValueById === 'function') {
        coreModel.setParameterValueById(name, value)
        return true
    }
    return false
}

export function setPartOpacity(coreModel, name, value) {
    if (!coreModel) return false
    // 1. Try Cubism 4/5
    const parts = coreModel._model?.parts
    if (parts && parts.ids) {
        let idx = parts.ids.indexOf(name)
        if (idx === -1) {
            const lowerName = name.toLowerCase()
            idx = parts.ids.findIndex(id => id.toLowerCase() === lowerName)
        }
        if (idx !== -1) {
            if (typeof coreModel.setPartOpacityByIndex === 'function') {
                coreModel.setPartOpacityByIndex(idx, value)
            } else if (parts.opacities) {
                parts.opacities[idx] = value
            }
            return true
        }
    }
    // 2. Try Cubism 2
    if (coreModel._partIds) {
        let idx = coreModel._partIds.indexOf(name)
        if (idx === -1) {
            const lowerName = name.toLowerCase()
            idx = coreModel._partIds.findIndex(id => id.toLowerCase() === lowerName)
        }
        if (idx !== -1) {
            if (typeof coreModel.setPartOpacityByIndex === 'function') {
                coreModel.setPartOpacityByIndex(idx, value)
            } else if (coreModel._partOpacities) {
                coreModel._partOpacities[idx] = value
            }
            return true
        }
    }
    // 3. Fallback
    if (typeof coreModel.setPartOpacityById === 'function') {
        coreModel.setPartOpacityById(name, value)
        return true
    }
    return false
}

export function setLive2dParameter(live2DParameters, t) {
    let pName = t[0]
    let pVal = parseFloat(t[1])
    if (!live2DParameters[pName]) {
        live2DParameters[pName] = {
            state: true,
            value: pVal,
            targetValue: pVal,
            transitionSpeed: 0.1,
        }
    } else {
        live2DParameters[pName].targetValue = pVal
        live2DParameters[pName].state = true
    }
}

export function setLive2dParameterState(live2DParameters, t) {
    let pName = t[0]
    let pState = !!t[1]
    if (live2DParameters[pName]) {
        live2DParameters[pName].state = pState
    } else if (pState) {
        live2DParameters[pName] = {
            state: true,
            value: 0,
            targetValue: 0,
            transitionSpeed: 0.1,
        }
    }
}

export function setLive2dPart(live2DParts, t) {
    let pName = t[0]
    let pVal = parseFloat(t[1])
    if (!live2DParts[pName]) {
        live2DParts[pName] = {
            state: true,
            value: pVal,
            targetValue: pVal,
            transitionSpeed: 0.1,
        }
    } else {
        live2DParts[pName].targetValue = pVal
        live2DParts[pName].state = true
    }
}

export function setLive2dPartState(live2DParts, t) {
    let pName = t[0]
    let pState = !!t[1]
    if (live2DParts[pName]) {
        live2DParts[pName].state = pState
    } else if (pState) {
        live2DParts[pName] = {
            state: true,
            value: 1,
            targetValue: 1,
            transitionSpeed: 0.1,
        }
    }
}

export function resetLive2dParameters(node, live2DParameters, t) {
    if (t && Array.isArray(t)) {
        t.forEach((p) => {
            if (
                node &&
                node.internalModel &&
                node.internalModel.coreModel &&
                node.internalModel.coreModel.setParameterValueById
            ) {
                node.internalModel.coreModel.setParameterValueById(
                    p.name,
                    p.defaultValue !== undefined ? p.defaultValue : 0,
                )
            }
        })
    }
}

export function resetLive2dParts(node, live2DParts, t) {
    if (t && Array.isArray(t)) {
        t.forEach((p) => {
            if (
                node &&
                node.internalModel &&
                node.internalModel.coreModel &&
                node.internalModel.coreModel.setPartOpacityById
            ) {
                node.internalModel.coreModel.setPartOpacityById(
                    p.name,
                    p.defaultValue !== undefined ? p.defaultValue : 1,
                )
            }
        })
    }
}

