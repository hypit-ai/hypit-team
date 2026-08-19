'use client'

/**
 * 通用视差（CREATIVE §M2 三层速率 / §M8 七层堆叠 / §M9 横向反向补偿）。
 *
 * 一个 hook 覆盖全站所有视差需求：
 * - **多层不同速率**：一次调用传 N 层，内部只建 **1 个 ScrollTrigger + 1 条 timeline**，
 *   N 层同时挂在 position 0。七层堆叠不等于七个 trigger。
 * - **纵向 / 横向**：`axis: 'y' | 'x'`。
 * - **rotate / scale / opacity**：同一层可以叠加，仍然只有 transform + opacity，
 *   滚动期不触发 layout / paint（§7.3）。
 * - **响应式**：移动端把速率**向 1.0 压缩**（`mobileScale`），而不是简单关掉——
 *   关掉会让层次感在小屏彻底消失，压缩则保留暗示又不掉帧。
 * - **reduced-motion**：所有层速率 = 1.0（等于不动），`opacity` 直接落到可读态。
 *   这条是硬性的：**最终态必须等于可读态**，JS 挂掉页面也必须完整可读。
 *
 * 速率约定（与剪辑/摄影的「远景走得慢」一致）：
 *   speed = 1.0  跟着页面走，无相对位移
 *   speed > 1.0  比页面**快**（更靠前的层）→ 向上多走
 *   speed < 1.0  比页面**慢**（更靠后的层）→ 向上少走
 * 位移量 = `(speed - 1) × reference`，并以行程**中点为零点**对称展开
 * （元素滚到视口中央时正好回到它在文档流里的位置，排版不会被视差带偏）。
 *
 *   const root = useRef<HTMLElement>(null)
 *   useParallax(root, {
 *     layers: [
 *       { target: '[data-layer="rail"]', speed: 0.35 },
 *       { target: '[data-layer="code"]', speed: 0.82 },
 *       { target: '[data-layer="title"]', speed: 1.0 },
 *     ],
 *   })
 */

import type { RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '@/components/scroll/gsap'
import { EASE_GSAP, SCRUB } from '@/lib/motion/tokens'

export type ParallaxScope = RefObject<HTMLElement | null>

export type ParallaxTarget =
  | string
  | Element
  | Element[]
  | RefObject<Element | null>

export interface ParallaxLayer {
  /** scope 内的选择器 / 元素 / ref。选择器命中多个时整批同速。 */
  target: ParallaxTarget
  /** 速率，见文件头约定。默认 1（不动）。 */
  speed?: number
  /** 主轴。默认 `'y'`。 */
  axis?: 'x' | 'y'
  /**
   * 显式位移总量（px），给出后忽略 `speed`。
   * 正值 = 随滚动向上（或向左）移动。
   */
  distance?: number
  /**
   * `speed` 换算位移时的参考长度（px）。
   * 默认纵向取视口高、横向取视口宽——因此 speed 的手感与屏幕尺寸无关。
   */
  reference?: number | (() => number)
  /** 旋转总角度（deg），从 `-r/2` 走到 `+r/2`。 */
  rotate?: number
  /** 缩放：`[from, to]`，或给一个数表示 `[1, n]`。 */
  scale?: number | readonly [number, number]
  /** 不透明度：`[from, to]`。reduced-motion 下直接取 `readableOpacity`。 */
  opacity?: readonly [number, number]
  /** reduced-motion / 无 JS 时该层应有的可读不透明度。默认 1。 */
  readableOpacity?: number
  /** transform 原点，例如横向压缩用 `'left center'`。 */
  origin?: string
  /** 该层在移动端的独立开关（默认跟随全局 `mobile`）。 */
  mobile?: boolean
}

export interface ParallaxOptions {
  layers: ParallaxLayer[]
  /** ScrollTrigger start。默认 `'top bottom'`。 */
  start?: ScrollTrigger.Vars['start']
  /** ScrollTrigger end。默认 `'bottom top'`。 */
  end?: ScrollTrigger.Vars['end']
  /** scrub 平滑量。默认 `SCRUB.loose`（1）——视差要粘手，不要吸附。 */
  scrub?: number | boolean
  /** 自定义 trigger 元素（默认 scope 根）。 */
  trigger?: ParallaxTarget
  /** 移动端是否启用视差。默认 true（速率被压缩，不是原速）。 */
  mobile?: boolean
  /**
   * 移动端速率压缩系数：`speed' = 1 + (speed - 1) * mobileScale`。
   * 默认 0.35——CREATIVE §M8 要求小屏「几乎不动」。
   */
  mobileScale?: number
  /** 依赖变化时整段 revert 重建。 */
  deps?: unknown[]
  /** 关掉（例如数据还没就绪）。 */
  enabled?: boolean
}

const MQ_DESKTOP = '(min-width: 64rem)'
const MQ_REDUCED = '(prefers-reduced-motion: reduce)'

function resolveTargets(root: HTMLElement, target: ParallaxTarget): Element[] {
  if (typeof target === 'string') return Array.from(root.querySelectorAll(target))
  if (Array.isArray(target)) return target.filter(Boolean)
  if (target instanceof Element) return [target]
  const current = (target as RefObject<Element | null>).current
  return current ? [current] : []
}

function referenceLength(layer: ParallaxLayer, axis: 'x' | 'y'): number {
  if (typeof layer.reference === 'function') return layer.reference()
  if (typeof layer.reference === 'number') return layer.reference
  if (typeof window === 'undefined') return 0
  return axis === 'x' ? window.innerWidth : window.innerHeight
}

/**
 * 均匀铺开一组速率，给「一叠纸被抽开」这类多层堆叠用（§M8）。
 *   spreadSpeeds(7, 0.94, 1.10) → [0.94, 0.9667, …, 1.10]
 */
export function spreadSpeeds(count: number, from: number, to: number): number[] {
  if (count <= 1) return [from]
  const step = (to - from) / (count - 1)
  return Array.from({ length: count }, (_, i) => Number((from + step * i).toFixed(4)))
}

export function useParallax(scope: ParallaxScope, options: ParallaxOptions): void {
  useGSAP(
    () => {
      const root = scope.current
      const o = options
      if (!root || o.enabled === false || o.layers.length === 0) return

      const mm = gsap.matchMedia()

      mm.add({ desktop: MQ_DESKTOP, reduced: MQ_REDUCED }, (ctx) => {
        const conditions = (ctx.conditions ?? {}) as { desktop?: boolean; reduced?: boolean }
        const reduced = Boolean(conditions.reduced)
        const desktop = Boolean(conditions.desktop)
        const mobileOn = o.mobile ?? true
        const mobileScale = o.mobileScale ?? 0.35

        /* reduced-motion：不建任何 trigger，只把「可读终态」写死。 */
        if (reduced) {
          for (const layer of o.layers) {
            const els = resolveTargets(root, layer.target)
            if (els.length === 0) continue
            gsap.set(els, {
              x: 0,
              y: 0,
              rotate: 0,
              scale: 1,
              opacity: layer.readableOpacity ?? 1,
              clearProps: 'willChange',
            })
          }
          return
        }

        const triggerEl = o.trigger ? (resolveTargets(root, o.trigger)[0] ?? root) : root

        const moved: Element[] = []

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: triggerEl,
            start: o.start ?? 'top bottom',
            end: o.end ?? 'bottom top',
            scrub: o.scrub ?? SCRUB.loose,
            invalidateOnRefresh: true,
            // will-change 只在活跃期存在（§7.3）。
            onToggle: (self) => {
              for (const el of moved) {
                ;(el as HTMLElement).style.willChange = self.isActive ? 'transform' : ''
              }
            },
          },
        })

        for (const layer of o.layers) {
          const layerMobile = layer.mobile ?? mobileOn
          if (!desktop && !layerMobile) continue

          const els = resolveTargets(root, layer.target)
          if (els.length === 0) continue

          const axis = layer.axis ?? 'y'
          const rawSpeed = layer.speed ?? 1
          const speed = desktop ? rawSpeed : 1 + (rawSpeed - 1) * mobileScale

          // 位移：以行程中点为零点对称展开。
          const amount = (): number =>
            layer.distance ?? (speed - 1) * referenceLength(layer, axis)

          const hasMove = layer.distance !== undefined || speed !== 1
          const hasRotate = Boolean(layer.rotate)
          const scale =
            layer.scale === undefined
              ? null
              : typeof layer.scale === 'number'
                ? ([1, layer.scale] as const)
                : layer.scale
          const opacity = layer.opacity ?? null

          if (!hasMove && !hasRotate && !scale && !opacity) continue

          const fromVars: gsap.TweenVars = { force3D: true }
          const toVars: gsap.TweenVars = {
            ease: EASE_GSAP.scrub,
            force3D: true,
            duration: 1,
          }

          if (hasMove) {
            const key = axis === 'x' ? 'x' : 'y'
            fromVars[key] = () => amount() / 2
            toVars[key] = () => -amount() / 2
          }
          if (hasRotate) {
            const r = layer.rotate as number
            fromVars.rotate = -r / 2
            toVars.rotate = r / 2
          }
          if (scale) {
            fromVars.scale = scale[0]
            toVars.scale = scale[1]
          }
          if (opacity) {
            fromVars.opacity = opacity[0]
            toVars.opacity = opacity[1]
          }
          if (layer.origin) {
            fromVars.transformOrigin = layer.origin
            toVars.transformOrigin = layer.origin
          }

          tl.fromTo(els, fromVars, toVars, 0)
          moved.push(...els)
        }
      })

      return () => {
        mm.revert()
      }
    },
    { scope, dependencies: options.deps ?? [], revertOnUpdate: true },
  )
}

export default useParallax
