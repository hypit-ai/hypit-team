'use client'

/**
 * 全站单时钟（蓝图 §5.1）。
 *
 * Lenis 只做「计算滚动位置」，帧循环交给 `gsap.ticker`——全站只有一个 rAF，
 * 不会出现 Lenis / GSAP / R3F 三个时钟互相错帧。
 *
 * 关键点：
 * - `autoRaf:false`：禁掉 Lenis 自带 rAF。
 * - `syncTouch:false`：移动端用原生惯性，别跟系统滚动打架。
 * - `gsap.ticker.lagSmoothing(0)` + `ScrollTrigger.config({ignoreMobileResize:true})`（在 gsap.ts 里）。
 * - `document.fonts.ready` 后再 `ScrollTrigger.refresh()`：中文 webfont 会改行高。
 * - cleanup 顺序固定：`ticker.remove → lenis.off → lenis.destroy`。
 * - `prefers-reduced-motion` 下**不初始化 Lenis**，走原生滚动。
 *
 * 用法（放在 app/layout.tsx，包住 children）：
 *   <SmoothScroll>{children}</SmoothScroll>
 */

import { useEffect, type ReactNode } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap, ScrollTrigger, registerGsap } from './gsap'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useScrollTheme } from '@/hooks/useScrollTheme'

let lenisInstance: Lenis | null = null

/** 拿到当前 Lenis 实例；reduced-motion 或未挂载时为 null。 */
export function getLenis(): Lenis | null {
  return lenisInstance
}

export interface ScrollToOptions {
  offset?: number
  immediate?: boolean
  duration?: number
}

/**
 * 全站统一的锚点跳转（Nav / skip-link / CTA 都用它）。
 * Lenis 缺席时自动退回原生 `scrollIntoView`，行为一致。
 */
export function scrollToTarget(
  target: string | HTMLElement,
  { offset = 0, immediate = false, duration }: ScrollToOptions = {},
): void {
  if (typeof window === 'undefined') return
  const lenis = lenisInstance
  if (lenis) {
    lenis.scrollTo(target, { offset, immediate, duration })
    return
  }
  const el =
    typeof target === 'string'
      ? document.querySelector<HTMLElement>(target.startsWith('#') ? target : `#${target}`)
      : target
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY + offset
  window.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' })
}

export interface SmoothScrollProps {
  children?: ReactNode
  /** 关掉滚动色温插值（M3）。默认开。 */
  theme?: boolean
}

export function SmoothScroll({ children, theme = true }: SmoothScrollProps) {
  const reduced = useReducedMotion()

  // M3 色温：挂在这里，全站只有一份。
  useScrollTheme(theme)

  useEffect(() => {
    if (typeof window === 'undefined') return
    registerGsap()

    // reduced-motion：不初始化 Lenis，原生滚动 + ScrollTrigger 默认监听即可。
    if (reduced) {
      lenisInstance = null
      const refresh = () => ScrollTrigger.refresh()
      document.fonts?.ready.then(refresh).catch(() => {})
      return
    }

    const lenis = new Lenis({
      autoRaf: false,
      syncTouch: false,
      lerp: 0.11,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      // 锚点由 scrollToTarget 统一接管，关掉 Lenis 的自动劫持避免双跳。
      anchors: false,
      // 代码块 / 横向矩阵内部滚动不被接管。
      prevent: (node) => node.hasAttribute('data-lenis-prevent'),
    })
    lenisInstance = lenis

    const onScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onScroll)

    // GSAP ticker 的 time 单位是秒，Lenis.raf 要毫秒。
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)

    ScrollTrigger.refresh()
    let cancelled = false
    document.fonts?.ready
      .then(() => {
        if (!cancelled) ScrollTrigger.refresh()
      })
      .catch(() => {})

    return () => {
      cancelled = true
      gsap.ticker.remove(tick)
      lenis.off('scroll', onScroll)
      lenis.destroy()
      if (lenisInstance === lenis) lenisInstance = null
    }
  }, [reduced])

  return <>{children}</>
}

export default SmoothScroll
