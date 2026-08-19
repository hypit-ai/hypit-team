'use client'

/**
 * 滚动进度的 React 侧接口（CREATIVE §3 · 滚动进度总线）。
 *
 * 三种消费姿势，按「谁需要重渲染」严格分层：
 *
 * 1. `useScrollProgress(onChange)`   —— **命令式**，零重渲染。逐帧回调，
 *    适合直写 `style.transform` / CSS 变量 / WebGL uniform。**滚动期的默认选择。**
 * 2. `useScrollProgressVar(ref, ...)` —— 把进度写进某个元素的 CSS 变量，
 *    连回调都不用自己写。
 * 3. `useScrollProgressValue({ steps })` —— **量化**后的 React 状态。
 *    只有跨过量化台阶才 setState（`steps: 100` → 每 1% 一次），
 *    给 HUD 的百分比读数用。**禁止用它驱动动画。**
 *
 * 所有 hook 都建立在 `components/scroll/scrollBus` 的单一 body ScrollTrigger 上，
 * 不会各自增加滚动监听；SSR 下全部安全 no-op。
 */

import { useEffect, useState, type RefObject } from 'react'
import { useLatestRef } from './useLatestRef'
import {
  subscribeScroll,
  subscribeScrollChannel,
  getScrollChannel,
  type ScrollState,
  type ScrollChannel,
} from '@/components/scroll/scrollBus'

/* ═══ 1 · 命令式 ═══════════════════════════════════════════ */

export type ScrollProgressHandler = (state: Readonly<ScrollState>) => void

/**
 * 逐帧拿到文档滚动状态，**不触发任何重渲染**。
 * 回调用 ref 存放，因此调用方不需要 `useCallback`。
 *
 *   useScrollProgress((s) => { rail.current!.style.setProperty('--y', `${s.y * 0.35}px`) })
 */
export function useScrollProgress(onChange: ScrollProgressHandler, enabled = true): void {
  const ref = useLatestRef(onChange)

  useEffect(() => {
    if (!enabled) return
    return subscribeScroll((s) => ref.current(s))
  }, [ref, enabled])
}

/** 非 React 场景（WebGL 的 useFrame 等）直接读这个固定引用。 */
export { scrollState } from '@/components/scroll/scrollBus'

/* ═══ 2 · CSS 变量直写 ═════════════════════════════════════ */

export interface ScrollProgressVarOptions {
  /** 变量名（含 `--`）。默认 `--scroll-progress`。 */
  name?: string
  /** 目标元素；省略时写到 `document.documentElement`。 */
  target?: RefObject<HTMLElement | null>
  /** 取哪个量。默认文档进度。 */
  select?: (state: Readonly<ScrollState>) => number
  /** 小数位（默认 4）。截断可以避免无意义的样式失效。 */
  precision?: number
  /** 单位后缀（如 `'px'`）。默认无单位。 */
  unit?: string
  enabled?: boolean
}

/**
 * 把滚动量持续写进 CSS 变量。
 * 变量本身若要参与 transition，请在 CSS 里用 `@property` 注册类型
 * （CREATIVE §M1：只有注册过的自定义属性才允许在滚动期变化）。
 */
export function useScrollProgressVar({
  name = '--scroll-progress',
  target,
  select,
  precision = 4,
  unit = '',
  enabled = true,
}: ScrollProgressVarOptions = {}): void {
  const selectRef = useLatestRef(select)

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return
    const el = target?.current ?? document.documentElement
    if (!el) return

    let last = Number.NaN
    const unsubscribe = subscribeScroll((s) => {
      const raw = selectRef.current ? selectRef.current(s) : s.progress
      const v = Number(raw.toFixed(precision))
      if (v === last) return
      last = v
      el.style.setProperty(name, `${v}${unit}`)
    })

    return () => {
      unsubscribe()
      el.style.removeProperty(name)
    }
  }, [selectRef, name, target, precision, unit, enabled])
}

/* ═══ 3 · 量化后的 React 状态 ══════════════════════════════ */

export interface ScrollProgressValueOptions {
  /**
   * 量化台阶数。`100` → 只在整数百分比变化时 setState。
   * **不要低于 20 以下以外的精度需求就调高它**——每一级都是一次重渲染。
   */
  steps?: number
  select?: (state: Readonly<ScrollState>) => number
  enabled?: boolean
}

/**
 * 量化的滚动进度，供 HUD 之类的低频 UI 使用。
 * 返回值是 0..1 的量化结果（`Math.round(p * steps) / steps`）。
 * SSR / 首帧为 0。
 */
export function useScrollProgressValue({
  steps = 100,
  select,
  enabled = true,
}: ScrollProgressValueOptions = {}): number {
  const [value, setValue] = useState(0)
  const selectRef = useLatestRef(select)

  useEffect(() => {
    if (!enabled) return
    const quantize = (n: number) => Math.round(n * steps) / steps
    return subscribeScroll((s) => {
      const next = quantize(selectRef.current ? selectRef.current(s) : s.progress)
      setValue((prev) => (prev === next ? prev : next))
    })
  }, [selectRef, steps, enabled])

  return value
}

/** 滚动方向（1 向下 / -1 向上 / 0 静止）。变化频率低，可以进 React 状态。 */
export function useScrollDirection(enabled = true): 1 | -1 | 0 {
  const [dir, setDir] = useState<1 | -1 | 0>(0)

  useEffect(() => {
    if (!enabled) return
    return subscribeScroll((s) => {
      setDir((prev) => (prev === s.direction ? prev : s.direction))
    })
  }, [enabled])

  return dir
}

/**
 * 页面是否已经离开首屏（Nav 的贴顶态用）。
 * 带 8px 迟滞，避免在阈值附近来回抖动导致连续重渲染。
 */
export function useScrolledPast(threshold = 24, enabled = true): boolean {
  const [past, setPast] = useState(false)

  useEffect(() => {
    if (!enabled) return
    return subscribeScroll((s) => {
      setPast((prev) => {
        if (prev) return s.y > threshold - 8
        return s.y > threshold
      })
    })
  }, [threshold, enabled])

  return past
}

/* ═══ 命名通道 ═════════════════════════════════════════════ */

/**
 * 订阅某个 section 广播的局部进度（`SCROLL_CHANNEL.*`），命令式、零重渲染。
 *
 *   useScrollChannel(SCROLL_CHANNEL.impression, (p) => hud.current!.textContent = fmt(p))
 */
export function useScrollChannel(
  name: ScrollChannel,
  onChange: (value: number) => void,
  enabled = true,
): void {
  const ref = useLatestRef(onChange)

  useEffect(() => {
    if (!enabled) return
    return subscribeScrollChannel(name, (v) => ref.current(v))
  }, [ref, name, enabled])
}

/** 通道的量化 React 状态版（同样只给低频 UI）。 */
export function useScrollChannelValue(name: ScrollChannel, steps = 100): number {
  const [value, setValue] = useState(() => getScrollChannel(name))

  useEffect(() => {
    const quantize = (n: number) => Math.round(n * steps) / steps
    return subscribeScrollChannel(name, (v) => {
      const next = quantize(v)
      setValue((prev) => (prev === next ? prev : next))
    })
  }, [name, steps])

  return value
}

export default useScrollProgress
