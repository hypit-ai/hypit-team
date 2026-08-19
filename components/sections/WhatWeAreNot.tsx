'use client'

/**
 * S13 · WHAT WE ARE NOT —— 四条否定。
 *
 * 编排（CREATIVE §2：本段强度 1，**故意保持静止**，为 S12 与 S14 让位）：
 * 四条否定排成一张校样清样（proof sheet）——三栏账簿式表格，密排等宽，只有 1px 细线。
 * 唯一的动作是校对语汇本身：每条标题上划过一道 crimson **删改线**（校样上「删掉」的记号），
 * 一次性 scaleX 生长，此后全程静止。除此之外本段无任何 scrub、无位移、无视差。
 *
 * 移动端：三栏塌成两栏（编号悬挂 + 内容），删改线保留（纯 transform，成本为零）。
 * reduced-motion：删改线直接以终态出现，不建任何 tween。
 */

import { useRef } from 'react'
import { whatWeAreNot, whatWeAreNotIntro } from '@/lib/data/manifesto'
import { useLocale } from '@/hooks/useLocale'
import { useSectionTrigger } from '@/components/scroll/useSectionTrigger'
import { DUR, EASE_GSAP, STAGGER } from '@/lib/motion/tokens'
import { pad } from '@/lib/utils/format'
import { RHYTHM, TITLE_SCALE } from '@/components/ui/SectionShell'
import { cn } from '@/lib/utils/cn'

export interface WhatWeAreNotProps {
  /** 锚点 id，默认 `not`。 */
  id?: string
  divider?: boolean
  className?: string
}

export function WhatWeAreNot({ id = 'not', divider = true, className }: WhatWeAreNotProps) {
  const root = useRef<HTMLElement>(null)
  const { t } = useLocale()

  useSectionTrigger(root, ({ gsap, root: el, reduced, q, once }) => {
    const strikes = q('[data-strike]')
    if (strikes.length === 0) return

    if (reduced) {
      gsap.set(strikes, { scaleX: 1 })
      return
    }

    // 唯一的动作就是那道删改线。四条否定本身在位渲染，一帧都不淡入。
    gsap.set(strikes, { scaleX: 0 })
    gsap.to(strikes, {
      scaleX: 1,
      duration: DUR.slow,
      ease: EASE_GSAP.outExpo,
      stagger: STAGGER.card,
      scrollTrigger: once({ trigger: el, start: 'top 80%' }),
    })
  })

  return (
    <section
      ref={root}
      id={id}
      data-section={id}
      data-sec="13"
      aria-labelledby={`${id}-title`}
      className={cn(
        'relative isolate w-full',
        RHYTHM.flow,
        divider && 'border-line border-t',
        className,
      )}
    >
      <div className="mx-auto w-full max-w-wide px-5 sm:px-8 lg:px-12">
        <header className="mb-block flex flex-col gap-5">
          <h2
            id={`${id}-title`}
            className={cn('text-ink', TITLE_SCALE.default)}
          >
            {t(whatWeAreNotIntro.title)}
          </h2>
        </header>

        {/* 清样表：编号 / 被划掉的定义 / 说明 */}
        <ol className="border-rule list-none border-t">
          {whatWeAreNot.map((item) => (
            <li
              key={item.n}
              data-negation=""
              className={cn(
                'group/neg border-rule relative grid border-b',
                'grid-cols-[2.75rem_minmax(0,1fr)] gap-x-0 gap-y-3 py-7',
                'lg:grid-cols-[4rem_minmax(0,24ch)_minmax(0,1fr)] lg:gap-x-8 lg:gap-y-0 lg:py-8',
              )}
            >
              {/* 左侧编号 + hover 时探出的 crimson 短刻度 */}
              <span className="relative flex items-start">
                <span
                  aria-hidden="true"
                  className={cn(
                    'bg-crimson absolute top-[0.45em] -left-3 h-px w-2 origin-right scale-x-0',
                    'transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
                    'group-hover/neg:scale-x-100',
                  )}
                />
                <span
                  className={cn(
                    'text-muted font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] tabular-nums',
                    'transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
                    'group-hover/neg:text-crimson',
                  )}
                >
                  {pad(item.n, 2)}
                </span>
              </span>

              {/* 被标注掉的定义：标题下一道 crimson 墨线（A3 语汇，与 S13 同源） */}
              <h3 className="text-ink relative col-start-2 self-start text-[length:var(--text-h2)] leading-[1.35] font-bold tracking-[-0.018em] lg:col-start-2">
                {t(item.title)}
                <span
                  aria-hidden="true"
                  data-strike=""
                  className={cn(
                    'bg-crimson relative mt-3 block h-px w-full origin-left',
                    'after:bg-crimson after:absolute after:-top-[3px] after:right-0 after:h-[3px] after:w-px',
                  )}
                />
              </h3>

              <p className="text-text-1 col-start-2 max-w-prose text-[length:var(--text-body)] leading-[1.7] lg:col-start-3">
                {t(item.body)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default WhatWeAreNot
