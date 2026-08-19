'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { DUR_MS } from '@/lib/motion/tokens'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useLatestRef } from '@/hooks/useLatestRef'
import { ScrollEdgeStyle, X_SCROLL } from './ScrollEdge'

/** 与 lib/data/cli-demo.ts（T1）的 `TerminalLine` 结构一致，靠结构类型对接。 */
export type TerminalLineKind = 'cmd' | 'out' | 'ok' | 'warn' | 'err'

export interface TerminalLineData {
  kind: TerminalLineKind
  text: string
  /** 该行播完后的额外停顿（毫秒）。 */
  delayMs?: number
}

export interface TerminalProps {
  lines: readonly TerminalLineData[]
  /** 标题栏文案（如 `narratage — build`），来自数据层。 */
  title?: string
  /** 命令行提示符，默认 `$`。 */
  prompt?: string
  /** 逐行播放（默认 true）。false 或 reduced-motion → 一次性显示全文。 */
  typing?: boolean
  /** 每行间隔，默认 --dur-instant 80ms。 */
  lineDelayMs?: number
  /** 进入视口才开始播放，默认 true。 */
  startOnView?: boolean
  /** 跳过按钮文案（来自数据层；不传则不渲染按钮）。 */
  skipLabel?: string
  /** 最大可见行数（超出纵向滚动）。 */
  maxRows?: number
  /** 无障碍标签。 */
  ariaLabel?: string
  className?: string
  bodyClassName?: string
}

const KIND_CLASS: Record<TerminalLineKind, string> = {
  cmd: 'text-text-0',
  out: 'text-text-1',
  ok: 'text-carbide',
  warn: 'text-carbide-dim',
  err: 'text-fuse',
}

/**
 * 终端逐行播放（蓝图 §7 T2 / S9 / S10）。
 * - 完整文本始终在 DOM 中（SEO + 读屏可读），未播出的行用 `invisible` 占位，**零 CLS**。
 * - `prefers-reduced-motion` → 直接全文。
 * - IntersectionObserver 触发，卸载时清理 timer 与 observer。
 */
export function Terminal({
  lines,
  title,
  prompt = '$',
  typing = true,
  lineDelayMs = DUR_MS.instant,
  startOnView = true,
  skipLabel,
  maxRows,
  ariaLabel,
  className,
  bodyClassName,
}: TerminalProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const total = lines.length
  const animate = typing && !reduced

  // SSR 与首帧一律全量渲染 → 无 hydration mismatch、无 CLS
  const [visible, setVisible] = useState(total)
  const [done, setDone] = useState(true)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const playedRef = useRef(false)
  /*
   * `lines` 是数组 prop。当前调用方传的都是模块级常量，但只要有一天有人传
   * `t(...)` 生成的新数组，每次渲染都会得到新引用：effect 重建 → clearTimers 清掉
   * 打字机定时器，而 `playedRef` 已置位、play() 直接 return，动画就永久停在半截。
   * 用 ref 读最新值，把它从依赖里摘掉。
   */
  const linesRef = useLatestRef(lines)

  const clearTimers = () => {
    for (const t of timersRef.current) clearTimeout(t)
    timersRef.current = []
  }

  useEffect(() => {
    if (!animate) return
    const el = ref.current
    if (!el || typeof window === 'undefined') return

    let observer: IntersectionObserver | undefined

    const play = () => {
      if (playedRef.current) return
      playedRef.current = true
      setVisible(0)
      setDone(false)
      let acc = 0
      linesRef.current.forEach((line, i) => {
        acc += lineDelayMs + (line.delayMs ?? 0)
        timersRef.current.push(
          setTimeout(() => {
            setVisible(i + 1)
            if (i === total - 1) setDone(true)
          }, acc),
        )
      })
    }

    if (!startOnView) {
      play()
    } else if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              play()
              observer?.disconnect()
            }
          }
        },
        { threshold: 0.25 },
      )
      observer.observe(el)
    } else {
      play()
    }

    return () => {
      clearTimers()
      observer?.disconnect()
    }
  }, [animate, linesRef, lineDelayMs, startOnView, total])

  const skip = () => {
    clearTimers()
    setVisible(total)
    setDone(true)
  }

  // 不播放动画时全量显示（派生，不在 effect 里 setState）
  const shownCount = animate ? visible : total

  return (
    <div
      ref={ref}
      className={cn(
        'border-rule bg-paper-2 relative isolate min-w-0 border',
        className,
      )}
    >
      <ScrollEdgeStyle />
      {title || (skipLabel && animate) ? (
        <div className="border-line font-mono text-[length:var(--text-eyebrow)] leading-none text-text-2 flex items-center justify-between gap-3 border-b px-3 py-2 tracking-[0.16em] uppercase">
          <span className="min-w-0 truncate">{title}</span>
          {skipLabel && animate && !done ? (
            <button
              type="button"
              onClick={skip}
              className="text-text-1 hover:text-carbide -my-2 -mr-2 inline-flex min-h-11 items-center px-3 tracking-[0.16em] uppercase transition-colors duration-[var(--dur-base)]"
            >
              {skipLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        role="log"
        aria-label={ariaLabel ?? title}
        aria-live="off"
        style={maxRows ? { maxHeight: `calc(${maxRows} * 1.65em + 1.5rem)` } : undefined}
        className={cn(
          'font-mono text-[length:var(--text-mono)] leading-[1.65] min-w-0 overflow-x-auto px-3 py-3',
          // 与代码块同一套截断语汇（ScrollEdge）：末列字形淡出，不硬切。
          // 边框在外层容器上，遮罩只作用于这个滚动体，所以框线不会被一起吃掉。
          X_SCROLL,
          // 纵向不加渐隐：maxRows 换算出的高度落在整行边界上，是**故意**的收尾。
          maxRows && 'overflow-y-auto',
          bodyClassName,
        )}
      >
        <div className="min-w-max">
          {lines.map((line, i) => (
            <div
              key={`${i}-${line.text}`}
              data-terminal-line={i}
              className={cn(
                'flex gap-2 whitespace-pre',
                KIND_CLASS[line.kind],
                i >= shownCount && 'invisible',
              )}
            >
              <span aria-hidden="true" className="text-text-2 shrink-0 select-none">
                {line.kind === 'cmd' ? prompt : ' '}
              </span>
              <span>{line.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Terminal
