'use client'

/**
 * CanvasHost —— 旧「全屏固定编译带」宿主的**遗骸**，现在只做两件事：
 *   1. 永久关掉全屏 fixed WebGL 层（`LEGACY_FULLSCREEN_WEBGL = false`，不可再打开）；
 *   2. 兼容挂载：若页面里存在 `[data-impression-slot]`，把新的 `<ImpressionCanvas>`
 *      portal 进那个格子，让还没直接引用新组件的 S3 也能拿到 WebGL。
 *
 * 页面级（app/page.tsx）保留 `<CanvasHost sourceLines={…} />` 不会渲染任何全屏层。
 *
 * ── 新方案（THE IMPRESSION）如何规避三条历史缺陷 ──────────────────
 *
 * 缺陷 1「灰色模糊带糊住 SEC/16 团队卡片」
 *   根因：全屏 fixed 层 + 全局 uv 采样，任何 section 都可能被它覆盖，
 *         且 shader 输出了接近纸色的**不透明底**。
 *   新方案：canvas 是 `position:absolute; inset:0`，DOM 上被关在 S3 的格子里，
 *         结构上不可能出现在 S16；片元只画墨点，`a < 0.004` 直接 `discard`，
 *         永远不输出实底——纸的地方就是纸本身。
 *
 * 缺陷 2「视口左侧一块 180×260 的直角深块（uTargetRect 把带子压成矩形）」
 *   根因：用 NDC 矩形把 3D 几何往 DOM 上凑，一旦相机/尺寸失配就塌成色块。
 *   新方案：顶点着色器**不乘任何矩阵**（全屏四边形 `gl_Position = vec4(pos.xy,0,1)`），
 *         几何天然等于 canvas 的 rect，`uTargetRect` 这条路径整个删除，
 *         没有任何 DOM→NDC 换算，也就没有它算错的可能。
 *
 * 缺陷 3「Hero 上一片橙黄马赛克压住正文与 CTA」
 *   根因：Hero 挂了 WebGL，且 shader 里存在非主题来源的颜色路径。
 *   新方案：Hero 完全不挂 WebGL（CREATIVE M2）；shader 里只有 `uInk` 与
 *         `uCrimson` 两个颜色 uniform，两者都从 CSS 变量读取、随主题更新，
 *         GLSL 内零硬编码 RGB——**橙黄这种颜色在管线里不存在**。
 *   另加：`mix-blend-mode: multiply/screen` + `uOpacity ≤ .88` + `uDotScale < 1`，
 *         最密处仍留白，压不住任何正文；宿主全程 `pointer-events:none`、z-0。
 */

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ImpressionCanvas } from './ImpressionCanvas'

/**
 * 全屏固定 WebGL 层总开关 —— **永久 false**（CREATIVE §5.0-1、§7.2）。
 * 三轮验收三种事故都源自这个用法本身，不是某个 shader bug。
 */
const LEGACY_FULLSCREEN_WEBGL = false

/** 新方案总开关：THE IMPRESSION（S3 局部 canvas）。 */
export const IMPRESSION_ENABLED = true

/** S3 若提供这个空槽，就由本组件把 WebGL portal 进去。 */
export const IMPRESSION_SLOT_SELECTOR = '[data-impression-slot]'

export interface CanvasHostProps {
  /** 画进字形图集的真实源码行（来自 lib/data/code-samples）。 */
  sourceLines?: readonly string[]
  className?: string
}

export function CanvasHost({ sourceLines, className }: CanvasHostProps) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)

  // S3 可能晚于本组件挂载（client component 边界），用一次 MutationObserver 等它。
  useEffect(() => {
    if (!IMPRESSION_ENABLED || typeof document === 'undefined') return
    const find = () => document.querySelector<HTMLElement>(IMPRESSION_SLOT_SELECTOR)

    const mo = new MutationObserver(() => check())
    const check = () => {
      const el = find()
      if (!el) return
      mo.disconnect()
      setSlot(el)
    }

    mo.observe(document.body, { childList: true, subtree: true })
    // 首次检查也异步化：effect body 内同步 setState 会引发级联渲染
    queueMicrotask(check)
    return () => mo.disconnect()
  }, [])

  if (LEGACY_FULLSCREEN_WEBGL || !IMPRESSION_ENABLED || !slot) return null

  return createPortal(
    <ImpressionCanvas sourceLines={sourceLines} className={className} />,
    slot,
  )
}

export default CanvasHost
