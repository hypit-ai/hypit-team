'use client'

/**
 * S1 · Hero —— 校样封面（CREATIVE.md §0 THE PROOF SHEET / M2 落版）。
 *
 * 设计意图（本轮重做的四件事）：
 *  1. **报头 → 大字 → 刻度尺 → 双栏 → 版权行**，五条横带首尾相接，
 *     富余高度全部灌进「代码条」那一栏（它 `flex-1` 且整条拉伸）。
 *     上一版把高度平摊给留白，中部空出一大片，这一版结构上不再有可空之处。
 *  2. **第二行标题是「被编译出来的」**：一条 2px crimson 扫描线从左扫到右，
 *     字随扫描线后方 clip 揭开（M7 局部重编译的同一套语汇，提前在首屏埋下）。
 *  3. **时间线刻度尺是活的**：等距刻度 + `00:00 / 00:04 …` 时间码，
 *     这是 A1 齿孔栏在 S0–S4 的形态（「时间线还活着，帧是均匀的」）。
 *     滚动时一枚 crimson playhead 沿尺推进 —— 全站唯一一处「时间线还能用」的画面，
 *     后面它会在 S5 当着观众的面散架。
 *  4. **SVML 不是配图，是一段胶片**：代码卡左侧接一条齿孔边条，
 *     行随进场逐行点亮（编译输出的节奏），滚动时以 0.82 速率落后于正文。
 *
 * 动效（M2，[覆盖 BP §S1]：**不 pin、不挂 WebGL**）：
 *  - 标题逐词 `y/blur/opacity`，`.52s / power4.out / stagger .028`；blur 只在桌面。
 *  - warcry 延后 `.35s` 单独进 —— 全站第一处、也是唯一一处 crimson 正文。
 *  - 三层视差：正文 1.0 / 刻度尺 0.92 / 代码条 0.82。
 *  - reduced-motion：不建任何 timeline（因此没有任何 `from` 起始态被写入），
 *    DOM 直接是可读终态；playhead 静止在 0，扫描线不出现。
 *
 * 文案：全部来自 `lib/data/hero.ts` / `code-samples.ts` / `links.ts`。
 * 组件内出现的字符只有排版记号（`·` `[ ]` `00:04` 时间码），不是文案。
 */

import { useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { pad } from '@/lib/utils/format'
import { hero } from '@/lib/data/hero'
import { codeSamples } from '@/lib/data/code-samples'
import { linkById } from '@/lib/data/links'
import { Button } from '@/components/ui/Button'
import { Caret } from '@/components/ui/Caret'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Rule } from '@/components/ui/Rule'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { useLocale } from '@/hooks/useLocale'
import { useSectionTrigger } from '@/components/scroll/useSectionTrigger'
import { setProgress } from '@/lib/store/compile'
import { DUR, EASE_GSAP, MOVE, STAGGER } from '@/lib/motion/tokens'

/** 本 section 结束时的主时钟目标值（蓝图 §1 S1）。 */
const PROGRESS_DESKTOP = 0.22
const PROGRESS_MOBILE = 0.11

/** 排版记号（非文案）。 */
const META_SEP = '·'
const SCROLL_CUE = '[ SCROLL ]'

/**
 * 代码逐行点亮的节拍。22 行 × 0.022 + DUR.base(0.22)，起点 0.78 →
 * 最后一行在 0.78 + 21×0.022 + 0.22 ≈ 1.46s 落定，仍在 HERO_SETTLE_MS(1500) 之内，
 * 整块代码在首屏无需滚动即全亮。样例行数若再增，这两个数要一起复核。
 */
const CODE_LINE_AT = 0.78
const CODE_LINE_STAGGER = 0.022

/** 入场兜底闸：到点无条件把进场时间线推到终态（见下方 settle 注释）。 */
const HERO_SETTLE_MS = 1500

/** 刻度尺：主刻度数 + 每格代表的秒数（剪辑软件那把尺的默认刻度）。 */
const RULER_MAJORS = 8
const RULER_STEP_SECONDS = 4

const sample = codeSamples['hero-svml']
const primaryLink = linkById(hero.primaryCta.linkId)
const secondaryLink = linkById(hero.secondaryCta.linkId)

/** `00:04` —— 由索引推出的时间码，排版记号。 */
function timecode(index: number): string {
  const total = index * RULER_STEP_SECONDS
  return `${pad(Math.floor(total / 60), 2)}:${pad(total % 60, 2)}`
}

const RULER_TICKS = Array.from({ length: RULER_MAJORS + 1 }, (_, i) => ({
  i,
  left: (i / RULER_MAJORS) * 100,
  label: timecode(i),
}))

/** 本组件私有的 keyframes / 背景图案。globals.css 是共享文件，不在这里改。 */
const HERO_CSS = `
.hero-ruler-ticks{
  background-image:
    linear-gradient(to right, var(--color-rule-soft) 1px, transparent 1px),
    linear-gradient(to right, var(--color-rule) 1px, transparent 1px);
  background-repeat: repeat-x, repeat-x;
  background-position: left bottom, left bottom;
  background-size: calc(100% / ${RULER_MAJORS * 5}) 7px, calc(100% / ${RULER_MAJORS}) 13px;
}
.hero-sprocket{
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0 5px,
    var(--color-rule-soft) 5px 6px,
    transparent 6px 15px,
    var(--color-rule-soft) 15px 16px
  );
}
@keyframes heroCue{
  0%{ transform: translateY(0); opacity: 0 }
  18%{ opacity: 1 }
  100%{ transform: translateY(20px); opacity: 0 }
}
.hero-cue-tick{ animation: heroCue 2s linear infinite }
@media (prefers-reduced-motion: reduce){
  .hero-cue-tick{ animation: none; opacity: .55; transform: none }
}
`

/** 把一行标题切成词 span（服务端就切好，零 CLS、可选中、可 SEO）。 */
function HeadlineLine({
  text,
  index,
  children,
  className,
}: {
  text: string
  /** 行序（1 基）—— GSAP 用 `[data-hero-line="2"]` 单独取第二行做扫描线揭示。 */
  index: number
  children?: ReactNode
  className?: string
}) {
  const words = text.split(' ').filter(Boolean)
  return (
    <span data-hero-line={index} className={cn('block', className)}>
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          data-hero-word
          // 注意：不能用 Tailwind 的 `inline-block` —— globals.css 的 `--spacing-block`
          // 会让 Tailwind 同时生成 `.inline-block{inline-size:var(--spacing-block)}`，
          // 把词框压成 72px 导致重叠。改用任意属性写法只设 display。
          className="[display:inline-block] whitespace-pre"
        >
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
      {children}
    </span>
  )
}

export interface HeroProps {
  className?: string
}

export function Hero({ className }: HeroProps) {
  const root = useRef<HTMLElement>(null)
  const { t } = useLocale()

  useSectionTrigger(root, ({ gsap, ScrollTrigger, root: el, reduced, desktop, q, one }) => {
    if (reduced) {
      // 不建任何 from 动画 → DOM 保持可读终态；主时钟直接落到终值。
      setProgress(PROGRESS_DESKTOP)
      return
    }

    const target = desktop ? PROGRESS_DESKTOP : PROGRESS_MOBILE

    const codeLines = q('[data-hero-code-line]')

    /* ── 落版：报头 → 第一行逐词 → 第二行被扫描线编译出来 → 尺 → 双栏 ── */
    const tl = gsap.timeline({ defaults: { ease: EASE_GSAP.outQuart } })

    tl.from(q('[data-hero-head]'), { autoAlpha: 0, duration: DUR.slow }, 0)

    // 第一行：逐词（blur 只在桌面 —— 低端 GPU 逐字 blur 会掉帧）
    tl.from(
      q('[data-hero-line="1"] [data-hero-word]'),
      {
        autoAlpha: 0,
        y: desktop ? MOVE.small : 10,
        ...(desktop ? { filter: 'blur(6px)' } : null),
        duration: 0.52,
        stagger: STAGGER.word,
      },
      0.06,
    )

    // 第二行：2px crimson 扫描线扫过，字在它后方被 clip 揭开（= 被编译出来）
    const l2 = one('[data-hero-line="2"]')
    const sweep = one('[data-hero-sweep]')
    if (l2) {
      tl.fromTo(
        l2,
        { clipPath: 'inset(-20% 100% -20% 0)' },
        { clipPath: 'inset(-20% 0% -20% 0)', duration: 0.72, ease: EASE_GSAP.outExpo },
        0.42,
      )
    }
    if (sweep && l2) {
      tl.fromTo(
        sweep,
        { autoAlpha: 1, x: 0 },
        { x: () => l2.offsetWidth, duration: 0.72, ease: EASE_GSAP.outExpo },
        0.42,
      ).to(sweep, { autoAlpha: 0, duration: 0.18 }, 1.06)
    }

    // 刻度尺：从左展开，时间码随后逐个落位
    tl.from(
      q('[data-hero-ruler]'),
      { scaleX: 0, transformOrigin: 'left center', duration: 0.8, ease: EASE_GSAP.outExpo },
      0.5,
    )
      .from(q('[data-hero-tc]'), { autoAlpha: 0, duration: DUR.base, stagger: 0.035 }, 0.86)
      .from(
        q('[data-hero-fade]'),
        {
          autoAlpha: 0,
          y: desktop ? MOVE.desktop : MOVE.mobile,
          duration: DUR.enter,
          stagger: STAGGER.card,
        },
        0.62,
      )
      // 代码逐行点亮 —— 编译输出的节奏，不是装饰。
      // 写成 fromTo：终值 `autoAlpha: 1` 是显式的，不再依赖「建 timeline 那一刻
      // DOM 上恰好是什么」去反推；`clearProps` 让它播完就把 inline style 交还给 CSS。
      .fromTo(
        codeLines,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: DUR.base,
          stagger: CODE_LINE_STAGGER,
          clearProps: 'opacity,visibility',
        },
        CODE_LINE_AT,
      )
      // warcry：全站第一处 crimson 正文，单独延后进
      .from(
        q('[data-hero-warcry]'),
        { autoAlpha: 0, y: 8, duration: DUR.enter },
        1.05,
      )

    /* ── 首屏兜底：入场必须自己收尾，不许把可读性押在「用户会滚动」上 ──
       代码块自然播完的时刻 = CODE_LINE_AT + stagger×(n-1) + DUR.base ≈ 1.37s，
       本来就在 1.5s 以内。这里再加一道闸，是因为进场 timeline 有太多种被打断的
       方式（matchMedia 重建、ScrollTrigger.refresh、字体回流触发的 revert），
       而 `from`/`fromTo` 的 immediateRender 会先把整块代码写成 opacity:0 ——
       一旦时间线没走完，代码块就永久停在半透明，看起来像坏了。

       兜底用 `window.setTimeout` 而不是 `gsap.delayedCall`：后者跑在 gsap.ticker 上，
       ticker 本身要是被卡住（Lenis 单时钟 + lagSmoothing(0)），兜底会跟着一起卡住，
       等于没有兜底。 */
    let settled = false
    const settle = () => {
      if (settled) return
      settled = true
      if (!el.isConnected) return
      tl.progress(1)
      // 双保险：即便 tl 已被 revert / kill，也把这批节点交还给 CSS 的可读终态
      gsap.set(codeLines, { clearProps: 'opacity,visibility' })
    }
    tl.eventCallback('onComplete', settle)
    // 兜底定时器必须能被收走：断点/动效偏好切换会重建这段 builder，
    // 旧的 timer 若还活着，会在新时间线跑到一半时对同一批节点 set 终态。
    const settleTimer = window.setTimeout(settle, HERO_SETTLE_MS)

    /* ── 三层视差 + playhead：不 pin，只推进 ── */
    const codeEl = one('[data-hero-code]')
    const rulerEl = one('[data-hero-ruler]')
    const playhead = one<HTMLElement>('[data-hero-playhead]')

    const parallax = {
      trigger: el,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      invalidateOnRefresh: true,
    }

    if (codeEl && desktop) {
      // 0.82 速率：代码条落后于正文（正文 1.0）
      gsap.to(codeEl, {
        y: () => window.innerHeight * 0.18,
        ease: EASE_GSAP.scrub,
        scrollTrigger: parallax,
      })
    }
    if (rulerEl && desktop) {
      gsap.to(rulerEl, {
        y: () => window.innerHeight * 0.08,
        ease: EASE_GSAP.scrub,
        scrollTrigger: parallax,
      })
    }

    // playhead：宽度只在 refresh 时量（onUpdate 里绝不读布局）
    let railWidth = 0
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      invalidateOnRefresh: true,
      onRefresh: () => {
        railWidth = rulerEl ? rulerEl.clientWidth : 0
      },
      onUpdate: (self) => {
        setProgress(target * self.progress)
        if (playhead) {
          playhead.style.transform = `translate3d(${railWidth * self.progress}px,0,0)`
        }
      },
    })

    void tl
    void st

    return () => {
      window.clearTimeout(settleTimer)
    }
  })

  return (
    <section
      ref={root}
      id="hero"
      data-section="hero"
      data-sec={pad(1, 2)}
      aria-labelledby="hero-title"
      className={cn('relative isolate w-full overflow-hidden', className)}
    >
      <style>{HERO_CSS}</style>
      <div aria-hidden="true" className="grid-field" />

      <div className="relative z-1 mx-auto flex min-h-dvh w-full max-w-shell flex-col gap-[clamp(18px,3vh,34px)] px-5 pt-24 pb-8 sm:px-8 lg:px-12 lg:pt-28 lg:pb-10">
        {/* ── 报头：eyebrow ──── rule ──── 源文件名 ── */}
        <div data-hero-head className="flex w-full items-center gap-6">
          <Eyebrow variant="dot">{hero.eyebrow}</Eyebrow>
          <Rule tick="none" className="flex-1" />
          <span className="text-muted hidden font-mono text-[length:var(--text-micro)] leading-none tracking-[0.18em] whitespace-nowrap uppercase sm:inline">
            {sample.filename} {META_SEP} {sample.meta}
          </span>
        </div>

        {/* ── 大字落版：左侧 mono 行号是校样的定位记号 ── */}
        <h1
          id="hero-title"
          // 行号列用 rem 定宽：若写 ch，会按 h1 的巨大字号换算，窄屏能吃掉半行标题
          className="text-text-0 text-display grid grid-cols-[1.75rem_minmax(0,1fr)] items-baseline gap-x-3 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-x-5"
        >
          <span
            aria-hidden="true"
            data-hero-head
            className="text-muted font-mono text-[length:var(--text-micro)] leading-none tracking-[0.18em] tabular-nums"
          >
            {pad(1, 2)}
          </span>
          <HeadlineLine index={1} text={t(hero.headline.line1)} />

          <span
            aria-hidden="true"
            data-hero-head
            className="text-crimson font-mono text-[length:var(--text-micro)] leading-none tracking-[0.18em] tabular-nums"
          >
            {pad(2, 2)}
          </span>
          {/* 第二行：扫描线过处，字被「编译」出来 */}
          <span className="relative block">
            <HeadlineLine index={2} text={t(hero.headline.line2)}>
              <Caret className="[display:inline-block] w-auto! text-[0.5em]" />
            </HeadlineLine>
            <span
              aria-hidden="true"
              data-hero-sweep
              className="bg-crimson pointer-events-none absolute top-[-0.12em] bottom-[-0.12em] left-0 w-[2px] opacity-0"
            />
          </span>
        </h1>

        {/* ── 时间线刻度尺：等距、带时间码、可推进 —— 它在 S5 才会散架 ── */}
        <div data-hero-ruler className="relative w-full select-none">
          <div aria-hidden="true" className="hero-ruler-ticks h-[13px] w-full" />
          <div aria-hidden="true" className="bg-rule h-px w-full" />
          <div aria-hidden="true" className="relative mt-1.5 h-[11px] w-full">
            {RULER_TICKS.map((tick) => (
              <span
                key={tick.i}
                data-hero-tc
                className={cn(
                  'text-muted absolute top-0 block font-mono text-[length:var(--text-micro)] leading-none tracking-[0.12em] tabular-nums',
                  // 窄屏刻度减半（每 8 秒一个，首/中/尾都在）。
                  // 9 个 `00:00` 在 375px 上每格只有 ~42px，标签自身就 ~40px，
                  // 会糊成 `00:0000:0400:08…`。减密度而不是缩字号——刻度尺是
                  // 「旧世界的时间线」，字缩了它就不像一把尺了。
                  tick.i % 2 !== 0 ? 'hidden sm:block' : null,
                  tick.i === RULER_TICKS.length - 1 ? '-translate-x-full' : null,
                )}
                style={{ left: `${tick.left}%` }}
              >
                {tick.label}
              </span>
            ))}
          </div>
          {/* playhead（BRAND §4）：2px × 15px crimson 竖条，随滚动沿尺推进 */}
          <span
            aria-hidden="true"
            data-hero-playhead
            className="bg-crimson pointer-events-none absolute top-0 left-0 h-[15px] w-[2px] will-change-transform"
          />
        </div>

        {/* ── 双栏：左论述 / 右胶片。富余高度全部落在这一栏 ── */}
        <div className="grid min-h-0 flex-1 grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
          {/* 左：导语 / warcry / CTA / 滚动提示 */}
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-5">
            <div data-hero-fade className="flex max-w-prose flex-col gap-2">
              <p className="text-lead text-text-1">{t(hero.lead)}</p>
              <p data-hero-warcry className="text-lead">
                <em className="text-crimson not-italic">{t(hero.warcry)}</em>
              </p>
            </div>

            <div data-hero-fade className="flex flex-wrap items-center gap-3">
              {primaryLink?.url ? (
                <Button
                  href={primaryLink.url}
                  external={primaryLink.external}
                  variant="primary"
                  trailing="→"
                >
                  {t(hero.primaryCta.label)}
                </Button>
              ) : null}
              {secondaryLink?.url ? (
                <Button
                  href={secondaryLink.url}
                  external={secondaryLink.external}
                  variant="secondary"
                >
                  {t(hero.secondaryCta.label)}
                </Button>
              ) : null}
            </div>

            {/* 滚动提示：方括号 + 一条 1px 线 + 4px 刻度块（§6，不用弹跳箭头） */}
            <div
              data-hero-fade
              aria-hidden="true"
              className="mt-auto hidden items-end gap-3 pt-6 lg:flex"
            >
              <span className="text-muted font-mono text-[length:var(--text-micro)] leading-none tracking-[0.18em] uppercase">
                {SCROLL_CUE}
              </span>
              <span className="bg-rule relative block h-[26px] w-px">
                <span className="hero-cue-tick bg-crimson absolute top-0 -left-[1.5px] block size-[4px]" />
              </span>
            </div>
          </div>

          {/* 右：真实 SVML 片段 —— 主体视觉是文本本身，左侧接一条齿孔边条 */}
          <div data-hero-code className="flex min-w-0 lg:col-span-7">
            <div className="relative flex min-h-0 w-full pl-5">
              <span
                aria-hidden="true"
                className="hero-sprocket border-rule absolute top-0 bottom-0 left-0 w-5 border-x"
              />
              <CodeBlock
                lines={sample.lines}
                lang={sample.lang}
                filename={sample.filename}
                meta={sample.meta}
                lineAttr="data-hero-code-line"
                maxHeight="clamp(13rem, 48vh, 29rem)"
                className="w-full"
                dense
              />
            </div>
          </div>
        </div>

        {/* ── 版权行：np-rule + mono 元数据 ── */}
        <div data-hero-fade className="flex flex-col gap-2.5">
          <Rule tick="both" />
          {/*
            左内边距 = 齿孔栏让位。SprocketRail 是 `position:fixed; left:0` 的
            clamp(20px,2.2vw,28px) 宽条，且每 5 枚齿孔在 `left:calc(100% + 5px)`
            处挂一枚 9px 时间码标签——两者合计约 5rem（视口左缘起算）。

            补多少 = 5rem − 版心外边距 − 本容器自身的 px，够宽就补 0。
            必须把容器 padding 一起减掉，否则在 1280（外边距为 0、px-12 已经
            让出 48px）会多缩进 ~47px，这一行会明显不齐于它上方那条 Rule。
            768px 以下齿孔标签 `display:none` 且栏只剩 12px，比 px-5/px-8 还窄，
            所以基础态补 0。
          */}
          <ul className="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 pl-0 font-mono text-[length:var(--text-micro)] leading-none tracking-[0.18em] uppercase md:pl-[max(0px,calc(5rem-2rem-max(0px,(100vw-var(--container-shell))/2)))] lg:pl-[max(0px,calc(5rem-3rem-max(0px,(100vw-var(--container-shell))/2)))]">
            {hero.metaLine.map((item, i) => (
              <li key={item} className="flex items-center gap-3">
                {i > 0 ? (
                  <span aria-hidden="true" className="text-rule">
                    {META_SEP}
                  </span>
                ) : null}
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default Hero
