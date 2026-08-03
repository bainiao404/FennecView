export function extractLive2DAnimations(node) {
    let animations = []
    if (node && node.internalModel?.motionManager?.definitions) {
        const definitions = node.internalModel.motionManager.definitions
        for (let group in definitions) {
            definitions[group].forEach((motion, index) => {
                const name = group ? `${group}_${index}` : motion.File
                let duration = 0
                const motionGroup = node.internalModel.motionManager.motionGroups[group]?.[index]
                if (motionGroup) {
                    if (typeof motionGroup.getDuration === 'function') {
                        duration = motionGroup.getDuration()
                    } else if (motionGroup.duration !== undefined) {
                        duration = motionGroup.duration
                    }
                    if (duration > 30) {
                        duration = duration / 1000
                    }
                }
                animations.push({
                    name: name,
                    duration: duration || motion.FadeInTime || 0,
                    groupName: group,
                    index: index,
                })
            })
        }
    }
    return animations
}

export function extractLive2DSkins(node) {
    let skins = []
    if (node && node.internalModel?.motionManager?.expressionManager?.definitions) {
        const definitions = node.internalModel.motionManager.expressionManager.definitions
        definitions.forEach((expr, index) => {
            skins.push({
                name: expr.Name || expr.File || `Expr_${index}`,
                index: index,
            })
        })
    }
    return skins
}

export function extractLive2DParameters(node, live2DParameters) {
    let live2dParameters = []
    if (node && node.internalModel && node.internalModel.coreModel) {
        let coreModel = node.internalModel.coreModel
        let params = coreModel._model?.parameters
        if (params && params.ids && params.values) {
            let ids = params.ids
            let maxs = params.maximumValues
            let mins = params.minimumValues
            let values = params.values
            let defaultVals = params.defaultValues || values
            for (let i = 0; i < ids.length; i++) {
                let id = ids[i]
                let currentOverride = live2DParameters[id]
                    ? live2DParameters[id].targetValue
                    : values[i]
                let isStateForced = live2DParameters[id] ? live2DParameters[id].state : false
                live2dParameters.push({
                    name: id,
                    min: mins[i],
                    max: maxs[i],
                    value: currentOverride,
                    defaultValue: defaultVals[i],
                    state: isStateForced,
                })
            }
        }
        else if (
            coreModel._parameterIds &&
            coreModel._parameterMaximumValues &&
            coreModel._parameterMinimumValues &&
            coreModel._parameterValues
        ) {
            let ids = coreModel._parameterIds
            let maxs = coreModel._parameterMaximumValues
            let mins = coreModel._parameterMinimumValues
            let values = coreModel._parameterValues
            let defaultVals = coreModel._parameterDefaultValues || values
            for (let i = 0; i < ids.length; i++) {
                let currentOverride = live2DParameters[ids[i]]
                    ? live2DParameters[ids[i]].targetValue
                    : values[i]
                let isStateForced = live2DParameters[ids[i]] ? live2DParameters[ids[i]].state : false
                live2dParameters.push({
                    name: ids[i],
                    min: mins[i],
                    max: maxs[i],
                    value: currentOverride,
                    defaultValue: defaultVals[i],
                    state: isStateForced,
                })
            }
        }
        else if (typeof coreModel.getParameterIds === 'function') {
            try {
                let ids = coreModel.getParameterIds()
                for (let i = 0; i < ids.length; i++) {
                    let id = ids[i]
                    let val = coreModel.getParameterValueById ? coreModel.getParameterValueById(id) : 0
                    let max = 30
                    let min = -30
                    let currentOverride = live2DParameters[id] ? live2DParameters[id].targetValue : val
                    let isStateForced = live2DParameters[id] ? live2DParameters[id].state : false
                    live2dParameters.push({
                        name: id,
                        min: min,
                        max: max,
                        value: currentOverride,
                        defaultValue: 0,
                        state: isStateForced,
                    })
                }
            } catch (e) {}
        }
    }
    return live2dParameters
}

export function extractLive2DParts(node, live2DParts) {
    let live2dParts = []
    if (node && node.internalModel && node.internalModel.coreModel) {
        let coreModel = node.internalModel.coreModel
        let parts = coreModel._model?.parts
        if (parts && parts.ids && parts.opacities) {
            let ids = parts.ids
            let opacities = parts.opacities
            for (let i = 0; i < ids.length; i++) {
                let id = ids[i]
                let currentOverride = live2DParts[id] ? live2DParts[id].targetValue : opacities[i]
                let isStateForced = live2DParts[id] ? live2DParts[id].state : false
                live2dParts.push({
                    name: id,
                    opacity: currentOverride,
                    state: isStateForced,
                })
            }
        }
        else if (coreModel._partIds && coreModel._partOpacities) {
            let ids = coreModel._partIds
            let opacities = coreModel._partOpacities
            for (let i = 0; i < ids.length; i++) {
                let currentOverride = live2DParts[ids[i]]
                    ? live2DParts[ids[i]].targetValue
                    : opacities[i]
                let isStateForced = live2DParts[ids[i]] ? live2DParts[ids[i]].state : false
                live2dParts.push({
                    name: ids[i],
                    opacity: currentOverride,
                    state: isStateForced,
                })
            }
        } else if (typeof coreModel.getPartIds === 'function') {
            try {
                let ids = coreModel.getPartIds()
                for (let i = 0; i < ids.length; i++) {
                    let id = ids[i]
                    let val = coreModel.getPartOpacityById ? coreModel.getPartOpacityById(id) : 1
                    let currentOverride = live2DParts[id] ? live2DParts[id].targetValue : val
                    let isStateForced = live2DParts[id] ? live2DParts[id].state : false
                    live2dParts.push({
                        name: id,
                        opacity: currentOverride,
                        state: isStateForced,
                    })
                }
            } catch (e) {}
        }
    }
    return live2dParts
}

export function syncLive2DParametersAndParts(node, parametersList, partsList) {
    if (!node || !node.internalModel?.coreModel) return
    const coreModel = node.internalModel.coreModel
    
    // Sync parameters
    const params = coreModel._model?.parameters
    if (params && params.ids && params.values) {
        const ids = params.ids
        const values = params.values
        parametersList.forEach(p => {
            if (!p.state) {
                const idx = ids.indexOf(p.name)
                if (idx !== -1 && p.value !== values[idx]) {
                    p.value = values[idx]
                }
            }
        })
    } else {
        const values = coreModel._parameterValues
        const ids = coreModel._parameterIds
        if (values && ids && typeof ids.indexOf === 'function') {
            parametersList.forEach(p => {
                if (!p.state) {
                    const idx = ids.indexOf(p.name)
                    if (idx !== -1 && p.value !== values[idx]) {
                        p.value = values[idx]
                    }
                }
            })
        } else if (coreModel.getParameterValueById) {
            parametersList.forEach(p => {
                if (!p.state) {
                    let val = coreModel.getParameterValueById(p.name)
                    if (p.value !== val) p.value = val
                }
            })
        }
    }

    // Sync parts
    const parts = coreModel._model?.parts
    if (parts && parts.ids && parts.opacities) {
        const partIds = parts.ids
        const partOpacities = parts.opacities
        partsList.forEach(p => {
            if (!p.state) {
                const idx = partIds.indexOf(p.name)
                if (idx !== -1 && p.opacity !== partOpacities[idx]) {
                    p.opacity = partOpacities[idx]
                }
            }
        })
    } else {
        const partOpacities = coreModel._partOpacities
        const partIds = coreModel._partIds
        if (partOpacities && partIds && typeof partIds.indexOf === 'function') {
            partsList.forEach(p => {
                if (!p.state) {
                    const idx = partIds.indexOf(p.name)
                    if (idx !== -1 && p.opacity !== partOpacities[idx]) {
                        p.opacity = partOpacities[idx]
                    }
                }
            })
        } else if (coreModel.getPartOpacityById) {
            partsList.forEach(p => {
                if (!p.state) {
                    let val = coreModel.getPartOpacityById(p.name)
                    if (p.opacity !== val) p.opacity = val
                }
            })
        }
    }
}

