'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { DUR_MS } from '@/lib/motion/tokens'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface CounterProps {
  /** 目标数值（来自 lib/data）。 */
  value: number
  /** 起始值，默认 0。 */
  from?: number
  /** 时长（毫秒），默认 --dur-stage 900ms。 */
  durationMs?: number
  /** 小数位，默认 0。 */
  decimals?: number
  /** 自定义格式化（优先于 decimals）。必须是纯函数，SSR/CSR 输出一致。 */
  format?: (n: number) => string
  prefix?: string
  suffix?: string
  /** 进入视口时才播放（默认 true），只播一次。 */
  playOnView?: boolean
  /** 视口触发阈值。 */
  amount?: number
  /** 延迟（毫秒）。 */
  delayMs?: number
  className?: string
  /** 语义标签：整块的可读文本（避免读屏机读到滚动中的中间值）。 */
  'aria-label'?: string
}

/** easeOutExpo —— 与 --ease-out-expo 对应。 */
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/**
 * count-up 数字（蓝图 §7 T2）。
 * - tabular-nums 等宽，滚动时不抖动宽度。
 * - `prefers-reduced-motion` → 直接显示终值。
 * - SSR 输出终值（SEO / 无 JS 可读），hydration 后若需播放再回到起点。
 * - IntersectionObserver + rAF，卸载时全部清理。
 */
export function Counter({
  value,
  from = 0,
  durationMs = DUR_MS.stage,
  decimals = 0,
  format,
  prefix,
  suffix,
  playOnView = true,
  amount = 0.5,
  delayMs = 0,
  className,
  'aria-label': ariaLabel,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState<number>(value)
  const playedRef = useRef(false)

  useEffect(() => {
    if (reduced) return
    const el = ref.current
    if (!el || typeof window === 'undefined') return

    let raf = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let observer: IntersectionObserver | undefined

    const run = () => {
      if (playedRef.current) return
      playedRef.current = true
      const start = performance.now() + delayMs
      const tick = (now: number) => {
        const t = Math.max(0, Math.min(1, (now - start) / durationMs))
        setDisplay(from + (value - from) * easeOutExpo(t))
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      setDisplay(from)
      raf = requestAnimationFrame(tick)
    }

    if (!playOnView) {
      timer = setTimeout(run, 0)
    } else if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              run()
              observer?.disconnect()
            }
          }
        },
        { threshold: amount },
      )
      observer.observe(el)
    } else {
      run()
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
      if (timer) clearTimeout(timer)
      observer?.disconnect()
    }
  }, [value, from, durationMs, delayMs, playOnView, amount, reduced])

  // reduced-motion 直接显示终值（派生，不在 effect 里 setState）
  const shown = reduced ? value : display
  const text = format ? format(shown) : shown.toFixed(decimals)

  return (
    <span
      ref={ref}
      className={cn('tabular-nums', className)}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      <span aria-hidden={ariaLabel ? 'true' : undefined}>
        {prefix}
        {text}
        {suffix}
      </span>
    </span>
  )
}

export default Counter
