import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { Rule } from './Rule'

export type EyebrowVariant = 'plain' | 'dot' | 'bordered'
/** 品牌只有一个强调色，accent / danger 均落到 crimson。 */
export type EyebrowTone = 'muted' | 'accent' | 'danger'

export interface EyebrowProps {
  /** 文案由调用方从 lib/data 传入，组件内不硬编码。 */
  children: ReactNode
  variant?: EyebrowVariant
  tone?: EyebrowTone
  /**
   * 右侧接一条 flex-1 的 np-rule，构成 `OPEN SOURCE ————————|` 报头
   *（BRAND.md §3.1 用法，gap 22px）。
   */
  rule?: boolean
  as?: ElementType
  className?: string
  id?: string
}

const TONE: Record<EyebrowTone, string> = {
  muted: 'text-muted',
  accent: 'text-crimson',
  danger: 'text-crimson',
}

const DOT_TONE: Record<EyebrowTone, string> = {
  muted: 'bg-muted',
  accent: 'bg-crimson',
  danger: 'bg-crimson',
}

/**
 * mono 小标签（BRAND.md §2 档位：11px / ls .16em / uppercase / muted）。
 * variant:
 *  - plain    纯文字
 *  - dot      左侧 4px 方点
 *  - bordered 细边框（radius 0，§3）
 */
export function Eyebrow({
  children,
  variant = 'plain',
  tone = 'muted',
  rule = false,
  as,
  className,
  id,
}: EyebrowProps) {
  const Tag = (as ?? 'p') as ElementType<{
    id?: string
    className?: string
    children?: ReactNode
  }>

  const label = (
    <Tag
      id={id}
      className={cn(
        'font-mono inline-flex items-center gap-2 leading-none uppercase',
        // 尺寸走刻度 token，不写死 11px（globals.css `--step-label`）
        'text-[length:var(--text-eyebrow)] tracking-[0.16em] whitespace-nowrap',
        TONE[tone],
        variant === 'bordered' && 'border-rule rounded-none border px-2 py-1',
        !rule && className,
      )}
    >
      {variant === 'dot' ? (
        <span
          aria-hidden="true"
          className={cn('inline-block size-[4px] shrink-0', DOT_TONE[tone])}
        />
      ) : null}
      <span className="min-w-0">{children}</span>
    </Tag>
  )

  if (!rule) return label

  return (
    <div className={cn('flex w-full items-center gap-6', className)}>
      {label}
      <Rule tick="r" className="flex-1" />
    </div>
  )
}

export default Eyebrow
