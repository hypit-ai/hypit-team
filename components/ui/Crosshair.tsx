'use client'

import { useEffect, useRef } from 'react'
import { useHasFinePointer } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * 自定义指针反馈（CREATIVE.md §6「光标」）。
 *
 * 形态：1px crimson **十字准星**（12px 臂长），hover 可交互元素时整体旋转 45° 成 `×`。
 * 45° 是状态指示（「这里可以按」），是准星唯一的动。
 *
 * 铁律：
 * - **原生光标保留可见**（不写 `cursor: none`）——准星是叠加的仪器，不是替代品。
 * - 禁 blob、禁放大遮挡内容；**零跟随插值**——位置每帧直接写指针坐标。
 *   仪器不该有惯性：拖尾会让准星与真实命中点错开，那正是它要否认的事。
 * - 只在 `(pointer: fine)` 且非 reduced-motion 下挂载；触屏与降级用户完全不付出代价。
 * - 位置只写 `style.transform`，**零 React state**、零 layout 读取；空闲时 rAF 自动停机。
 * - `mix-blend-mode: multiply`（light）/ `screen`（dark）——墨印在纸上，不是浮在纸上。
 *
 * 文案：组件内不含任何可翻译文案，也不再打任何标签——外链域名浏览器状态栏已经
 * 在显示，且标签只在 hover 存在，键盘与触屏永远拿不到它。只在鼠标下出现的东西
 * 不可能是信息，那是装饰。
 *
 * 挂载：全站单例，在长滚动页装配层挂一次即可。
 */

const CURSOR_CSS = `
.np-cursor {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 60;
  width: 0;
  height: 0;
  pointer-events: none;
  opacity: 0;
  mix-blend-mode: multiply;
  transition: opacity var(--dur-fast) linear;
}
.np-cursor[data-visible="true"] { opacity: 1; }
.np-cursor__rot {
  position: absolute;
  left: 0;
  top: 0;
  transform: rotate(0deg);
  transition: transform var(--dur-base) var(--ease-out-quart);
}
.np-cursor[data-hot="true"] .np-cursor__rot { transform: rotate(45deg); }
.np-cursor__arm {
  position: absolute;
  background: var(--color-crimson);
}
/* 12px 臂长 → 25px 总长，1px 描边 */
.np-cursor__arm--h {
  left: -12px;
  top: 0;
  width: 25px;
  height: 1px;
}
.np-cursor__arm--v {
  left: 0;
  top: -12px;
  width: 1px;
  height: 25px;
}
@media (prefers-color-scheme: dark) {
  .np-cursor { mix-blend-mode: screen; }
}
:root.dark .np-cursor,
:root[data-theme="dark"] .np-cursor { mix-blend-mode: screen; }
:root.light .np-cursor,
:root[data-theme="light"] .np-cursor { mix-blend-mode: multiply; }
@media (pointer: coarse), (prefers-reduced-motion: reduce) {
  .np-cursor { display: none; }
}
`

/** 可交互目标选择器：与 globals.css 的 :focus-visible 名单同源。 */
const HOT_SELECTOR =
  'a[href],button,[role="button"],input,select,textarea,summary,[tabindex]:not([tabindex="-1"])'

export function Crosshair() {
  const rootRef = useRef<HTMLDivElement>(null)
  const fine = useHasFinePointer()
  const reduced = useReducedMotion()
  const enabled = fine && !reduced

  useEffect(() => {
    const root = rootRef.current
    if (!enabled || !root) return

    // will-change 只在准星真的存在时挂上（组件本身已按 enabled 条件渲染），
    // 不写进 CSS —— 那会让它对所有构建常驻。
    root.style.willChange = 'transform'
    let placed = false

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      // 无插值、无 rAF：指针在哪，准星就在哪。
      root.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      if (!placed) {
        placed = true
        root.dataset.visible = 'true'
      }
    }

    const onOver = (e: PointerEvent) => {
      const target = e.target
      if (!(target instanceof Element)) return
      root.dataset.hot = target.closest(HOT_SELECTOR) ? 'true' : 'false'
    }

    const onLeave = (e: PointerEvent) => {
      if (e.relatedTarget) return
      root.dataset.visible = 'false'
      root.dataset.hot = 'false'
    }

    const onEnter = () => {
      if (placed) root.dataset.visible = 'true'
    }

    const onBlurWindow = () => {
      root.dataset.visible = 'false'
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointerout', onLeave, { passive: true })
    document.addEventListener('pointerenter', onEnter, { passive: true })
    window.addEventListener('blur', onBlurWindow)

    return () => {
      root.style.willChange = ''
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onLeave)
      document.removeEventListener('pointerenter', onEnter)
      window.removeEventListener('blur', onBlurWindow)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <style href="np-cursor" precedence="default">
        {CURSOR_CSS}
      </style>
      <div ref={rootRef} aria-hidden="true" className="np-cursor" data-visible="false" data-hot="false">
        <span className="np-cursor__rot">
          <span className="np-cursor__arm np-cursor__arm--h" />
          <span className="np-cursor__arm np-cursor__arm--v" />
        </span>
      </div>
    </>
  )
}

export default Crosshair
