'use client'

/**
 * S6 · LOCAL RECOMPILE —— 招牌镜头 #2 后半（CREATIVE §3 招牌 #2 / §4 M7）。
 *
 * 「改一个词 → 只有那一段变脏重编译，其余纹丝不动。」
 *
 * 镜头语言（全站最该被截图的 5 秒）：
 *   一句台词横向铺开，每个词下面挂着它自己那一格**校样**（帧格 + 曝光条）。
 *   词上方是从 S5 散架下来的那把尺——刻度不再等距，间距由词长调制。
 *   换词的瞬间：旧词吹散 → 新词弹入 → **只有那一格**从中线向两侧扫开重绘，
 *   两条 2px crimson 扫描头骑在裁切边上向外走；其余格子 transform 一像素不动，
 *   连它们的 record id 都逐字符不变——那串没变的 id 就是「复用」的收据。
 *
 * 铁律（CREATIVE §4 M7 / §7）：
 * - **不 scrub**：打击感来自固定节奏。onEnter 播固定 timeline，onLeaveBack 复位。
 * - **[覆盖 BP §S6] 本段不碰 WebGL**，纯 DOM/CSS，零 uniform 依赖。
 * - 任何整体位移都算实现错误：未受影响的格子不进任何 timeline。
 * - 文案全部来自 `lib/data/recompile-demo.ts`；本文件只有纯记号
 *   （`0x01` 序号、`Δ`/`✓`、`bld_` 前缀、`.svml` 扩展名）。
 * - 桌面 1.35s / 移动 0.9s / reduced-motion 180ms crossfade。
 */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { Rule } from '@/components/ui/Rule'
import { SectionShell } from '@/components/ui/SectionShell'
import { gsap, useGSAP } from '@/components/scroll/gsap'
import { useSectionTrigger } from '@/components/scroll/useSectionTrigger'
import { useLocale } from '@/hooks/useLocale'
import { useMediaQuery, mq } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { recompileDemo } from '@/lib/data/recompile-demo'
import { DUR, EASE_GSAP, MOVE, STAGGER } from '@/lib/motion/tokens'
import { cn } from '@/lib/utils/cn'
import { hexIndex } from '@/lib/utils/format'

/* ── 纯记号（非文案）───────────────────────────────────────────
   `Δ` = 该 Operation 被重编译；`✓` = 复用的 Candidate 原样返回。
   `bld_` 与 S7 依赖图里的 Build id 同族，无语言依赖，中英站共用。 */
const GLYPH_DIRTY = 'Δ'
const GLYPH_REUSED = '✓'
const ID_PREFIX = 'bld_'
const SOURCE_NAME = 'main.svml'
const HEX_CHARS = '0123456789abcdef'

/** 每格校样里的曝光条数量（固定，绝不测量 DOM）。 */
const BAR_COUNT = 10

/** 舞台每格的状态。 */
type CellPhase = 'idle' | 'dirty' | 'built'

const { title, lead, sentenceBefore, swapIndex, chips, hud, reuseNote, quote } =
  recompileDemo

/** 进入视口时自动打出的那一击（观众不点也能看到招牌镜头）。 */
const AUTO_TARGET = Math.min(1, chips.length - 1)

/* ═══ 确定性派生：词 → 校样 / record id ══════════════════════
   同一个词永远得到同一张校样与同一个 id（SSR 与 CSR 完全一致，
   零 hydration 抖动）；换了词才会变——这正是「只有那一段变脏」
   在数据层面的证据。 */

function fnv1a(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function nextSeed(seed: number, salt: number): number {
  return (Math.imul(seed ^ (salt + 0x9e3779b9), 0x01000193) >>> 0)
}

/** 一格校样的曝光条高度（0.18–0.98）。 */
function frameBars(word: string): number[] {
  let h = fnv1a(word)
  const bars: number[] = []
  for (let i = 0; i < BAR_COUNT; i += 1) {
    h = nextSeed(h, i + 1)
    bars.push(0.18 + ((h >>> 9) % 1000) / 1000 * 0.8)
  }
  return bars
}

/** 该格产物的 Record id：`bld_` + 6 位十六进制。 */
function recordId(word: string, index: number): string {
  const h = fnv1a(`${index}/${word}`)
  return ID_PREFIX + h.toString(16).padStart(8, '0').slice(0, 6)
}

/* ── HUD 模板拆分 ────────────────────────────────────────────
   `recompile: {lines} line`
   → 文本段 + 可动画的数字槽。模板本身来自 lib/data，此处只做结构化。 */
type HudKey = 'lines'
interface HudPart {
  text: string
  key?: HudKey
}

const HUD_TOKEN = /(\{lines\})/

function splitHudTemplate(template: string): HudPart[] {
  return template
    .split(HUD_TOKEN)
    .filter((chunk) => chunk.length > 0)
    .map<HudPart>((chunk) => {
      const match = /^\{(lines)\}$/.exec(chunk)
      return match ? { text: '', key: match[1] as HudKey } : { text: chunk }
    })
}

/** 数字槽格式：lines 是整数行数。 */
function formatHud(_key: HudKey, value: number): string {
  return value.toFixed(0)
}

/** SSR 首帧即渲染终值（无 JS 也正确，count-up 只是增强）。 */
const HUD_INITIAL: Record<HudKey, string> = {
  lines: formatHud('lines', hud.lines),
}

function writeHudInto(scope: HTMLElement, counters: Record<HudKey, number>): void {
  for (const key of ['lines'] as const) {
    const el = scope.querySelector<HTMLElement>(`[data-hud="${key}"]`)
    if (el) el.textContent = formatHud(key, counters[key])
  }
}

/** 被替换的词落在源码的第几行（1 基）。 */
const DIRTY_LINE = 3
const HIGHLIGHTED_LINES: readonly number[] = [DIRTY_LINE]

/**
 * 由数据拼出这段源码。SVML 里 Segment 名是作者自定义标识符
 * （见 code-samples 的 `<hook>` / `<meeting>` / `<evidence>`），
 * 所以这里的标签名取自 chip / demo 的既有标识符，不新增文案。
 */
function buildSource(words: readonly string[]): string {
  return [
    '<script id="review">',
    '  <verdict>',
    `    <HOST> ${words.join(' ')}`,
    '  </verdict>',
    '</script>',
  ].join('\n')
}

/* ═══ 校样格（纯展示，零状态）════════════════════════════════ */

function FrameStrip({ word }: { word: string }) {
  const bars = useMemo(() => frameBars(word), [word])
  return (
    <span aria-hidden="true" className="absolute inset-0 flex items-end gap-px px-px">
      {bars.map((h, i) => (
        <span
          key={i}
          className="block flex-1"
          style={{
            height: `${(h * 100).toFixed(1)}%`,
            background: 'color-mix(in oklab, var(--color-text-0) 22%, transparent)',
          }}
        />
      ))}
    </span>
  )
}

/** 帧格纹理（恒定层：复用格子永远不动，连纹理都不重绘）。 */
const FRAME_RULING: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(to right, color-mix(in oklab, var(--color-line-strong) 90%, transparent) 0 1px, transparent 1px 8px)',
}

export function LocalRecompile() {
  const { t } = useLocale()
  const root = useRef<HTMLDivElement>(null)

  const reduced = useReducedMotion()
  const desktop = useMediaQuery(mq.lg)

  const [activeIndex, setActiveIndex] = useState(0)
  /** layer A（底层）当前渲染的那个词——重绘扫过之后才追平 activeIndex。 */
  const [prevIndex, setPrevIndex] = useState(0)
  const [phase, setPhase] = useState<CellPhase>('idle')

  /** 供 GSAP 回调读取的最新值（避免闭包过期，且不触发重建）。 */
  const activeRef = useRef(0)
  const reducedRef = useRef(reduced)
  const desktopRef = useRef(desktop)
  // 渲染期不写 ref（react-hooks/refs）：提交后同步即可——
  // 读它的只有 GSAP 回调，回调永远在提交之后才可能触发。
  useEffect(() => {
    reducedRef.current = reduced
    desktopRef.current = desktop
  }, [reduced, desktop])

  const activeChip = chips[activeIndex] ?? chips[0]
  const activeWord = t(activeChip.word)
  const prevWord = t((chips[prevIndex] ?? chips[0]).word)

  /** 当前句子（把 swapIndex 处换成当前 chip 的词）。 */
  const sentence = useMemo(() => {
    const next = [...sentenceBefore]
    next[swapIndex] = activeWord
    return next
  }, [activeWord])

  const sourceCode = useMemo(() => buildSource(sentence), [sentence])

  /** 换词槽的宽度由最长候选词撑住，避免替换时整行抖动（CLS = 0）。 */
  const widestWord = useMemo(
    () => chips.reduce((a, c) => (t(c.word).length > a.length ? t(c.word) : a), ''),
    [t],
  )

  const hudParts = useMemo(() => splitHudTemplate(hud.template), [])

  /* ═══ 换词：受控重编译 timeline ═════════════════════════════ */

  const { contextSafe } = useGSAP({ scope: root })
  const swapTlRef = useRef<ReturnType<typeof gsap.timeline> | null>(null)

  // contextSafe 只是把回调登记进 gsap.context，不在渲染期执行；
  // 回调体读 ref 属于事件/动画阶段，这里的规则告警是误报。
  // eslint-disable-next-line react-hooks/refs
  const playSwap = contextSafe((next: number) => {
    const rootEl = root.current
    if (!rootEl) return
    if (next === activeRef.current) return
    if (!chips[next]) return

    const from = activeRef.current
    activeRef.current = next

    swapTlRef.current?.kill()

    const isReduced = reducedRef.current
    const isDesktop = desktopRef.current
    // CREATIVE §4 M7：桌面 1.35s / 移动 0.9s / reduced-motion 180ms
    const beat = isReduced ? 0.18 : isDesktop ? DUR.epic : DUR.stage
    /** 重绘扫描行程：桌面 .42s（M7 明确值），移动端等比压到 .28s。 */
    const sweep = isDesktop ? 0.42 : 0.28

    const outWord = rootEl.querySelector<HTMLElement>(`[data-word-slot="${from}"]`)
    const inWord = rootEl.querySelector<HTMLElement>(`[data-word-slot="${next}"]`)
    const rebuild = rootEl.querySelector<HTMLElement>('[data-rebuild]')
    const scanL = rootEl.querySelector<HTMLElement>('[data-scan="l"]')
    const scanR = rootEl.querySelector<HTMLElement>('[data-scan="r"]')
    const tint = rootEl.querySelector<HTMLElement>('[data-tint]')
    const record = rootEl.querySelector<HTMLElement>(`[data-record="${swapIndex}"]`)

    // React 侧受控：源码改行、该行标脏、layer B 换成新词
    setActiveIndex(next)
    setPhase('dirty')

    const nextWord = t(chips[next].word)
    const nextId = recordId(nextWord, swapIndex)

    const counters = { lines: 0 }
    const writeHud = () => writeHudInto(rootEl, counters)

    const tl = gsap.timeline({
      onComplete: () => {
        setPhase('built')
        // layer A 追平 layer B —— 之后这一格重新变成「不动的复用格」
        setPrevIndex(next)
        gsap.set([rebuild, scanL, scanR].filter(Boolean) as HTMLElement[], {
          willChange: 'auto',
        })
        if (rebuild) gsap.set(rebuild, { clearProps: 'clipPath' })
      },
    })
    swapTlRef.current = tl

    /* ── 1 · 词替换（overshoot 白名单：S6 词替换）───────────── */
    if (outWord) {
      tl.to(
        outWord,
        isReduced
          ? { opacity: 0, duration: 0.18, ease: EASE_GSAP.linear }
          : {
              opacity: 0,
              y: -6,
              // 逐字 blur 在移动端禁用（§7.2），单词整体 blur 只在桌面开
              filter: isDesktop ? 'blur(4px)' : 'blur(0px)',
              duration: 0.16,
              ease: EASE_GSAP.inQuart,
            },
        0,
      )
    }
    if (inWord) {
      tl.fromTo(
        inWord,
        isReduced ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(0px)' },
        isReduced
          ? { opacity: 1, duration: 0.18, ease: EASE_GSAP.linear }
          : { opacity: 1, y: 0, duration: 0.28, ease: EASE_GSAP.snapMoment },
        isReduced ? 0 : 0.12,
      )
    }

    /* ── 2 · 只有这一格重绘：从中线向两侧扫开 ────────────────
       未受影响的格子完全不进 timeline —— 这是全部的说服力所在。 */
    if (rebuild) {
      if (isReduced) {
        gsap.set(rebuild, { clearProps: 'clipPath' })
      } else {
        // 立刻收拢到中线：React 把新校样渲进 layer B 之前就先夹住，
        // 否则新画面会在扫描开始前抢跑 140ms（剧透）。
        gsap.set(rebuild, { clipPath: 'inset(0% 50% 0% 50%)', willChange: 'clip-path' })
        tl.fromTo(
          rebuild,
          { clipPath: 'inset(0% 50% 0% 50%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: sweep, ease: EASE_GSAP.outExpo },
          DUR.fast,
        )
      }
    }
    if (!isReduced && scanL && scanR) {
      // 扫描头骑在裁切边上：wrapper 宽 = 格宽，xPercent ±50 即中线
      gsap.set([scanL, scanR], { willChange: 'transform' })
      tl.fromTo(
        scanL,
        { xPercent: 50, opacity: 0 },
        { xPercent: 0, opacity: 1, duration: sweep, ease: EASE_GSAP.outExpo },
        DUR.fast,
      )
        .fromTo(
          scanR,
          { xPercent: -50, opacity: 0 },
          { xPercent: 0, opacity: 1, duration: sweep, ease: EASE_GSAP.outExpo },
          DUR.fast,
        )
        .to([scanL, scanR], { opacity: 0, duration: DUR.base, ease: EASE_GSAP.inQuart }, '>-0.06')
    }

    /* ── 3 · 脏区底色：一闪即收（reduced-motion 唯一保留的提示）─ */
    if (tint) {
      tl.fromTo(
        tint,
        { opacity: 0 },
        { opacity: 1, duration: isReduced ? 0.06 : DUR.instant, ease: EASE_GSAP.linear },
        0,
      ).to(
        tint,
        {
          opacity: 0,
          duration: isReduced ? 0.16 : DUR.slow,
          ease: EASE_GSAP.outCubic,
        },
        isReduced ? 0.06 : beat * 0.55,
      )
    }

    /* ── 4 · Record id：只有这一格的 id 会翻位 ────────────────
       其余格子的 id 逐字符不变，那是「复用」的收据。 */
    if (record) {
      if (isReduced) {
        record.textContent = nextId
      } else {
        const scramble = { p: 0 }
        tl.to(
          scramble,
          {
            p: 1,
            duration: sweep,
            ease: EASE_GSAP.outCubic,
            onUpdate: () => {
              const body = nextId.slice(ID_PREFIX.length)
              const solved = Math.round(scramble.p * body.length)
              let out = ID_PREFIX
              for (let i = 0; i < body.length; i += 1) {
                out +=
                  i < solved
                    ? body[i]
                    : HEX_CHARS[(Math.random() * HEX_CHARS.length) | 0]
              }
              record.textContent = out
            },
            onComplete: () => {
              record.textContent = nextId
            },
          },
          DUR.fast,
        )
      }
    }

    /* ── 5 · HUD 数字。移动端 / reduced-motion 一次性写入。 ──── */
    if (isReduced || !isDesktop) {
      counters.lines = hud.lines
      writeHud()
      // 保证 timeline 至少跑满一个节拍，onComplete 的收束才有呼吸感
      tl.to({}, { duration: beat }, 0)
    } else {
      tl.to(
        counters,
        {
          lines: hud.lines,
          duration: Math.min(0.9, beat * 0.72),
          ease: EASE_GSAP.outExpo,
          onUpdate: writeHud,
        },
        DUR.fast,
      )
      tl.to({}, { duration: beat }, 0)
    }
  })

  /** 供 ScrollTrigger 回调读取的最新 playSwap（不进 deps，不重建 trigger）。 */
  const playRef = useRef(playSwap)
  useEffect(() => {
    playRef.current = playSwap
  }, [playSwap])

  const resetRef = useRef(() => {})
  const doReset = useCallback(() => {
    swapTlRef.current?.kill()
    swapTlRef.current = null
    activeRef.current = 0
    setActiveIndex(0)
    setPrevIndex(0)
    setPhase('idle')
    const rootEl = root.current
    if (!rootEl) return
    const rebuild = rootEl.querySelector<HTMLElement>('[data-rebuild]')
    if (rebuild) gsap.set(rebuild, { clearProps: 'clipPath,willChange' })
    const scans = Array.from(rootEl.querySelectorAll<HTMLElement>('[data-scan]'))
    if (scans.length) gsap.set(scans, { opacity: 0, xPercent: 0, willChange: 'auto' })
    const tint = rootEl.querySelector<HTMLElement>('[data-tint]')
    if (tint) gsap.set(tint, { opacity: 0 })
  }, [])
  useEffect(() => {
    resetRef.current = doReset
  }, [doReset])

  /* ═══ 进场：固定 timeline，不 scrub，末尾自动打出那一击 ═════ */
  useSectionTrigger(root, (ctx) => {
    const cells = ctx.q('[data-cell]')
    const bands = ctx.q('[data-band]')
    const rails = ctx.q('[data-rail]')
    if (!cells.length) return

    const fire = () => playRef.current(AUTO_TARGET)

    if (ctx.reduced) {
      ctx.gsap.set([...cells, ...bands, ...rails], { opacity: 1, y: 0, scaleY: 1, scaleX: 1 })
      ctx.ScrollTrigger.create({
        trigger: ctx.root,
        start: 'top 55%',
        once: true,
        onEnter: fire,
      })
      return
    }

    const move = ctx.desktop ? MOVE.small : MOVE.mobile / 2
    const tl = ctx.gsap.timeline({
      paused: true,
      defaults: { ease: EASE_GSAP.outQuart },
    })

    tl.fromTo(
      rails,
      { scaleX: 0, opacity: 0 },
      {
        scaleX: 1,
        opacity: 1,
        duration: DUR.slow,
        stagger: STAGGER.tight,
        transformOrigin: 'left center',
      },
      0,
    )
      .fromTo(
        cells,
        { opacity: 0, y: move },
        { opacity: 1, y: 0, duration: DUR.enter, stagger: STAGGER.tight },
        0.06,
      )
      .fromTo(
        bands,
        { scaleY: 0.06, opacity: 0 },
        {
          scaleY: 1,
          opacity: 1,
          duration: DUR.slow,
          stagger: STAGGER.tight,
          transformOrigin: 'bottom center',
        },
        0.1,
      )
      // 让观众先把这句话读完（呼吸），再打那一击
      .call(fire, undefined, '+=0.55')

    ctx.ScrollTrigger.create({
      trigger: ctx.root,
      start: 'top 55%',
      onEnter: () => tl.play(),
      onEnterBack: () => tl.play(),
      // 回滚出视口 → 复位，重新进入时打击感一致（CREATIVE §4 M7）
      onLeaveBack: () => {
        tl.progress(0).pause()
        resetRef.current()
      },
    })
  })

  const onChipClick = useCallback(
    (index: number) => {
      playRef.current(index)
    },
    [],
  )

  return (
    <div ref={root}>
      <SectionShell
        id="recompile"
        sec={6}
        hudAccent
        // P0-3 招牌镜头：无分隔线、full-bleed、setpiece 节奏。
        // 标题降成校样台顶上的图注，镜头自己占满视口宽度。
        width="full"
        divider={false}
        rhythm="setpiece"
        labelledById="recompile-title"
        containerClassName="px-0"
        grid
      >
        <div className="mx-auto mb-8 w-full max-w-shell px-5 sm:px-8 lg:px-12">
          <h2
            id="recompile-title"
            className="text-text-2 font-mono text-[length:var(--text-eyebrow)] leading-[1.9] tracking-[0.16em] uppercase"
          >
            {t(title)}
          </h2>
          <p className="text-text-1 mt-4 max-w-prose text-[length:var(--text-lead)] leading-[1.6]">
            {t(lead)}
          </p>
        </div>

        {/* ═══ 舞台：一句台词 + 与词逐格对齐的校样 ═══════════════ */}
        <div
          data-stage
          className="border-line bg-bg-1 relative mx-auto w-full max-w-[min(100%,88rem)] border-y sm:border-x"
        >
          {/* 顶栏：源码名 + HUD 读数 */}
          <div className="border-line flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-3 py-2 sm:px-4">
            <span className="font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] text-text-2 uppercase">
              {hexIndex(swapIndex + 1)}
              <span className="text-line-strong px-2">/</span>
              {SOURCE_NAME}
            </span>
            <p
              data-hud-line
              className={cn(
                'font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.08em] tabular-nums',
                'transition-colors duration-[var(--dur-base)]',
                phase === 'dirty' ? 'text-crimson' : 'text-text-2',
              )}
            >
              {hudParts.map((part, i) =>
                part.key ? (
                  <span key={i} data-hud={part.key}>
                    {HUD_INITIAL[part.key]}
                  </span>
                ) : (
                  <span key={i}>{part.text}</span>
                ),
              )}
            </p>
          </div>

          <div className="px-3 py-6 sm:px-4 sm:py-8">
            <p className="sr-only" aria-live="polite">
              {sentence.join(' ')}
            </p>

            <div
              aria-hidden="true"
              className="flex flex-wrap items-end gap-x-3 gap-y-8 sm:gap-x-4"
            >
              {sentence.map((word, i) => {
                const isSwap = i === swapIndex
                const cellPhase: CellPhase = isSwap ? phase : 'idle'
                const marked = isSwap && phase !== 'idle'
                return (
                  <div
                    key={i}
                    data-cell={i}
                    data-swap={isSwap || undefined}
                    data-phase={cellPhase}
                    className="flex min-w-[4.5rem] flex-auto flex-col gap-2 sm:min-w-[5.5rem]"
                  >
                    {/* 散架的尺：刻度间距由词长调制（A1 齿孔栏在 S5–S6 的形态）*/}
                    <span
                      data-rail={i}
                      aria-hidden="true"
                      className={cn(
                        'block h-2.5 origin-left',
                        'transition-colors duration-[var(--dur-mid)]',
                      )}
                      style={
                        {
                          '--tick-gap': `${(6 + word.length * 1.2).toFixed(1)}px`,
                          // 换词那一格靠**形态**区分（刻度打满高度），不靠第二种颜色
                          backgroundImage:
                            'repeating-linear-gradient(to right, color-mix(in oklab, var(--color-line-strong) 90%, transparent) 0 1px, transparent 1px var(--tick-gap))',
                          backgroundSize: `100% ${isSwap ? '100%' : '55%'}`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPositionY: 'bottom',
                        } as CSSProperties
                      }
                    />

                    {/* 序号 + 状态记号 */}
                    <span className="font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.12em] flex items-center justify-between gap-2 text-text-2">
                      <span
                        className={cn(
                          'transition-colors duration-[var(--dur-base)]',
                          marked && phase === 'dirty' && 'text-crimson',
                          marked && phase === 'built' && 'text-text-1',
                        )}
                      >
                        {hexIndex(i + 1)}
                      </span>
                      <span
                        className={cn(
                          'transition-colors duration-[var(--dur-base)]',
                          marked && phase === 'dirty' && 'text-crimson',
                          marked && phase === 'built' && 'text-text-1',
                        )}
                      >
                        {marked ? GLYPH_DIRTY : GLYPH_REUSED}
                      </span>
                    </span>

                    {/* 词 */}
                    <span
                      className={cn(
                        'text-[length:var(--text-lead)] lg:text-[length:var(--text-h3)] leading-[1.2] text-text-0',
                        isSwap && 'relative inline-block',
                      )}
                    >
                      {isSwap ? (
                        <>
                          {/* 宽度撑子：取最长候选词，替换时零布局抖动 */}
                          <span className="invisible whitespace-pre">{widestWord}</span>
                          {chips.map((chip, ci) => (
                            <span
                              key={chip.id}
                              data-word-slot={ci}
                              className={cn(
                                'absolute inset-0 whitespace-pre text-text-0',
                                ci !== activeIndex && 'opacity-0',
                              )}
                            >
                              {t(chip.word)}
                            </span>
                          ))}
                          <span
                            aria-hidden="true"
                            className="bg-crimson absolute -bottom-1 left-0 h-px w-full"
                          />
                        </>
                      ) : (
                        word
                      )}
                    </span>

                    {/* 校样格：这一格对应的画面区间 */}
                    <span
                      data-band={i}
                      className={cn(
                        'relative block h-14 overflow-hidden border sm:h-20',
                        'transition-colors duration-[var(--dur-mid)] ease-[var(--ease-out-expo)]',
                        'bg-bg-2',
                        marked && phase === 'dirty'
                          ? 'border-crimson'
                          : marked
                            ? 'border-line-strong'
                            : 'border-line',
                      )}
                    >
                      {isSwap ? (
                        <>
                          {/* layer A：上一版校样（只有它下面那层扫开时才被盖住）*/}
                          <FrameStrip word={prevWord} />
                          {/* layer B：新校样，从中线向两侧扫开重绘 */}
                          <span
                            data-rebuild
                            aria-hidden="true"
                            className="bg-bg-2 absolute inset-0"
                          >
                            <FrameStrip word={activeWord} />
                          </span>
                          {/* 扫描头：2px crimson 竖线，骑在裁切边上向外走 */}
                          <span
                            data-scan="l"
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 left-0 w-full opacity-0"
                          >
                            {/* 移动端 3px（细线在小屏看不见），桌面 2px */}
                            <span className="bg-crimson absolute inset-y-0 left-0 w-[3px] sm:w-0.5" />
                          </span>
                          <span
                            data-scan="r"
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 left-0 w-full opacity-0"
                          >
                            <span className="bg-crimson absolute inset-y-0 right-0 w-[3px] sm:w-0.5" />
                          </span>
                          {/* 脏区底色 */}
                          <span
                            data-tint
                            aria-hidden="true"
                            className="bg-crimson-soft absolute inset-0 opacity-0"
                          />
                        </>
                      ) : (
                        <FrameStrip word={word} />
                      )}
                      {/* 帧格纹理：恒定层，永远压在最上面 */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        style={FRAME_RULING}
                      />
                    </span>

                    {/* Record id：没变的那些 id 就是「复用」的收据 */}
                    <span
                      data-record={i}
                      className={cn(
                        'font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.04em] tabular-nums',
                        'transition-colors duration-[var(--dur-base)]',
                        marked && phase === 'dirty' ? 'text-crimson' : 'text-text-2',
                      )}
                    >
                      {/* 换词格渲染的是**上一版** id：GSAP 负责把它翻位到新 id，
                          layer A 追平后 React 再接管，两边永远一致，不会抢跑。 */}
                      {recordId(isSwap ? prevWord : word, i)}
                    </span>
                  </div>
                )
              })}
            </div>

            <Rule variant="ruler" className="mt-8" />
          </div>
        </div>

        {/* ── 候选词 chips ───────────────────────────────────── */}
        <div
          role="group"
          aria-label={t(title)}
          className="mx-auto mt-6 flex w-full max-w-shell flex-wrap items-center gap-2 px-5 sm:gap-3 sm:px-8 lg:px-12"
        >
          {chips.map((chip, i) => {
            const active = i === activeIndex
            return (
              <button
                key={chip.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChipClick(i)}
                className={cn(
                  'font-mono text-[length:var(--text-mono)] leading-none',
                  'min-h-11 border px-4 tracking-[0.04em]',
                  'transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
                  active
                    ? 'border-crimson bg-crimson text-on-crimson'
                    : 'border-line text-text-1 hover:border-line-strong hover:text-text-0',
                )}
              >
                {t(chip.word)}
              </button>
            )
          })}
        </div>

        {/* ── 源码 + 复用说明 ────────────────────────────────── */}
        <div className="mt-block mx-auto grid w-full max-w-shell gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12 lg:px-12">
          <CodeBlock
            code={sourceCode}
            lang="svml"
            filename={`${hexIndex(swapIndex + 1)} · ${SOURCE_NAME}`}
            meta={phase === 'dirty' ? GLYPH_DIRTY : GLYPH_REUSED}
            highlightLines={HIGHLIGHTED_LINES}
            dirtyLines={phase === 'dirty' ? HIGHLIGHTED_LINES : undefined}
            ariaLabel={sentence.join(' ')}
            className="self-start"
          />

          <div className="flex flex-col gap-6">
            <p className="text-[length:var(--text-body)] leading-[1.7] text-text-1">
              {t(reuseNote)}
            </p>
            <Rule variant="trace" />
            {/* 大字金句已降级：全站只留 S3 / S11 / S17 三处落锤（P0-4.2） */}
            <blockquote className="text-[length:var(--text-body)] leading-[1.7] text-text-1">
              {t(quote)}
            </blockquote>
          </div>
        </div>
      </SectionShell>
    </div>
  )
}

export default LocalRecompile
