/**
 * 基础工具函数 - 从 baseScript.js 迁移
 */

/**
 * 将HEX颜色码+透明度转换为RGBA字符串
 * @param {string} hex - 支持3/4/6/8位HEX（如#F00、#FF0000、#FF0000FF）
 * @param {number} [alpha=1] - 透明度（0~1）
 * @returns {string} RGBA格式字符串
 */
export function hexToRgba(hex, alpha = 1) {
    let hexClean = hex.replace(/^#/, '')
    if ([3, 4].includes(hexClean.length)) {
        hexClean = hexClean
            .split('')
            .map((c) => c.repeat(2))
            .join('')
    }
    const r = parseInt(hexClean.slice(0, 2), 16)
    const g = parseInt(hexClean.slice(2, 4), 16)
    const b = parseInt(hexClean.slice(4, 6), 16)
    const clampedAlpha = Math.min(1, Math.max(0, alpha))
    return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`
}

/**
 * 将字符串转换为首字母大写格式（Title Case）
 */
export function toTitleCase(str) {
    return str.replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * 将数值向下取整到最近的偶数
 */
export function floorToEven(num) {
    const floored = Math.floor(num)
    return floored % 2 === 0 ? floored : floored - 1
}

// 挂载到 window 供原有脚本使用
if (typeof window !== 'undefined') {
    window.hexToRgba = hexToRgba
    window.toTitleCase = toTitleCase
    window.floorToEven = floorToEven
}
