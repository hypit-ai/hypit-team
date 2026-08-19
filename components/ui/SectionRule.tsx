'use client'

import { useInViewOnce } from '@/hooks/useInViewOnce'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/lib/utils/cn'

/**
 * 章节转场（CREATIVE.md §6「章节转场」）。
 *
 * section 进入视口时，顶栏的 np-rule 从 `scaleX 0 → 1` 向右展开（.5s / --ease-out-expo），
 * 末端刻度延后 .1s 弹出。**全站唯一的 section 级转场**——克制到只有一条线在动，
 * 这就是给 M4 / M6 / M9 三个招牌时刻让位的留白。
 *
 * - 一次性（`once: true`），不 scrub，不进滚动热路径；只做 transform + opacity。
 * - 纯装饰（`aria-hidden`）。JS 挂掉时它不出现，但 SectionShell 自身的 `border-t`
 *   仍在，版面完整可读——可读性绝不绑定在动效上。
 * - reduced-motion → 直接以终态出现，无生长、无弹出。
 */

const SECTION_RULE_CSS = `
/*
  外层 slot 负责「被观察」：它永远保持满宽 1px 的真实盒子。
  被观察元素绝不能是那条 scaleX(0) 的线本身——零面积的矩形在
  IntersectionObserver 里 ratio 恒为 0，阈值永远不会命中，转场会整站哑火。
*/
.np-sec-rule-slot {
  position: absolute;
  left: 0;
  right: 0;
  top: -1px;
  height: 1px;
  pointer-events: none;
}
.np-sec-rule {
  position: absolute;
  inset: 0;
  background: var(--color-rule);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 500ms var(--ease-out-expo);
}
.np-sec-rule::after {
  content: "";
  position: absolute;
  right: 0;
  top: -4px;
  width: 1px;
  height: 9px;
  background: var(--color-rule);
  opacity: 0;
  transition: opacity 100ms linear 500ms;
}
.np-sec-rule[data-enter="true"] { transform: scaleX(1); }
.np-sec-rule[data-enter="true"]::after { opacity: 1; }
.np-sec-rule[data-instant="true"] {
  transition: none;
  transform: scaleX(1);
}
.np-sec-rule[data-instant="true"]::after { transition: none; opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .np-sec-rule { transition: none; transform: scaleX(1); }
  .np-sec-rule::after { transition: none; opacity: 1; }
}
`

export interface SectionRuleProps {
  className?: string
}

export function SectionRule({ className }: SectionRuleProps) {
  const reduced = useReducedMotion()
  const [ref, inView] = useInViewOnce<HTMLDivElement>({
    amount: 0.01,
    rootMargin: '0px 0px -8% 0px',
    disabled: reduced,
  })

  return (
    <>
      <style href="np-sec-rule" precedence="default">
        {SECTION_RULE_CSS}
      </style>
      <div ref={ref} aria-hidden="true" className={cn('np-sec-rule-slot', className)}>
        <span
          data-enter={inView ? 'true' : 'false'}
          data-instant={reduced ? 'true' : undefined}
          className="np-sec-rule"
        />
      </div>
    </>
  )
}

export default SectionRule
