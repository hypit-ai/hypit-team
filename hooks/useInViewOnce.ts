'use client'

import { useEffect, useState, type RefCallback } from 'react'

export interface InViewOnceOptions {
  /** 可见比例阈值（IntersectionObserver threshold），默认 0.35（与 VIEWPORT_ONCE 同源）。 */
  amount?: number
  /** 根边距，提前 / 延后触发。 */
  rootMargin?: string
  /**
   * 关闭观察：直接返回 true（视为已可见）。
   * 用于 `prefers-reduced-motion` 或需要立即呈现终态的场景。
   */
  disabled?: boolean
}

/** `[ref, inView]`。ref 是**回调 ref**（稳定引用），直接挂到元素上。 */
export type InViewOnceResult<T extends HTMLElement> = readonly [
  ref: RefCallback<T>,
  inView: boolean,
]

/**
 * 「进入视口一次」观察器（蓝图 §7 T9）。
 *
 * - SSR / 首帧返回 false，hydrate 后由 IntersectionObserver 校正，无 hydration mismatch；
 *   环境缺少 IntersectionObserver 时异步置 true（保证内容不会永久停在初态）。
 * - 命中后立即 `disconnect()`，卸载 / 换元素时也 `disconnect()`，无残留观察者。
 * - 全程只发生一次 `false → true` 的状态变化，不会造成滚动期重渲染。
 * - 用回调 ref 而非 `useRef`，因此不需要在渲染期读 `ref.current`。
 *
 *   const [ref, inView] = useInViewOnce<HTMLDivElement>({ amount: 0.6 })
 *   <div ref={ref} data-inview={inView || undefined} />
 */
export function useInViewOnce<T extends HTMLElement = HTMLDivElement>({
  amount = 0.35,
  rootMargin,
  disabled = false,
}: InViewOnceOptions = {}): InViewOnceResult<T> {
  const [node, setNode] = useState<T | null>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    if (seen || disabled || !node) return

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      let cancelled = false
      queueMicrotask(() => {
        if (!cancelled) setSeen(true)
      })
      return () => {
        cancelled = true
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          observer.disconnect()
          setSeen(true)
          return
        }
      },
      { threshold: amount, rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [node, seen, disabled, amount, rootMargin])

  return [setNode, disabled || seen] as const
}

export default useInViewOnce
