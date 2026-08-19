import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * 正文内链（CREATIVE.md §6「链接」）。
 *
 * 下划线是一条 1px crimson 墨线，从左推入（`background-size: 0 1px → 100% 1px`），
 * `.22s cubic-bezier(.22,1,.36,1)`。**不位移、不变粗、不加阴影、不换字色。**
 *
 * - 常态即带一条极浅的底线（`--color-rule`），保证「这是链接」在无 hover 时也成立，
 *   同时满足对比度：颜色不是唯一的可辨识信号。
 * - `href` 为 null / undefined → **不渲染**（D9：禁止死链），与 Button 同约定。
 * - 外链自动 `target=_blank` + `rel`，并给光标层一个域名标签（Crosshair 自行派生）。
 * - 文案由调用方从 lib/data 传入。
 *
 * 无 hooks，可作 RSC；样式经 React 19 的 `<style precedence>` 去重，只注入一次。
 */

export const INK_LINK_CLASS = 'np-ink-link'

const INK_LINK_CSS = `
.np-ink-link {
  color: inherit;
  text-decoration: none;
  background-image:
    linear-gradient(var(--color-crimson), var(--color-crimson)),
    linear-gradient(var(--color-rule), var(--color-rule));
  background-repeat: no-repeat;
  background-position: 0 100%, 0 100%;
  background-size: 0 1px, 100% 1px;
  padding-bottom: 0.12em;
  transition:
    background-size var(--dur-base) var(--ease-out-quart),
    color var(--dur-base) var(--ease-out-quart);
}
.np-ink-link:hover,
.np-ink-link:focus-visible {
  color: var(--color-crimson);
  background-size: 100% 1px, 100% 1px;
}
.np-ink-link:active {
  color: var(--color-crimson-deep);
}
@media (prefers-reduced-motion: reduce) {
  .np-ink-link { transition-duration: var(--dur-instant); }
}
`

export interface InkLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'> {
  children: ReactNode
  /** 目标地址；null / undefined → 不渲染（D9）。 */
  href?: string | null
  /** 外链；省略时按 `https?://` 自动判定。 */
  external?: boolean
  className?: string
}

export function InkLink({ children, href, external, className, ...rest }: InkLinkProps) {
  if (!href) return null
  const isExternal = external ?? /^https?:\/\//i.test(href)

  return (
    <>
      <style href="np-ink-link" precedence="default">
        {INK_LINK_CSS}
      </style>
      <a
        href={href}
        className={cn(INK_LINK_CLASS, className)}
        {...(isExternal ? { target: '_blank', rel: 'noreferrer noopener' } : null)}
        {...rest}
      >
        {children}
      </a>
    </>
  )
}

export default InkLink
