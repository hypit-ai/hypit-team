'use client'

/**
 * section pin + scrub 长镜头的统一封装（CREATIVE §M4 S3 / §M9 S12）。
 *
 * 全站 pin 只有两处，但两处都很贵，所以规矩写在这里、不散落在 section 里：
 *
 * - **pin 只在桌面生效。** 移动端默认降级为「不 pin，仍然 scrub」——
 *   锁滚动在移动端会和地址栏收缩、系统回弹打架（§M4 移动端条款）。
 * - `anticipatePin: 1` + `invalidateOnRefresh: true` 默认开启，
 *   避免 pin 起始处的一帧跳动。
 * - `end` 允许写成函数，`invalidateOnRefresh` 会在每次 refresh 时重算
 *   （S12 的 `'+=' + (track.scrollWidth - innerWidth)` 必须这么写）。
 * - **reduced-motion 完全不建 trigger**：直接把 timeline 推到 `progress(1)`，
 *   也就是「终态即可读态」。页面不会锁滚动、不会有任何长镜头。
 * - timeline 的进度顺带广播到 `scrollBus` 的命名通道（可选），
 *   让 HUD / 齿孔栏不必自己再建 trigger。
 *
 *   const root = useRef<HTMLElement>(null)
 *   usePinnedScene(root, ({ tl, q }) => {
 *     tl.to(q('[data-dot]'), { '--p': 1 }, 0)
 *   }, { end: '+=200%', channel: SCROLL_CHANNEL.impression })
 */

import type { RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from './gsap'
import { setScrollChannel, type ScrollChannel } from './scrollBus'
import { EASE_GSAP, SCRUB } from '@/lib/motion/tokens'

export type SceneScope = RefObject<HTMLElement | null>

export interface PinnedSceneCtx {
  gsap: typeof gsap
  ScrollTrigger: typeof ScrollTrigger
  /** section 根元素。 */
  root: HTMLElement
  /** 场景主时间轴。**所有动画都加到它上面**，位置参数从 0 开始。 */
  tl: gsap.core.Timeline
  /** 当前是否桌面（≥64rem）。pin 只在 true 时真正生效。 */
  desktop: boolean
  /** 当前分支是否处在 reduced-motion（此时 `tl` 无 trigger，会被直接推到终态）。 */
  reduced: boolean
  q: <T extends Element = HTMLElement>(selector: string) => T[]
  one: <T extends Element = HTMLElement>(selector: string) => T | null
}

export type PinnedSceneBuilder = (ctx: PinnedSceneCtx) => void

export interface PinnedSceneOptions {
  start?: ScrollTrigger.Vars['start']
  /** 行程长度。默认 `'+=200%'`。可以是函数（每次 refresh 重算）。 */
  end?: ScrollTrigger.Vars['end']
  scrub?: number | boolean
  /** 是否 pin。默认 true（且只在桌面生效）。 */
  pin?: boolean
  /** 移动端也 pin。默认 false —— 别开，除非你知道自己在做什么。 */
  pinOnMobile?: boolean
  /** 指定被 pin 的元素（默认 scope 根）。 */
  pinTarget?: string
  /** 把 timeline 进度广播到这个通道。 */
  channel?: ScrollChannel
  /** 每次 scrub 更新的回调（直写 uniform / DOM，禁止 setState）。 */
  onProgress?: (progress: number) => void
  /** 依赖变化时整段 revert 重建。 */
  deps?: unknown[]
  enabled?: boolean
}

const MQ_DESKTOP = '(min-width: 64rem)'
const MQ_REDUCED = '(prefers-reduced-motion: reduce)'

export function usePinnedScene(
  scope: SceneScope,
  build: PinnedSceneBuilder,
  options: PinnedSceneOptions = {},
): void {
  useGSAP(
    () => {
      const root = scope.current
      const o = options
      if (!root || o.enabled === false) return

      const mm = gsap.matchMedia()

      mm.add({ desktop: MQ_DESKTOP, reduced: MQ_REDUCED }, (ctx) => {
        const conditions = (ctx.conditions ?? {}) as { desktop?: boolean; reduced?: boolean }
        const reduced = Boolean(conditions.reduced)
        const desktop = Boolean(conditions.desktop)

        const q = <T extends Element = HTMLElement>(selector: string): T[] =>
          Array.from(root.querySelectorAll<Element>(selector)) as unknown as T[]
        const one = <T extends Element = HTMLElement>(selector: string) =>
          root.querySelector(selector) as T | null

        const emit = (p: number) => {
          if (o.channel) setScrollChannel(o.channel, p)
          o.onProgress?.(p)
        }

        /* ── reduced-motion：无 trigger、无 pin，终态即可读态 ── */
        if (reduced) {
          const tl = gsap.timeline({ paused: true, defaults: { ease: EASE_GSAP.scrub } })
          build({ gsap, ScrollTrigger, root, tl, desktop, reduced, q, one })
          tl.progress(1).pause()
          emit(1)
          return () => {
            tl.kill()
          }
        }

        const pin = (o.pin ?? true) && (desktop || Boolean(o.pinOnMobile))
        const pinTarget = o.pinTarget ? one(o.pinTarget) : null

        const tl = gsap.timeline({
          defaults: { ease: EASE_GSAP.scrub },
          scrollTrigger: {
            trigger: root,
            start: o.start ?? 'top top',
            end: o.end ?? '+=200%',
            scrub: o.scrub ?? SCRUB.base,
            pin: pin ? (pinTarget ?? root) : false,
            pinSpacing: pin,
            anticipatePin: pin ? 1 : 0,
            invalidateOnRefresh: true,
            onUpdate: (self) => emit(self.progress),
            onToggle: (self) => {
              root.style.willChange = self.isActive ? 'transform' : ''
            },
          },
        })

        build({ gsap, ScrollTrigger, root, tl, desktop, reduced, q, one })

        return () => {
          root.style.willChange = ''
          tl.scrollTrigger?.kill()
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

export default usePinnedScene
