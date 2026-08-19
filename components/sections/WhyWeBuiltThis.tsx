'use client'

/**
 * S12 · WHY WE BUILT THIS —— Harness 论证。
 *
 * 编排（CREATIVE §2 乐章 IV「论述」，强度 3）：
 * 回到纸面的长文段，唯一的运动是那条等式的**替换**。
 *
 *  - 巨型章节字：`equation.before` 的末词（Harness）以 rule-soft 铺在版心右侧，
 *    随滚动以 0.72 倍速率反向漂（CREATIVE §M8 指定：巨型字反差全站只用于 S8 与 S12）。
 *    文案来自数据层，组件内不硬编码。
 *  - 等式排成一张**校样版**：1px rule 边框（四角裁切角标是视口那件常驻器械的专属
 *    语汇，段内不再手搓一份，P2-10），第二行逐词替换第一行的词，被替换的词底下
 *    长出一条 A3 墨线（1px crimson + 3px 末端刻度）。
 *  - 长文用悬挂式 mono 段号排版（档案表格气质），无进场动画（P0-2）。
 *
 * 移动端：巨型字降号并弱化，不做视差；等式落到 --text-h1 档。
 * reduced-motion：等式直接呈现终态（旧行 .34、新行实、墨线满格），无 tween。
 */

import { useRef } from 'react'
import { equation, equationClosing, why } from '@/lib/data/manifesto'
import { useLocale } from '@/hooks/useLocale'
import { useSectionTrigger } from '@/components/scroll/useSectionTrigger'
import { DUR, EASE_GSAP, STAGGER } from '@/lib/motion/tokens'
import { pad } from '@/lib/utils/format'
import { RHYTHM, TITLE_SCALE } from '@/components/ui/SectionShell'
import { cn } from '@/lib/utils/cn'

export interface WhyWeBuiltThisProps {
  /** 锚点 id，默认 `why`。 */
  id?: string
  /** 顶部分隔线，默认开。 */
  divider?: boolean
  className?: string
}

/** 第二行相对第一行发生替换的下标。 */
const CHANGED = equation.before
  .map((w, i) => (w === equation.after[i] ? -1 : i))
  .filter((i) => i >= 0)

/** 只有最后一个被替换的词上 crimson —— 每屏强调色 ≤2 处。 */
const ACCENT_INDEX = CHANGED[CHANGED.length - 1] ?? -1

/**
 * 巨型章节字取自等式末词（Harness）——它就是本段论证的主语。
 * 纯数据推导，组件内零硬编码文案。
 */
const CHAPTER_WORD = (equation.before[equation.before.length - 1] ?? '').toUpperCase()

export function WhyWeBuiltThis({ id = 'why', divider = true, className }: WhyWeBuiltThisProps) {
  const root = useRef<HTMLElement>(null)
  const { t } = useLocale()
  const paragraphs = t(why.paragraphs)

  useSectionTrigger(root, ({ gsap, root: el, reduced, desktop, q, one, once, scrub }) => {
    const oldWords = q('[data-eq="before"] [data-changed]')
    const newWords = q('[data-eq="after"] [data-changed]')
    const inkRules = q('[data-ink]')
    const chapter = one('[data-chapter-word]')

    if (reduced) {
      gsap.set([...oldWords, ...newWords], { clearProps: 'all' })
      gsap.set(oldWords, { opacity: 0.34 })
      gsap.set(inkRules, { scaleX: 1 })
      return
    }

    // ── 等式：旧词退场 → 新词 snap 弹入 → 墨线在词底生长。只播一次。
    gsap.set(newWords, { opacity: 0, yPercent: 45 })
    gsap.set(inkRules, { scaleX: 0 })
    gsap
      .timeline({ scrollTrigger: once({ trigger: one('[data-equation]') ?? el, start: 'top 72%' }) })
      .to(oldWords, {
        opacity: 0.34,
        duration: DUR.mid,
        ease: EASE_GSAP.outQuart,
        stagger: STAGGER.word,
      })
      .to(
        newWords,
        {
          opacity: 1,
          yPercent: 0,
          duration: DUR.slow,
          ease: EASE_GSAP.outExpo,
          stagger: STAGGER.layer,
        },
        '-=0.12',
      )
      .to(
        inkRules,
        {
          scaleX: 1,
          duration: DUR.mid,
          ease: EASE_GSAP.outExpo,
          stagger: STAGGER.layer,
        },
        '-=0.18',
      )

    // ── 巨型章节字：0.72 倍速率反向漂（桌面独有，纯 transform）
    if (desktop && chapter) {
      gsap.fromTo(
        chapter,
        { yPercent: -14 },
        {
          yPercent: 14,
          ease: 'none',
          scrollTrigger: scrub({ start: 'top bottom', end: 'bottom top' }, 1),
        },
      )
    }
  })

  return (
    <section
      ref={root}
      id={id}
      data-section={id}
      data-sec="12"
      aria-labelledby={`${id}-title`}
      className={cn(
        'relative isolate w-full overflow-hidden',
        RHYTHM.flow,
        divider && 'border-line border-t',
        className,
      )}
    >
      {/* 巨型章节字：纸上的水印，不是装饰贴图 */}
      <span
        aria-hidden="true"
        data-chapter-word
        className={cn(
          'text-rule-soft pointer-events-none absolute -z-1 select-none',
          'top-[18%] -right-[0.12em] leading-[0.82] font-bold tracking-[-0.06em] whitespace-nowrap',
          'text-[clamp(56px,22vw,120px)] opacity-50 lg:text-[clamp(80px,16vw,220px)] lg:opacity-100',
        )}
      >
        {CHAPTER_WORD}
      </span>

      <div className="mx-auto flex w-full max-w-prose flex-col gap-block px-5 sm:px-8">
        <header className="flex flex-col gap-5">
          <h2
            id={`${id}-title`}
            className={cn('text-ink', TITLE_SCALE.default)}
          >
            {t(why.title)}
          </h2>
        </header>

        {/* ── 核心等式：一张校样版（1px 边 + 四角裁切角标）─────── */}
        <figure data-equation="" className="border-rule relative m-0 border px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-3 sm:gap-4">
            <EquationLine words={equation.before} which="before" />
            <EquationLine words={equation.after} which="after" />
          </div>

          <figcaption
            className="border-crimson text-muted mt-7 border-l pl-4 font-mono text-[length:var(--text-eyebrow)] leading-[1.6] tracking-[0.16em] uppercase"
          >
            {t(equationClosing)}
          </figcaption>
        </figure>

        {/* ── 长文：悬挂式 mono 段号 ──────────────────────────── */}
        <div data-prose="" className="flex flex-col gap-7">
          {paragraphs.map((p, i) => (
            <div
              key={i}
              className="grid grid-cols-[2.75rem_1fr] gap-x-0 sm:grid-cols-[3.5rem_1fr]"
            >
              <span
                aria-hidden="true"
                className="text-muted pt-[0.35em] font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] tabular-nums"
              >
                {pad(i + 1, 2)}
              </span>
              <p className="text-text-1 min-w-0 text-[length:var(--text-body)] leading-[1.7]">
                {p}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function EquationLine({ words, which }: { words: string[]; which: 'before' | 'after' }) {
  const isAfter = which === 'after'
  return (
    <p
      data-eq={which}
      className={cn(
        'flex flex-wrap items-baseline gap-x-[0.34em] gap-y-1',
        'text-[length:var(--text-h1)] leading-[1.2] font-bold tracking-[-0.04em] sm:text-[length:var(--text-display)]',
        isAfter ? 'text-ink' : 'text-text-1',
      )}
    >
      {words.map((w, i) => {
        const changed = CHANGED.includes(i)
        const inked = changed && isAfter
        return (
          <span
            key={`${which}-${i}`}
            data-changed={changed ? '' : undefined}
            className={cn(
              'relative inline-block whitespace-nowrap',
              inked && (i === ACCENT_INDEX ? 'text-crimson' : 'text-ink'),
              !changed && isAfter && 'text-muted',
            )}
          >
            {w}
            {inked ? (
              <span
                aria-hidden="true"
                data-ink=""
                className={cn(
                  'bg-crimson absolute -bottom-[0.22em] left-0 h-px w-full origin-left',
                  'after:bg-crimson after:absolute after:-top-[3px] after:right-0 after:h-[3px] after:w-px',
                )}
              />
            ) : null}
          </span>
        )
      })}
    </p>
  )
}

export default WhyWeBuiltThis
