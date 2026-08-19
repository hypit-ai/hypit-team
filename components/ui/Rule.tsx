import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * BRAND.md §3.1 的 np-rule 是品牌标志性元素：一条 1px 细线，两端各带
 * 一个 9px 高的刻度。`tick` 控制保留哪一端。
 * 其余变体（trace / marked / ruler / solid）保留给既有调用方。
 */
export type RuleVariant = 'np' | 'trace' | 'marked' | 'ruler' | 'solid'

/** both 两端刻度 / l 仅左 / r 仅右 / none 无刻度 */
export type RuleTick = 'both' | 'l' | 'r' | 'none'

export interface RuleProps {
  /** 默认 np —— 带末端刻度的品牌细线。 */
  variant?: RuleVariant
  /** 仅 np 使用：刻度端。 */
  tick?: RuleTick
  /** 仅 marked 使用：中缀 mono 标签（文案由调用方传入）。 */
  label?: ReactNode
  className?: string
}

const TICK: Record<RuleTick, string> = {
  both: '',
  l: 'tick-l',
  r: 'tick-r',
  none: 'tick-none',
}

/**
 * 分隔线。全部为装饰性，`aria-hidden`；
 * marked 变体因携带可读文字改用 div。
 *
 * 报头用法：`<Eyebrow>OPEN SOURCE</Eyebrow><Rule className="flex-1" tick="r" />`
 */
export function Rule({ variant = 'np', tick = 'both', label, className }: RuleProps) {
  if (variant === 'marked') {
    return (
      <div className={cn('rule-marked w-full uppercase', className)}>
        <span className="justify-self-center">{label}</span>
      </div>
    )
  }

  if (variant === 'ruler') {
    return (
      <div role="presentation" aria-hidden="true" className={cn('rule-ruler w-full', className)} />
    )
  }

  if (variant === 'solid') {
    return (
      <hr
        aria-hidden="true"
        className={cn('border-rule w-full border-0 border-t', className)}
      />
    )
  }

  if (variant === 'trace') {
    return <hr aria-hidden="true" className={cn('rule-trace w-full', className)} />
  }

  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn('np-rule', TICK[tick], className)}
    />
  )
}

export default Rule
