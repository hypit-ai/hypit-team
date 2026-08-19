'use client'

/**
 * S15 · TEAM —— AVERAGE AGE: 20（CREATIVE §2 尾声，强度 2 → 情绪从「人」起步）。
 *
 * 全部文案来自 `lib/data/team.ts`，组件内零硬编码文案：
 * 开场大字由 `hook` 与 `averageAge` 在运行时拆分得到（splitHook），
 * 成员数由 `team.members.length` 推导，因此中英两版共用同一套排版。
 *
 * 形态：名册不做卡片网格，做一张**名录清样**（roster ledger）——
 * 一行一个人，1px rule 分隔，密排等宽；行可展开，展开后才露出履历与创始人评语。
 * 这样首屏读到的是「七个人有多年轻」，展开读到的是「这七个人有多猛」，
 * 层次由交互给出，而不是靠把所有字一次性砸在脸上。
 *
 * 动效：
 * - 进场是**逐行印刷**：只有每行顶部那条 1px 线 scaleX 0→1（origin left），
 *   `stagger .07 from:'start'`（有序，不用 random/center）。行内容一律在位渲染 ——
 *   通用淡入位移全站已删（P0-2）；
 * - `20` count-up 一次（<Counter>），数字下的刻度线在进入视口后 scaleX 生长；
 * - hover：行号左侧探出一道 crimson 短刻度 + 行号转 crimson（每行同时只有这一组反馈）；
 * - 展开：`grid-template-rows 0fr → 1fr` 纯 CSS 过渡，无 JS 测高、无 layout thrash；
 *   展开记号是一个 1px 十字，竖笔 scaleY→0 变成减号。**不做 3D 倾斜、不做位移、无阴影。**
 * - 移动端：单栏、stagger .04、不渲染行首竖线；
 * - reduced-motion：不建任何 tween，DOM 即终态；展开过渡由全局 CSS 归零。
 */

import { useCallback, useMemo, useRef, useState } from 'react'
import { Counter } from '@/components/ui/Counter'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { MonoTag } from '@/components/ui/MonoTag'
import { Rule } from '@/components/ui/Rule'
import { SectionRule } from '@/components/ui/SectionRule'
import { useSectionTrigger } from '@/components/scroll/useSectionTrigger'
import { useInViewOnce } from '@/hooks/useInViewOnce'
import { useLocale } from '@/hooks/useLocale'
import { team, type TeamMember } from '@/lib/data/team'
import { DUR, DUR_MS, EASE_GSAP, STAGGER } from '@/lib/motion/tokens'
import { pad } from '@/lib/utils/format'
import { RHYTHM, TITLE_SCALE } from '@/components/ui/SectionShell'
import { cn } from '@/lib/utils/cn'

export type TeamVariant = 'preview' | 'full'

export interface TeamProps {
  /**
   * `preview`（首页）：默认只展开创始人一行，履历截断 3 条，附 `/team` 入口。
   * `full`（/team 子页）：全部行默认展开，履历与创始人评语全文。
   */
  variant?: TeamVariant
  /** 大字标题的语义层级：子页用 h1，首页用 h2。 */
  headingLevel?: 1 | 2
  /** HUD 用 section 序号，默认 15（首页 S15 · 乐章 V PEOPLE 首段）。 */
  sec?: number
  /** 覆盖 section id（首页锚点为 `team`）。 */
  id?: string
  /** 顶部 border-t。子页首个 section 传 false。 */
  divider?: boolean
  className?: string
}

/** preview 变体下每行最多显示的 highlights 条数。 */
const PREVIEW_HIGHLIGHTS = 3

/** 展开面板的高度过渡：grid-template-rows 0fr→1fr，无需 JS 测高。 */
const CSS = `
[data-roster] [data-panel]{
  display:grid; grid-template-rows:0fr;
  transition:grid-template-rows var(--dur-slow) var(--ease-out-quart),
             opacity var(--dur-mid) var(--ease-out-quart);
  opacity:0;
}
[data-roster] [data-panel][data-open]{ grid-template-rows:1fr; opacity:1; }
[data-roster] [data-panel] > *{ min-height:0; overflow:hidden; }
`

interface HookParts {
  /** 数字之前的部分：`Average age` / `平均年龄`。 */
  label: string
  /** 数字之后、句末标点之前的部分：`` / `岁`。 */
  suffix: string
  /** 第一个句号之后的整句：`As the founder, …` / `我作为 founder …`。 */
  lead: string
}

/**
 * 把 `hook` 按 `averageAge` 这个数字拆成「大字 + 导语」两部分。
 * 纯函数，SSR / CSR 结果一致；数字缺失时整句退化为导语。
 */
export function splitHook(hook: string, value: number): HookParts {
  const token = String(value)
  const at = hook.indexOf(token)
  if (at < 0) return { label: '', suffix: '', lead: hook }

  const label = hook.slice(0, at).trim()
  const rest = hook.slice(at + token.length)
  const stop = rest.search(/[.。！!？?]/)
  if (stop < 0) return { label, suffix: rest.trim(), lead: '' }

  return {
    label,
    suffix: rest.slice(0, stop).trim(),
    lead: rest.slice(stop + 1).trim(),
  }
}

export function Team({
  variant = 'preview',
  headingLevel = 2,
  sec = 15,
  id = 'team',
  divider = true,
  className,
}: TeamProps) {
  const { t } = useLocale()
  const root = useRef<HTMLDivElement>(null)
  const [headlineRef, headlineInView] = useInViewOnce<HTMLElement>({ amount: 0.6 })

  const parts = splitHook(t(team.hook), team.averageAge)
  const founder = team.members[0]
  const founderLabel = founder ? (founder.enName ?? founder.name) : ''
  const founderQuote = founder?.quote ? t(founder.quote) : null
  const Heading = headingLevel === 1 ? 'h1' : 'h2'

  /** full 变体默认全开；preview 只开创始人那一行。 */
  const initialOpen = useMemo(() => {
    const map: Record<string, boolean> = {}
    for (const m of team.members) map[m.id] = variant === 'full' || m.id === founder?.id
    return map
  }, [variant, founder?.id])
  const [open, setOpen] = useState<Record<string, boolean>>(initialOpen)

  const toggle = useCallback((memberId: string) => {
    setOpen((prev) => ({ ...prev, [memberId]: !prev[memberId] }))
  }, [])

  useSectionTrigger(root, ({ gsap, reduced, desktop, q, once }) => {
    if (reduced) return

    const rows = q('[data-team-row]')
    if (rows.length === 0) return
    const rules = q('[data-row-rule]')

    const each = desktop ? STAGGER.card : STAGGER.tight

    // 逐行「印刷」：只落线，不落字（P0-2：正文一律在位渲染）。
    gsap.fromTo(
      rules,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: DUR.mid,
        ease: EASE_GSAP.outExpo,
        stagger: { each, from: 'start' },
        scrollTrigger: once({ start: 'top 76%' }),
      },
    )
  })

  return (
    <section
      id={id}
      data-section={id}
      data-sec={pad(sec, 2)}
      aria-labelledby={`${id}-title`}
      // 乐章 V PEOPLE 的首段：movement 档
      className={cn('relative isolate w-full', RHYTHM.movement, divider && 'border-line border-t', className)}
    >
      {/* 乐章 V「PEOPLE」的入口线：全站五条章节转场之一（P0-4.3） */}
      {divider ? <SectionRule /> : null}

      <style href="nrt-team" precedence="default">
        {CSS}
      </style>

      <div ref={root} className="mx-auto w-full max-w-shell px-5 sm:px-8 lg:px-12">
        {/* ── 开场大字 ─────────────────────────────────────── */}
        <header ref={headlineRef} data-inview={headlineInView || undefined} className="group/hero">
          <Eyebrow variant="dot" rule>
            {team.eyebrow}
          </Eyebrow>

          <Heading
            id={`${id}-title`}
            className={cn(
              'text-ink mt-7 flex flex-wrap items-baseline gap-x-[0.34em] gap-y-2 uppercase',
              TITLE_SCALE.setpiece,
            )}
          >
            {parts.label ? <span>{parts.label}</span> : null}
            <span className="relative inline-flex flex-col">
              <Counter
                value={team.averageAge}
                durationMs={DUR_MS.stage}
                className="text-crimson"
              />
              <span
                aria-hidden="true"
                className={cn(
                  'bg-crimson absolute inset-x-0 -bottom-[0.08em] h-px origin-left scale-x-0',
                  'transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-expo)]',
                  'group-data-[inview]/hero:scale-x-100',
                  // 末端刻度：np-rule 的语汇
                  'after:bg-crimson after:absolute after:-top-[3px] after:right-0 after:h-[3px] after:w-px',
                )}
              />
            </span>
            {parts.suffix ? <span>{parts.suffix}</span> : null}
          </Heading>

          <div className="mt-7 grid gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
            {parts.lead ? (
              <p className="text-text-1 max-w-prose text-[length:var(--text-lead)] leading-[1.7]">
                {parts.lead}
              </p>
            ) : null}

            {/* 创始人自己的那句话 —— 全段最有人味的一处。
                字号停在 lead 档：全站只有 S3 / S11 / S17 三处落大字锤（P0-4.2），
                这里紧挨着上方的 setpiece 大字，再来一记 h2 就是同一屏内连打两拳。 */}
            {founderQuote ? (
              <figure className="border-rule m-0 border-t pt-5">
                <blockquote className="text-ink text-[length:var(--text-lead)] leading-[1.6]">
                  {founderQuote}
                </blockquote>
                <figcaption className="text-muted mt-3 font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] uppercase">
                  {founderLabel}
                </figcaption>
              </figure>
            ) : null}
          </div>
        </header>

        {/* ── 名录清样 ─────────────────────────────────────── */}
        <ol data-roster="" className="mt-block list-none">
          {team.members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              variant={variant}
              founderLabel={founderLabel}
              isFounder={member.id === founder?.id}
              open={Boolean(open[member.id])}
              onToggle={toggle}
              t={t}
            />
          ))}
        </ol>

        <Rule tick="l" className="mt-0" />

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <MonoTag label="ROSTER" value={pad(team.members.length, 2)} />
          <MonoTag label="AVG AGE" value={String(team.averageAge)} tone="accent" />
          {variant === 'preview' ? (
            <MonoTag label="FULL" value="/TEAM" href="/team" tone="default" />
          ) : null}
        </div>
      </div>
    </section>
  )
}

/* ══ 名录行 ═══════════════════════════════════════════════ */

interface MemberRowProps {
  member: TeamMember
  variant: TeamVariant
  /** 创始人署名（用于「创始人评语」归属），来自数据层，不硬编码。 */
  founderLabel: string
  isFounder: boolean
  open: boolean
  onToggle: (id: string) => void
  t: ReturnType<typeof useLocale>['t']
}

function MemberRow({
  member,
  variant,
  founderLabel,
  isFounder,
  open,
  onToggle,
  t,
}: MemberRowProps) {
  const all = t(member.highlights)
  const shown = variant === 'full' ? all : all.slice(0, PREVIEW_HIGHLIGHTS)
  const hidden = all.length - shown.length
  const note = member.founderNote ? t(member.founderNote) : null
  const panelId = `team-${member.id}-panel`

  return (
    <li data-team-row="" className="group/row relative">
      {/* 行首 1px 线：进场时逐行「印」出来 */}
      <span
        aria-hidden="true"
        data-row-rule
        className="bg-rule absolute inset-x-0 top-0 h-px origin-left"
      />

      <div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onToggle(member.id)}
          className={cn(
            'group/btn relative flex w-full min-h-11 cursor-pointer items-baseline gap-4 py-6 text-left',
            'lg:grid lg:grid-cols-[4.5rem_minmax(0,26ch)_minmax(0,1fr)_1.5rem] lg:items-baseline lg:gap-8',
          )}
        >
          {/* 序号 + hover 时探出的 crimson 短刻度 */}
          <span className="relative shrink-0">
            <span
              aria-hidden="true"
              className={cn(
                'bg-crimson absolute top-[0.45em] -left-3 h-px w-2 origin-right scale-x-0',
                'transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
                'group-hover/row:scale-x-100',
              )}
            />
            <span
              className={cn(
                'font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] tabular-nums',
                'transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
                open || isFounder ? 'text-crimson' : 'text-muted',
                'group-hover/row:text-crimson',
              )}
            >
              {member.index}
            </span>
          </span>

          <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-ink text-[length:var(--text-h2)] leading-[1.3] font-bold tracking-[-0.02em]">
              {member.name}
            </span>
            {member.enName ? (
              <span className="text-muted font-mono text-[length:var(--text-eyebrow)] tracking-[0.14em] uppercase">
                {member.enName}
              </span>
            ) : null}
          </span>

          <span className="text-text-1 hidden min-w-0 font-mono text-[length:var(--text-mono)] leading-[1.5] lg:block">
            {t(member.role)}
          </span>

          {/* 展开记号：1px 十字，展开时竖笔收成 0（不是图标字体、不是 emoji） */}
          <span
            aria-hidden="true"
            className="relative ml-auto block size-[11px] shrink-0 self-center lg:ml-0"
          >
            <span className="bg-muted group-hover/row:bg-crimson absolute top-1/2 left-0 h-px w-full transition-colors duration-[var(--dur-base)]" />
            <span
              className={cn(
                'bg-muted group-hover/row:bg-crimson absolute top-0 left-1/2 h-full w-px origin-center',
                'transition-[transform,background-color] duration-[var(--dur-mid)] ease-[var(--ease-out-quart)]',
                open ? 'scale-y-0' : 'scale-y-100',
              )}
            />
          </span>
        </button>

        {/* 展开面板 */}
        <div id={panelId} data-panel="" data-open={open || undefined}>
          <div>
            <div
              className={cn(
                'grid gap-x-8 gap-y-6 pb-8',
                'lg:grid-cols-[4.5rem_minmax(0,1fr)] lg:gap-y-7',
              )}
            >
              <p className="text-muted font-mono text-[length:var(--text-eyebrow)] leading-[1.6] tracking-[0.14em] uppercase lg:col-start-2">
                <span className="lg:hidden">{t(member.role)} · </span>
                {t(member.org)}
              </p>

              <ul className="list-none space-y-3 lg:col-start-2 lg:columns-2 lg:gap-10 lg:space-y-0">
                {shown.map((line) => (
                  <li
                    key={line}
                    className="text-text-1 flex gap-3 text-[length:var(--text-sm)] leading-[1.65] lg:mb-3 lg:break-inside-avoid"
                  >
                    <span aria-hidden="true" className="bg-rule mt-[0.62em] size-[3px] shrink-0" />
                    <span className="min-w-0">{line}</span>
                  </li>
                ))}
              </ul>

              {hidden > 0 ? (
                <p className="lg:col-start-2">
                  <MonoTag label="MORE" value={`+${hidden}`} href="/team" />
                </p>
              ) : null}

              {note ? (
                <figure className="border-crimson m-0 border-l pl-5 lg:col-start-2">
                  <blockquote className="text-ink max-w-prose text-[length:var(--text-body)] leading-[1.75]">
                    {note}
                  </blockquote>
                  <figcaption className="text-muted mt-3 font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] uppercase">
                    {founderLabel}
                  </figcaption>
                </figure>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

export default Team
