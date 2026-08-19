'use client'

/**
 * 跨 section 连续变换的编排器（CREATIVE §M6 · 招牌 #2「尺断」）。
 *
 * 要解决的问题很具体：S5 的刻度尺散架之后，S6 要**接着**那个已经散架的状态继续演，
 * 而不是重画一把新尺子。两段各自播完 = 两个动画；同一条时间轴被两段滚动
 * **接力驱动** = 一件事的两个阶段。观众能看出区别，这就是连续性的来源。
 *
 * 做法：
 * - 只有**一条** `gsap.timeline({ paused: true })`，DOM 节点也只有一批（挂在第一段里）。
 * - N 个 ScrollTrigger 各自负责把 timeline 推进到 `[from, to]` 的一段区间，
 *   `onUpdate` 里 `tl.progress(from + (to - from) * self.progress)`。
 * - `onLeave` / `onLeaveBack` 把 timeline **钳位**到区间端点：
 *   快速滚动跳过某段时不会留下半截状态，往回滚也能精确回到上一段的交界。
 * - 段之间可以有空隙（S5 结束到 S6 开始之间的留白），空隙里 timeline 停在
 *   上一段的 `to`，视觉上就是「尺子保持散架的样子等着」。
 *
 * reduced-motion：不建任何 trigger，timeline 直接 `progress(1)`——
 * 尺子以「已散架」的终态静态呈现（§M6 降级条款）。
 *
 *   const scope = useRef<HTMLElement>(null)
 *   useContinuousScene(scope, ({ tl, q }) => { tl.to(q('[data-tick]'), {...}) }, {
 *     segments: [
 *       { trigger: '#hook',      start: 'top 60%', end: 'bottom top', from: 0,    to: 0.85 },
 *       { trigger: '#recompile', start: 'top 85%', end: 'top 40%',    from: 0.85, to: 1 },
 *     ],
 *     channel: SCROLL_CHANNEL.ruler,
 *   })
 */

import type { RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from './gsap'
import { setScrollChannel, type ScrollChannel } from './scrollBus'
import { EASE_GSAP, SCRUB } from '@/lib/motion/tokens'

export type ContinuousScope = RefObject<HTMLElement | null>

export interface ContinuousSceneCtx {
  gsap: typeof gsap
  ScrollTrigger: typeof ScrollTrigger
  root: HTMLElement
  /** 唯一的主时间轴（paused）。全部动画加到它上面。 */
  tl: gsap.core.Timeline
  desktop: boolean
  reduced: boolean
  q: <T extends Element = HTMLElement>(selector: string) => T[]
  one: <T extends Element = HTMLElement>(selector: string) => T | null
}

export type ContinuousSceneBuilder = (ctx: ContinuousSceneCtx) => void

export interface ContinuousSegment {
  /**
   * 该段的触发元素。字符串会先在 scope 内查，查不到再退到 `document`
   * ——跨 section 时目标常常在 scope 之外。
   */
  trigger: string | Element | RefObject<Element | null>
  start?: ScrollTrigger.Vars['start']
  end?: ScrollTrigger.Vars['end']
  /** 该段负责推进的 timeline 区间起点 0..1。 */
  from: number
  /** 该段负责推进的 timeline 区间终点 0..1。 */
  to: number
  scrub?: number | boolean
  /** 该段只在桌面生效（例如需要 sticky 的那段）。 */
  desktopOnly?: boolean
}

export interface ContinuousSceneOptions {
  segments: ContinuousSegment[]
  /** 把 timeline 总进度广播到通道。 */
  channel?: ScrollChannel
  onProgress?: (progress: number) => void
  deps?: unknown[]
  enabled?: boolean
}

const MQ_DESKTOP = '(min-width: 64rem)'
const MQ_REDUCED = '(prefers-reduced-motion: reduce)'

function resolveTrigger(
  root: HTMLElement,
  target: ContinuousSegment['trigger'],
): Element | null {
  if (typeof target === 'string') {
    return root.querySelector(target) ?? document.querySelector(target)
  }
  if (target instanceof Element) return target
  return (target as RefObject<Element | null>).current
}

export function useContinuousScene(
  scope: ContinuousScope,
  build: ContinuousSceneBuilder,
  options: ContinuousSceneOptions,
): void {
  useGSAP(
    () => {
      const root = scope.current
      const o = options
      if (!root || o.enabled === false || o.segments.length === 0) return

      const mm = gsap.matchMedia()

      mm.add({ desktop: MQ_DESKTOP, reduced: MQ_REDUCED }, (ctx) => {
        const conditions = (ctx.conditions ?? {}) as { desktop?: boolean; reduced?: boolean }
        const reduced = Boolean(conditions.reduced)
        const desktop = Boolean(conditions.desktop)

        const q = <T extends Element = HTMLElement>(selector: string): T[] =>
          Array.from(root.querySelectorAll<Element>(selector)) as unknown as T[]
        const one = <T extends Element = HTMLElement>(selector: string) =>
          root.querySelector(selector) as T | null

        const tl = gsap.timeline({ paused: true, defaults: { ease: EASE_GSAP.scrub } })
        build({ gsap, ScrollTrigger, root, tl, desktop, reduced, q, one })

        const emit = (p: number) => {
          const clamped = p < 0 ? 0 : p > 1 ? 1 : p
          tl.progress(clamped)
          if (o.channel) setScrollChannel(o.channel, clamped)
          o.onProgress?.(clamped)
        }

        /* reduced-motion：一次性落到终态，不建 trigger、不锁滚动。 */
        if (reduced) {
          emit(1)
          return () => {
            tl.kill()
          }
        }

        emit(o.segments[0].from)

        const triggers: ScrollTrigger[] = []
        for (const seg of o.segments) {
          if (seg.desktopOnly && !desktop) continue
          const el = resolveTrigger(root, seg.trigger)
          if (!el) continue

          const span = seg.to - seg.from
          triggers.push(
            ScrollTrigger.create({
              trigger: el,
              start: seg.start ?? 'top 70%',
              end: seg.end ?? 'bottom top',
              scrub: seg.scrub ?? SCRUB.tight,
              invalidateOnRefresh: true,
              onUpdate: (self) => emit(seg.from + span * self.progress),
              // 钳位：快速滚过 / 回滚时不留半截状态。
              onLeave: () => emit(seg.to),
              onLeaveBack: () => emit(seg.from),
            }),
          )
        }

        return () => {
          for (const t of triggers) t.kill()
          tl.kill()
        }
      })

      return () => {
        mm.revert()
      }
    },
    { scope, dependencies: options.deps ?? [], revertOnUpdate: true },
  )
}

export default useContinuousScene
