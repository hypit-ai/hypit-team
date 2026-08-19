import { cn } from '@/lib/utils/cn'

export interface CaretProps {
  /** 是否闪烁。false 时保持常亮（`prefers-reduced-motion` 下 CSS 已自动常亮）。 */
  blink?: boolean
  className?: string
}

/**
 * carbide 方块光标（蓝图 §4 `.caret`）。
 * 纯装饰，`aria-hidden`，挂在标题行末尾：`Agents compile it.<Caret />`
 * 尺寸随父级 font-size（0.5em × 0.95em），无需传参。
 */
export function Caret({ blink = true, className }: CaretProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'caret inline-block align-baseline',
        !blink && '[&::after]:animate-none',
        className,
      )}
    />
  )
}

export default Caret
