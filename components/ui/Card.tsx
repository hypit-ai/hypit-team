import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export type CardTone = 'default' | 'accent' | 'danger' | 'flat'

export interface CardProps {
  children?: ReactNode
  /** 序号（"0x01" / "L4"）。由数据层给出，组件不生成文案。 */
  index?: ReactNode
  /** 标题行 */
  title?: ReactNode
  /** 标题右侧 mono 元信息 */
  meta?: ReactNode
  /** 底部 mono 脚注 */
  footer?: ReactNode
  tone?: CardTone
  /** hover 时顶部 1px carbide 轨道 0→100%（仅 pointer:fine 生效）。 */
  track?: boolean
  /** 高亮态（当前项 / 命中项），受控。 */
  active?: boolean
  as?: ElementType
  className?: string
  bodyClassName?: string
  id?: string
}

const TONE: Record<CardTone, string> = {
  default: 'border-line bg-bg-1',
  accent: 'border-carbide bg-bg-1',
  danger: 'border-fuse bg-bg-1',
  flat: 'border-line bg-transparent',
}

/**
 * hairline 卡片（蓝图 §7 T2）。
 * 无圆角 >4px、无 box-shadow（§4.1）。hover 顶部 carbide 轨道用 scaleX，
 * 只在 `(pointer: fine)` 生效，触屏不闪。
 */
export function Card({
  children,
  index,
  title,
  meta,
  footer,
  tone = 'default',
  track = true,
  active = false,
  as,
  className,
  bodyClassName,
  id,
}: CardProps) {
  const Tag = (as ?? 'article') as ElementType<{
    id?: string
    className?: string
    children?: ReactNode
    'data-active'?: boolean
  }>
  return (
    <Tag
      id={id}
      data-active={active || undefined}
      className={cn(
        'group/card relative isolate flex min-w-0 flex-col border',
        'transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
        TONE[tone],
        active && 'border-carbide',
        'hover:border-line-strong data-[active]:border-carbide',
        className,
      )}
    >
      {track ? (
        <span
          aria-hidden="true"
          className={cn(
            'bg-carbide pointer-events-none absolute inset-x-0 top-0 h-px origin-left',
            'scale-x-0 transition-transform duration-[var(--dur-mid)] ease-[var(--ease-out-cubic)]',
            // Tailwind v4 的 hover: / group-hover: 默认已裹在 @media (hover: hover) 里，
            // 触屏不会误触发；旧写法 `pointer-fine:` 不是本站定义过的 variant，会被整条丢弃。
            'group-focus-within/card:scale-x-100 group-hover/card:scale-x-100',
            active && 'scale-x-100',
          )}
        />
      ) : null}

      {index || title || meta ? (
        <header className="flex min-w-0 items-baseline justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="flex min-w-0 items-baseline gap-3">
            {index ? (
              <span className="font-mono text-[length:var(--text-eyebrow)] leading-none text-text-2 group-hover/card:text-carbide shrink-0 tracking-[0.12em] uppercase transition-colors duration-[var(--dur-base)]">
                {index}
              </span>
            ) : null}
            {title ? (
              <h3 className="text-text-0 text-[length:var(--text-h3)] leading-[1.25] tracking-[-0.018em] min-w-0 font-semibold">{title}</h3>
            ) : null}
          </div>
          {meta ? (
            <span className="font-mono text-[length:var(--text-eyebrow)] leading-none text-text-2 shrink-0 tracking-[0.12em] uppercase">
              {meta}
            </span>
          ) : null}
        </header>
      ) : null}

      {children ? (
        <div className={cn('min-w-0 flex-1 px-4 py-4 sm:px-5 sm:py-5', bodyClassName)}>
          {children}
        </div>
      ) : null}

      {footer ? (
        <footer className="border-line font-mono text-[length:var(--text-eyebrow)] leading-none text-text-2 mt-auto border-t px-4 py-3 tracking-[0.12em] uppercase sm:px-5">
          {footer}
        </footer>
      ) : null}
    </Tag>
  )
}

export default Card
