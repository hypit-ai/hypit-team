import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * BRAND.md §3.3 只有两种按钮：`brand`（crimson 实底）与 `alt`（描边）。
 * 旧命名 primary / secondary / ghost / danger 保留为别名，避免调用方大改。
 */
export type ButtonVariant =
  | 'brand'
  | 'alt'
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
export type ButtonSize = 'sm' | 'md'

interface ButtonBaseProps {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  /**
   * 尾部箭头。默认在 `brand` 上开启。
   * 箭头用 CSS mask 绘制（§3.3），继承 currentColor，hover 时 translateX(4px)。
   */
  arrow?: boolean
  /** 自定义尾部装饰（给了就取代 arrow）。文案由调用方传，组件不硬编码。 */
  trailing?: ReactNode
  leading?: ReactNode
  fullWidth?: boolean
  className?: string
  /**
   * 目标地址。`null` / `undefined` 时不渲染 `<a>`：
   * - 有 onClick → 渲染 `<button>`
   * - 都没有 → **渲染 null**（D9：url 为 null 的链接自动隐藏，禁止死链）
   */
  href?: string | null
  /** 外链：自动加 target=_blank + rel。 */
  external?: boolean
  disabled?: boolean
  'aria-label'?: string
}

export type ButtonProps = ButtonBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps | 'type'> & {
    type?: 'button' | 'submit' | 'reset'
  }

/** 旧命名 → §3.3 的两种形态。 */
const RESOLVE: Record<ButtonVariant, 'brand' | 'alt'> = {
  brand: 'brand',
  primary: 'brand',
  alt: 'alt',
  secondary: 'alt',
  ghost: 'alt',
  danger: 'alt',
}

const SIZE: Record<ButtonSize, string> = {
  // 高度由 .np-btn 的 min-height:44px 单独决定（交互目标下限），只调左右内距
  sm: 'px-3',
  md: '',
}

/**
 * 按钮 / 链接按钮。
 * 视觉全部落在 globals.css 的 `.np-btn` 系列上（BRAND.md §3.3）：
 * 44px 高 · radius 0 · 1px crimson 边 · mono label 档 /500/ls .13em/UPPERCASE。
 * 焦点态由 globals.css 的 :focus-visible 统一给出（2px crimson，offset 3px）。
 */
export function Button({
  children,
  variant = 'alt',
  size = 'md',
  arrow,
  trailing,
  leading,
  fullWidth = false,
  className,
  href,
  external,
  disabled = false,
  type = 'button',
  ...rest
}: ButtonProps) {
  const shape = RESOLVE[variant] ?? 'alt'
  const showArrow = arrow ?? (shape === 'brand' && !trailing)

  const classes = cn(
    'np-btn',
    shape === 'brand' ? 'np-btn--brand' : 'np-btn--alt',
    SIZE[size],
    fullWidth && 'w-full',
    className,
  )

  const inner = (
    <>
      {leading ? (
        <span aria-hidden="true" className="shrink-0">
          {leading}
        </span>
      ) : null}
      <span className="min-w-0 truncate">{children}</span>
      {trailing ? (
        <span aria-hidden="true" className="shrink-0">
          {trailing}
        </span>
      ) : showArrow ? (
        <span aria-hidden="true" className="np-btn__arrow" />
      ) : null}
    </>
  )

  if (href) {
    const isExternal = external ?? /^https?:\/\//.test(href)
    return (
      <a
        // 禁用态不带 href：`.np-btn` 的 disabled 规则已经从 pointer-events:none
        // 换成 cursor:not-allowed（否则光标规则永远命不中），拦截点击改由这里做。
        href={disabled ? undefined : href}
        className={classes}
        {...(isExternal && !disabled
          ? { target: '_blank', rel: 'noreferrer noopener' }
          : null)}
        {...(disabled ? { 'aria-disabled': true, role: 'link', tabIndex: -1 } : null)}
        aria-label={rest['aria-label']}
      >
        {inner}
      </a>
    )
  }

  // D9：没有 href 也没有 onClick → 不渲染，避免死链
  if (!rest.onClick && type === 'button') return null

  return (
    <button type={type} className={classes} disabled={disabled} {...rest}>
      {inner}
    </button>
  )
}

export default Button
