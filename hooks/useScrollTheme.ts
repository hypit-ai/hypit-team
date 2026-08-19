'use client'

/**
 * M3 · 滚动色温 —— **已按 BRAND.md §6 第 5 条停用**。
 *
 * 原方案（蓝图 §9.1 M3）在深色站上用滚动进度连续插值 `--color-bg-0`，
 * 制造「越往下越热」的暗示。官方品牌改为 paper-and-crimson 的纸色底后，
 * 纸的中性度本身就是识别点：让纸随滚动漂移会立刻显脏，且与 np-grain
 * 的 multiply 混合叠加后会出现肉眼可见的色偏。
 *
 * 因此本 hook 保留为**空实现**：签名、导出名与调用点全部不变
 * （`<SmoothScroll>` 仍会调用它），但不再写任何 CSS 变量，
 * 底色完全由 globals.css 的主题 token 决定。
 * 若将来要恢复，请在这里重新实现，不要在 section 里各写一份。
 */

/**
 * 空实现。参数保留只为兼容既有调用点。
 * @param _enabled 忽略。
 */
export function useScrollTheme(_enabled = true): void {
  void _enabled
}

export default useScrollTheme
