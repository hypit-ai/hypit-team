'use client'

/**
 * S17 · CTA —— 收工（CREATIVE §2 尾声，强度 4；M10 下半）。
 *
 * 文案全部来自 `lib/data/hero.ts`（closingLead / closingCtaLinkIds / metaLine /
 * headline）与 `lib/data/links.ts`。
 *
 * 收尾只落一次锤（P1-5）：S16 以天数收，本段以 hero 的两行回响收。中间不再插
 * 一句 display 口号 —— 两屏之内三次大字等于一次也没有。
 *
 * 落点的两件事：
 * 1. **刻度变成字**。metaLine 的每一个字符上方先立着一根 1px 刻度（等宽字体下
 *    1 字符 = 1ch，刻度与字符共用同一个格子）。滚动推进时刻度逐根塌成 0，
 *    同一个格子里的字符同时浮出——尺子最后一段变成了一行 mono 元信息。
 *    进度用 `power4.in` 重映射（越到最后越快，像 build 收尾），
 *    scrub tween 内部恒 `ease:'none'`。
 * 2. 全站停在 hero 的那一行：`Humans edit video. / Agents compile it.`
 *    第一行落到 muted、第二行留在 ink——用颜色分层完成「人退场、Agent 接管」，
 *    句末一个 crimson 方块光标，说明源码还开着。
 *
 * 本段**不碰 WebGL、不写任何 uniform**（[覆盖 BP]：ribbon 塌缩取消）。
 * 移动端 / reduced-motion：刻度不渲染动画，直接呈现整行元信息与收尾两行。
 */

import { useRef } from 'react'
import { RHYTHM, TITLE_SCALE } from '@/components/ui/SectionShell'
import { cn } from '@/lib/utils/cn'
import { hero } from '@/lib/data/hero'
import { visibleLinks } from '@/lib/data/links'
import { Button } from '@/components/ui/Button'
import { Rule } from '@/components/ui/Rule'
import { SectionRule } from '@/components/ui/SectionRule'
import { useLocale } from '@/hooks/useLocale'
import { useSectionTrigger } from '@/components/scroll/useSectionTrigger'

const ctaLinks = visibleLinks(hero.closingCtaLinkIds)

export interface CtaProps {
  className?: string
}

export function Cta({ className }: CtaProps) {
  const root = useRef<HTMLElement>(null)
  const { t } = useLocale()

  useSectionTrigger(root, ({ gsap, ScrollTrigger, root: el, reduced, desktop, q, one }) => {
    const ticks = q('[data-tick]')
    const chars = q('[data-char]')

    // 静态终态：字在、刻度不在。
    const settle = () => {
      gsap.set(ticks, { opacity: 0, scaleY: 0 })
      gsap.set(chars, { opacity: 1 })
    }

    if (reduced) {
      settle()
      return
    }

    if (!desktop || ticks.length === 0) {
      settle()
      return
    }

    // 刻度 → 字符。paused 时间线 + 手工进度重映射：
    // scrub 内部恒 ease:'none'，"越到最后越快" 由 power4.in 曲线套在 progress 上。
    const collapse = one('[data-collapse-strip]') ?? el
    // 刻度默认 opacity-0（JS 挂掉时页面只剩可读的字），这里才把它们点亮。
    gsap.set(ticks, { opacity: 1, scaleY: 1 })
    const tl = gsap.timeline({ paused: true })
    tl.to(ticks, {
      scaleY: 0,
      opacity: 0,
      ease: 'none',
      duration: 1,
      stagger: { each: 0.012, from: 'start' },
    })
      .to(
        chars,
        { opacity: 1, ease: 'none', duration: 0.7, stagger: { each: 0.012, from: 'start' } },
        0.12,
      )

    gsap.set(chars, { opacity: 0 })
    const ease = gsap.parseEase('power4.in')
    ScrollTrigger.create({
      trigger: collapse,
      start: 'top 88%',
      end: 'bottom 62%',
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => tl.progress(ease(self.progress)),
      onKill: settle,
    })
  })

  return (
    <section
      ref={root}
      id="cta"
      data-section="cta"
      data-sec="17"
      aria-labelledby="cta-title"
      // 尾声：movement 档，与前面四个乐章边界同一个呼吸
      className={cn('border-line relative isolate w-full border-t', RHYTHM.movement, className)}
    >
      {/* 尾声的入口线：全站五条章节转场之一（P0-4.3） */}
      <SectionRule />

      <div className="mx-auto flex w-full max-w-wide flex-col px-5 sm:px-8 lg:px-12">
        <p className="text-text-1 max-w-prose text-[length:var(--text-lead)] leading-[1.7]">
          {t(hero.closingLead)}
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          {ctaLinks.map((link, i) => (
            <Button
              key={link.id}
              href={link.url}
              external={link.external}
              variant={i === 0 ? 'brand' : 'alt'}
            >
              {link.label}
            </Button>
          ))}
        </div>

        {/* ── 刻度塌成字 ─────────────────────────────────── */}
        <div
          data-collapse-strip
          aria-hidden="true"
          className="mt-block flex flex-wrap items-end gap-x-8 gap-y-4"
        >
          {hero.metaLine.map((entry) => (
            <TickWord key={entry} text={entry} />
          ))}
        </div>
        {/* 无障碍/无 JS 兜底：同一行元信息的纯文本副本 */}
        <p className="sr-only">{hero.metaLine.join(' · ')}</p>

        <Rule className="mt-10" />

        {/* ── 落点 ───────────────────────────────────────── */}
        <h2
          id="cta-title"
          className={cn('mt-10', TITLE_SCALE.setpiece)}
        >
          <span className="text-muted block">{t(hero.headline.line1)}</span>
          <span className="text-ink caret block">{t(hero.headline.line2)}</span>
        </h2>
      </div>
    </section>
  )
}

/**
 * 一段元信息：等宽字体下 1 字符 = 1ch，因此刻度与字符可以共用同一个格子。
 * 空格位不立刻度——尺子上因此留出词间的空档。
 */
function TickWord({ text }: { text: string }) {
  return (
    <span className="inline-flex font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0]">
      {Array.from(text).map((ch, i) => (
        <span key={`${ch}-${i}`} className="relative inline-block h-[14px] w-[1ch]">
          {ch === ' ' ? null : (
            <span
              data-tick
              className="bg-rule absolute bottom-0 left-1/2 h-[10px] w-px origin-bottom opacity-0"
            />
          )}
          <span data-char className="text-muted absolute inset-0 text-center">
            {ch === ' ' ? ' ' : ch}
          </span>
        </span>
      ))}
    </span>
  )
}

export default Cta
