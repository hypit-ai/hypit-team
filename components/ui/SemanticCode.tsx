'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * 代码块的语义高亮交互（CREATIVE.md §6「代码 token hover」，产品内核的可视化）。
 *
 * 把 `<CodeBlock>` 包一层就得到官方那套语义体系（BRAND.md §4，类名全部复用 globals.css）：
 *
 *   `.semantic-token`        —— 语义词本体：hover / focus 时 crimson-soft 底 + 1px crimson 环
 *   `.semantic-active`       —— 同一语义的**所有** token 同时点亮（这是「一个词就是一个锚点」的证据）
 *   `.semantic-range-canvas` —— `@hook … @/hook` 覆盖的行区间被一条 crimson 墨线框住
 *   `.playhead`              —— 区间首行左侧打出 2×15px 播放头
 *
 * 为什么值得做：`.svml` 的卖点是「词锚定时间」。观众把指针放到 `@problem` 上，
 * 看见同名的开合标记一起亮、中间那几行被当场框起来——这比任何文案都直接。
 *
 * 实现约束：
 * - 交互层**只读 DOM、只写 class 与一个 SVG 覆盖层**，不改 CodeBlock 的渲染契约，
 *   服务端产出的 HTML 一字不变（`data-sem` 由 CodeToken 静态输出，无 JS 时完全惰性）。
 * - 度量只用 `offsetTop / offsetHeight`（不触发 layout 读取风暴），且**只在激活与 resize 时**发生，
 *   绝不进滚动热路径。覆盖层挂在 `<pre>` 内部，横向 / 纵向滚动时自动跟随内容。
 * - `(pointer: coarse)` 不挂 hover（代码 token 命中区远小于 44px，触屏靠点击/键盘）。
 * - 键盘同级：可开区间的标记拿到 `tabIndex=0` + `role=button`，Enter/Space 钉住，Esc 取消。
 * - 文案零硬编码：`aria-label` 用 token 自身的源码文本（`@problem`），那是代码不是文案。
 */

const SEMANTIC_CSS = `
.np-semcode { position: relative; }
.np-semcode .semantic-token { cursor: pointer; }
.np-semcode__canvas {
  position: absolute;
  left: 0;
  top: 0;
  overflow: visible;
  pointer-events: none;
  opacity: 0;
  transition: opacity 120ms linear;
}
.np-semcode__canvas[data-on="true"] { opacity: 1; }
.np-semcode__playhead {
  position: absolute;
  left: 3px;
  top: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 120ms linear;
}
.np-semcode__playhead[data-on="true"] { opacity: 1; }
`

export interface SemanticCodeProps {
  /** 一个 `<CodeBlock>`（或任何含 `[data-sem]` token 的代码渲染）。 */
  children: ReactNode
  /** 与 CodeBlock 的 `lineAttr` 保持一致，默认 `data-code-line`。 */
  lineAttr?: string
  /** 激活的语义键变化时回调（如联动 HUD 读数 / S6 的重编译区间）。 */
  onActiveChange?: (key: string | null) => void
  className?: string
}

export function SemanticCode({
  children,
  lineAttr = 'data-code-line',
  onActiveChange,
  className,
}: SemanticCodeProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  // 回调存进 ref：交互层的监听器只装一次，不因父组件重渲染而重建（重建会丢掉激活态）
  const changeRef = useRef(onActiveChange)
  useEffect(() => {
    changeRef.current = onActiveChange
  }, [onActiveChange])

  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof window === 'undefined') return

    const pre = root.querySelector('pre')
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-sem]'))
    if (!pre || nodes.length === 0) return

    const fine = window.matchMedia?.('(pointer: fine)').matches ?? false

    /* ── 分组：同一 data-sem 的 token 属于同一语义 ─────────────── */
    const groups = new Map<string, HTMLElement[]>()
    for (const node of nodes) {
      node.classList.add('semantic-token')
      const key = node.dataset.sem
      if (!key) continue
      const bucket = groups.get(key)
      if (bucket) bucket.push(node)
      else groups.set(key, [node])
    }

    // 有开有合的分组才是「区间」，只有它的开标记进 tab 序列（避免刷屏式焦点）
    const openers = new Map<string, HTMLElement>()
    for (const [key, members] of groups) {
      const open = members.find((m) => m.dataset.semRole === 'open')
      const close = members.find((m) => m.dataset.semRole === 'close')
      if (!open || !close) continue
      openers.set(key, open)
      open.tabIndex = 0
      open.setAttribute('role', 'button')
      open.setAttribute('aria-label', open.textContent ?? key)
      open.setAttribute('aria-pressed', 'false')
    }

    /* ── 覆盖层：区间框 + 播放头，挂在 <pre> 内随内容滚动 ───────── */
    const prevPosition = pre.style.position
    if (getComputedStyle(pre).position === 'static') pre.style.position = 'relative'

    const canvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    canvas.setAttribute('class', 'semantic-range-canvas np-semcode__canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.dataset.on = 'false'
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    canvas.appendChild(path)

    const playhead = document.createElement('span')
    playhead.className = 'playhead np-semcode__playhead'
    playhead.setAttribute('aria-hidden', 'true')
    playhead.dataset.on = 'false'

    pre.appendChild(canvas)
    pre.appendChild(playhead)

    /* ── 激活 / 取消 ───────────────────────────────────────────── */
    let active: string | null = null
    let pinned = false

    const lineOf = (el: HTMLElement): HTMLElement | null =>
      el.closest<HTMLElement>(`[${lineAttr}]`)

    const paint = (key: string) => {
      const members = groups.get(key)
      if (!members || members.length === 0) return
      const lines = members
        .map(lineOf)
        .filter((l): l is HTMLElement => l !== null)
      if (lines.length === 0) return

      const top = Math.min(...lines.map((l) => l.offsetTop))
      const bottom = Math.max(...lines.map((l) => l.offsetTop + l.offsetHeight))
      const width = Math.max(pre.clientWidth, pre.scrollWidth) - 4
      const height = bottom - top

      canvas.setAttribute('width', String(width))
      canvas.setAttribute('height', String(height))
      canvas.setAttribute('viewBox', `0 0 ${width} ${height}`)
      canvas.style.transform = `translate3d(2px, ${top}px, 0)`
      // 直角矩形，零圆角（BRAND.md §3）；1px 内缩留出描边空间
      path.setAttribute(
        'd',
        `M 1 1 H ${width - 1} V ${height - 1} H 1 Z`,
      )
      canvas.dataset.on = 'true'

      const first = lines.reduce((a, b) => (a.offsetTop <= b.offsetTop ? a : b))
      playhead.style.transform = `translate3d(0, ${
        first.offsetTop + Math.max(0, (first.offsetHeight - 15) / 2)
      }px, 0)`
      playhead.dataset.on = 'true'
    }

    const clearPaint = () => {
      canvas.dataset.on = 'false'
      playhead.dataset.on = 'false'
    }

    const activate = (key: string | null) => {
      if (key === active) return
      if (active) {
        for (const m of groups.get(active) ?? []) m.classList.remove('semantic-active')
        openers.get(active)?.setAttribute('aria-pressed', 'false')
      }
      active = key
      if (key) {
        for (const m of groups.get(key) ?? []) m.classList.add('semantic-active')
        openers.get(key)?.setAttribute('aria-pressed', String(pinned))
        if (openers.has(key)) paint(key)
        else clearPaint()
      } else {
        clearPaint()
      }
      changeRef.current?.(key)
    }

    const keyFromEvent = (target: EventTarget | null): string | null => {
      if (!(target instanceof Element)) return null
      const el = target.closest<HTMLElement>('[data-sem]')
      return el?.dataset.sem ?? null
    }

    const onOver = (e: PointerEvent) => {
      if (pinned) return
      activate(keyFromEvent(e.target))
    }
    const onLeave = () => {
      if (!pinned) activate(null)
    }
    const onFocusIn = (e: FocusEvent) => {
      const key = keyFromEvent(e.target)
      if (key) activate(key)
    }
    const onClick = (e: MouseEvent) => {
      const key = keyFromEvent(e.target)
      if (!key) return
      if (pinned && key === active) {
        pinned = false
        activate(null)
        return
      }
      pinned = true
      activate(key)
      openers.get(key)?.setAttribute('aria-pressed', 'true')
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        pinned = false
        activate(null)
        return
      }
      if (e.key !== 'Enter' && e.key !== ' ') return
      const key = keyFromEvent(e.target)
      if (!key) return
      e.preventDefault()
      pinned = !(pinned && key === active)
      activate(pinned ? key : null)
      if (pinned) openers.get(key)?.setAttribute('aria-pressed', 'true')
    }

    if (fine) {
      root.addEventListener('pointerover', onOver, { passive: true })
      root.addEventListener('pointerleave', onLeave, { passive: true })
    }
    root.addEventListener('focusin', onFocusIn)
    root.addEventListener('click', onClick)
    root.addEventListener('keydown', onKeyDown)

    // 尺寸变化时重算（debounce 150ms），且只在有激活项时才量
    let resizeTimer: ReturnType<typeof setTimeout> | undefined
    const onResize = () => {
      if (!active || !openers.has(active)) return
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (active) paint(active)
      }, 150)
    }
    window.addEventListener('resize', onResize)

    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      root.removeEventListener('pointerover', onOver)
      root.removeEventListener('pointerleave', onLeave)
      root.removeEventListener('focusin', onFocusIn)
      root.removeEventListener('click', onClick)
      root.removeEventListener('keydown', onKeyDown)
      for (const node of nodes) {
        node.classList.remove('semantic-token', 'semantic-active')
        if (node.getAttribute('role') === 'button') {
          node.removeAttribute('role')
          node.removeAttribute('aria-label')
          node.removeAttribute('aria-pressed')
          node.removeAttribute('tabindex')
        }
      }
      canvas.remove()
      playhead.remove()
      pre.style.position = prevPosition
    }
  }, [lineAttr])

  return (
    <div ref={rootRef} className={cn('np-semcode', className)}>
      <style href="np-semcode" precedence="default">
        {SEMANTIC_CSS}
      </style>
      {children}
    </div>
  )
}

export default SemanticCode
