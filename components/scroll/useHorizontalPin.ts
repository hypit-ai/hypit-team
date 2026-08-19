'use client'

/**
 * 横向 pin 长镜头（CREATIVE §M9 · 招牌 #3「吞噬」）。
 *
 * 全站唯一的横向运动，因此规矩也只写这一份：
 *
 * - 行程长度由 `track.scrollWidth - innerWidth` 决定，写成**函数式 `end`**，
 *   配合 `invalidateOnRefresh` 在字体加载完 / 窗口变化后自动重算。
 *   写成常量的横向 pin 一定会在中文字体落地后错位。
 * - `containerAnimation` 通过 builder 交给调用方：列级子 trigger 必须挂它，
 *   否则「列左缘触到视口左缘」这个判定在横向坐标系里根本不成立。
 * - **移动端放弃 pin**：hook 不建 trigger，只在根元素写 `data-hscroll="native"`，
 *   由 CSS 接管 `overflow-x: auto; scroll-snap-type: x mandatory`。
 *   横向 pin 在触屏上会和系统的横向手势抢事件，必然卡。
 * - **reduced-motion**：`data-hscroll="static"`，同样不建 trigger，
 *   由 CSS 改成纵向堆叠。JS 一行不跑页面也完整可读。
 *
 *   const root = useRef<HTMLElement>(null)
 *   useHorizontalPin(root, ({ containerAnimation, columns, ScrollTrigger }) => {
 *     columns.forEach((col) => ScrollTrigger.create({ trigger: col, containerAnimation, ... }))
 *   }, { track: '[data-track]', columns: '[data-column]' })
 */

import type { RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from './gsap'
import { setScrollChannel, type ScrollChannel } from './scrollBus'
import { EASE_GSAP, SCRUB } from '@/lib/motion/tokens'

export type HorizontalScope = RefObject<HTMLElement | null>

export interface HorizontalPinCtx {
  gsap: typeof gsap
  ScrollTrigger: typeof ScrollTrigger
  root: HTMLElement
  track: HTMLElement
  /** 横向位移的补间。列级子 trigger 必须传它作 `containerAnimation`。 */
  containerAnimation: gsap.core.Tween
  /** `columns` 选择器命中的列元素。 */
  columns: HTMLElement[]
  /** 横向总行程（px），已在 refresh 时重算。 */
  distance: () => number
}

export type HorizontalPinBuilder = (ctx: HorizontalPinCtx) => void

export interface HorizontalPinOptions {
  /** 横向轨道选择器（scope 内）。默认 `'[data-track]'`。 */
  track?: string
  /** 列选择器（轨道内）。默认 `'[data-column]'`。 */
  columns?: string
  /** 行程尾部额外留白（px 或返回 px 的函数）。默认 `0.6 * innerHeight`。 */
  tail?: number | (() => number)
  scrub?: number | boolean
  start?: ScrollTrigger.Vars['start']
  channel?: ScrollChannel
  onProgress?: (progress: number) => void
  deps?: unknown[]
  enabled?: boolean
}

const MQ_DESKTOP = '(min-width: 64rem)'
const MQ_REDUCED = '(prefers-reduced-motion: reduce)'

export function useHorizontalPin(
  scope: HorizontalScope,
  build: HorizontalPinBuilder | undefined,
  options: HorizontalPinOptions = {},
): void {
  useGSAP(
    () => {
      const root = scope.current
      const o = options
      if (!root || o.enabled === false) return

      const track = root.querySelector<HTMLElement>(o.track ?? '[data-track]')
      if (!track) return

      const mm = gsap.matchMedia()

      mm.add({ desktop: MQ_DESKTOP, reduced: MQ_REDUCED }, (ctx) => {
        const conditions = (ctx.conditions ?? {}) as { desktop?: boolean; reduced?: boolean }
        const reduced = Boolean(conditions.reduced)
        const desktop = Boolean(conditions.desktop)

        // 移动端 / reduced-motion：交给 CSS，JS 完全不介入。
        if (!desktop || reduced) {
          root.dataset.hscroll = reduced ? 'static' : 'native'
          gsap.set(track, { clearProps: 'transform,willChange' })
          if (o.channel) setScrollChannel(o.channel, 0)
          return () => {
            delete root.dataset.hscroll
          }
        }

        root.dataset.hscroll = 'pin'

        const distance = (): number =>
          Math.max(0, track.scrollWidth - (window.innerWidth || 0))
        const tail = (): number =>
          typeof o.tail === 'function'
            ? o.tail()
            : (o.tail ?? (window.innerHeight || 0) * 0.6)

        const containerAnimation = gsap.to(track, {
          x: () => -distance(),
          ease: EASE_GSAP.scrub,
          force3D: true,
          scrollTrigger: {
            trigger: root,
            start: o.start ?? 'top top',
            end: () => `+=${distance() + tail()}`,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            scrub: o.scrub ?? SCRUB.loose,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (o.channel) setScrollChannel(o.channel, self.progress)
              o.onProgress?.(self.progress)
            },
            onToggle: (self) => {
              track.style.willChange = self.isActive ? 'transform' : ''
            },
          },
        })

        const columns = Array.from(
          track.querySelectorAll<HTMLElement>(o.columns ?? '[data-column]'),
        )

        build?.({
          gsap,
          ScrollTrigger,
          root,
          track,
          containerAnimation,
          columns,
          distance,
        })

        return () => {
          track.style.willChange = ''
          delete root.dataset.hscroll
          containerAnimation.scrollTrigger?.kill()
          containerAnimation.kill()
        }
      })

      return () => {
        mm.revert()
      }
    },
    { scope, dependencies: options.deps ?? [], revertOnUpdate: true },
  )
}

export default useHorizontalPin
