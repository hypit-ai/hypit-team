'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { DUR_MS } from '@/lib/motion/tokens'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/** ASCII spinner 帧序（蓝图 §9.1 M2）。 */
export const SPINNER_FRAMES = ['-', '\\', '|', '/'] as const

export type MonoTagTone = 'muted' | 'default' | 'accent' | 'danger'

export interface MonoTagProps {
  /** 标签名，如 `LANG` / `MOTION` / `BUILD`。来自数据层或调用方常量。 */
  label: ReactNode
  /** 方括号内的状态字符，如 `EN` / `ON`。传 spinner 时可省略。 */
  value?: ReactNode
  /** 显示 ASCII spinner（`[-] [\] [|] [/]` 循环），覆盖 value。 */
  spinner?: boolean
  tone?: MonoTagTone
  /** 激活态（当前选中项）。 */
  active?: boolean
  /** 作为按钮渲染（min-h-11 触达区）。 */
  onClick?: () => void
  /** 作为链接渲染；null 时按 D9 不渲染。 */
  href?: string | null
  external?: boolean
  /** 无障碍标签，按钮/链接强烈建议传。 */
  'aria-label'?: string
  className?: string
}

const TONE: Record<MonoTagTone, string> = {
  muted: 'text-text-2',
  default: 'text-text-1',
  accent: 'text-carbide',
  danger: 'text-fuse',
}

/** spinner 帧钩子：reduced-motion 下锁定为 `|`，卸载时清 interval。 */
export function useSpinnerFrame(enabled: boolean, stepMs = DUR_MS.fast): string {
  const reduced = useReducedMotion()
  const [i, setI] = useState(0)

  useEffect(() => {
    if (!enabled || reduced) return
    const id = setInterval(() => setI((v) => (v + 1) % SPINNER_FRAMES.length), stepMs)
    return () => clearInterval(id)
  }, [enabled, reduced, stepMs])

  if (!enabled) return ''
  return reduced ? '|' : SPINNER_FRAMES[i]
}

/**
 * 方括号状态字符（蓝图 §9.1 M2）：`LANG[EN]` / `MOTION[ON]` / `BUILD[/]`。
 * 交互形态（button / a）自动获得 ≥44px 触达高度与统一焦点态。
 */
export function MonoTag({
  label,
  value,
  spinner = false,
  tone = 'muted',
  active = false,
  onClick,
  href,
  external,
  'aria-label': ariaLabel,
  className,
}: MonoTagProps) {
  const frame = useSpinnerFrame(spinner)
  const shown = spinner ? frame : value

  const content = (
    <>
      <span>{label}</span>
      {shown !== undefined && shown !== null && shown !== '' ? (
        <span className={cn(active ? 'text-carbide' : undefined)}>
          <span aria-hidden="true">[</span>
          <span className={spinner ? 'inline-block w-[1ch] text-center' : undefined}>
            {shown}
          </span>
          <span aria-hidden="true">]</span>
        </span>
      ) : null}
    </>
  )

  const base = cn(
    'font-mono text-[length:var(--text-eyebrow)] leading-none inline-flex items-center gap-[0.15em]',
    'tracking-[0.16em] whitespace-nowrap uppercase',
    'transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
    active ? 'text-text-0' : TONE[tone],
    className,
  )

  const interactive = cn(base, 'hover:text-carbide min-h-11 px-1')

  if (href) {
    const isExternal = external ?? /^https?:\/\//.test(href)
    return (
      <a
        href={href}
        aria-label={ariaLabel}
        className={interactive}
        {...(isExternal ? { target: '_blank', rel: 'noreferrer noopener' } : null)}
      >
        {content}
      </a>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        aria-pressed={active}
        className={interactive}
      >
        {content}
      </button>
    )
  }

  return (
    <span className={base} aria-label={ariaLabel} role={ariaLabel ? 'status' : undefined}>
      {content}
    </span>
  )
}

export default MonoTag
