'use client'

/**
 * S5 · HOOK —— 「尺断 The Ruler Breaks」（CREATIVE.md M6 / 招牌时刻 #2，强度 5）。
 *
 * 观众看到什么：
 *   段首横着一把真的帧刻度尺 —— 等距刻度 + `00:00 00:04 00:08…` 时间码，
 *   就是所有剪辑软件的那把尺。下方是一句台词，逐词铺开。
 *   滚动推进：刻度线**一根根从等距位置脱离**，各自滑向它对应的那个词的中心，
 *   落位时略微歪斜；时间码的数字在滑动途中**一位位掉光**。
 *   到本段结束，尺子上一个数字都没有了，只剩歪斜地钉在词上的刻度，
 *   语义锚点词底留下 1px crimson 墨线。
 *
 * 为什么这样做：观众看见的不是一个新东西被造出来，而是一个他每天在用的东西
 * 当着他的面散架。这是 "kill the timeline" 从口号变成动作。
 *
 * 实现要点：
 * - 刻度只做 `transform`（translateX + rotate），**不改 SVG 几何属性**，
 *   滚动期间零 layout / 零 paint。
 * - `stagger from:'random'` —— 全站唯一允许无序 stagger 的地方（散架就该是无序的）；
 *   窄屏改 `from:'start'`（random 在窄屏看着像噪声）。
 * - 全部几何量在**布局后**测量（ResizeObserver + document.fonts.ready + 语言切换），
 *   overlay 是 absolute，不参与文档流，重测不产生 CLS，也不需要 refresh。
 * - 点亮量走 CSS 变量（词用 globals.css 的 `[data-word] --w`，其余用 `--lit`），
 *   GSAP 只推数字，颜色由 `color-mix` 现算。
 * - 颜色只有 ink / rule / crimson。crimson 留给「锚点」语义：落位刻度、Moment 竖线、
 *   点亮后的牵引线与卡片边。
 * - 移动端：刻度数量减半、`from:'start'`、不画横向牵引线（卡片在台词下方）。
 * - reduced-motion：尺子直接以「已散架」的终态出现，数字不逐位掉，全部一次落位。
 *
 * 与 S6 的衔接：CREATIVE M6 原案让尺子 sticky 跨到 S6 复用同一批 DOM 节点。
 * S6（LocalRecompile.tsx）不属于本 Agent，跨文件共享 DOM 会破坏组件边界，
 * 因此这里把「散架」完整收在 S5 内完成，S6 接手的是已经变形的语义（锚点条），
 * 不是同一批节点。
 */

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { SectionShell, TITLE_SCALE } from '@/components/ui/SectionShell'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Rule } from '@/components/ui/Rule'
import { orthPath } from '@/components/ui/Trace'
import { ScrollEdgeStyle, X_SCROLL } from '@/components/ui/ScrollEdge'
import { useSectionTrigger } from '@/components/scroll/useSectionTrigger'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useLocale } from '@/hooks/useLocale'
import { hookDemo, type AnchorSpan } from '@/lib/data/hook-demo'
import { DUR, EASE_GSAP, SCRUB } from '@/lib/motion/tokens'
import { hexIndex, pad } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { joinWords, toWords, usesWordSpacing } from '@/lib/utils/segment'

/* ── 帧刻度尺 ─────────────────────────────────────────────── */

/** 刻度数 = 词数 × 1.6（窄屏减半）。 */
const TICK_RATIO = 1.6
/** 每 5 根刻度打一个时间码，每格 4 秒 —— 剪辑软件那把尺的默认刻度。 */
const MAJOR_EVERY = 5
const SECONDS_PER_MAJOR = 4
const RULER_H = 40
const TICK_MINOR = 8
const TICK_MAJOR = 15

/** 秒 → `mm:ss`（纯数字格式化，不是文案）。 */
function timecode(seconds: number): string {
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`
}

/** 确定性伪随机：同一根刻度每次渲染的歪斜角一致，SSR / CSR 不分叉。 */
function hash01(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453
  return x - Math.floor(x)
}

interface TickGeom {
  i: number
  /** 等距位（旧世界）。 */
  x0: number
  /** 目标位 = 它对应那个词的中心（新世界）。 */
  x1: number
  major: boolean
  /** 落位时的歪斜角（度）。 */
  rot: number
  label: string | null
}

interface RulerGeom {
  w: number
  ticks: TickGeom[]
}

/* ── 数据派生：把 spans 归并成「卡片组」──────────────────── */

interface SpanGroup {
  /** DOM 选择键，形如 `selection:recap`。 */
  key: string
  name: string
  kind: AnchorSpan['kind']
  index: string
  /** 引用写法，与 hookDemo.refExamples 同构。 */
  ref: string
  /** 该组的全部出现（同名非连续 Selection 会有多段）。 */
  occurrences: AnchorSpan[]
  /** 首次出现的起始词下标，决定点亮时机与卡片顺序。 */
  first: number
  /** 时间轴位置 0..0.9。 */
  at: number
}

function buildGroups(spans: readonly AnchorSpan[], wordCount: number): SpanGroup[] {
  const map = new Map<string, SpanGroup>()
  for (const span of spans) {
    const key = `${span.kind}:${span.name}`
    const existing = map.get(key)
    if (existing) {
      existing.occurrences.push(span)
      existing.first = Math.min(existing.first, span.from)
    } else {
      map.set(key, {
        key,
        name: span.name,
        kind: span.kind,
        index: '',
        ref: `{story.${span.kind}.${span.name}}`,
        occurrences: [span],
        first: span.from,
        at: 0,
      })
    }
  }
  const groups = Array.from(map.values()).sort((a, b) => a.first - b.first)
  const denom = Math.max(1, wordCount)
  groups.forEach((group, i) => {
    group.index = hexIndex(i + 1)
    group.at = Number(((group.first / denom) * 0.9).toFixed(4))
  })
  return groups
}

/** 区间条的泳道分配：重叠的 Selection 必须错开，交叉闭合才看得见。 */
function assignLanes(spans: readonly AnchorSpan[]): Map<AnchorSpan, number> {
  const lanes: number[] = []
  const result = new Map<AnchorSpan, number>()
  const ordered = [...spans]
    .filter((s) => s.kind === 'selection')
    .sort((a, b) => a.from - b.from || (b.to ?? b.from) - (a.to ?? a.from))
  for (const span of ordered) {
    const end = span.to ?? span.from
    let lane = lanes.findIndex((lastEnd) => lastEnd < span.from)
    if (lane === -1) {
      lane = lanes.length
      lanes.push(end)
    } else {
      lanes[lane] = end
    }
    result.set(span, lane)
  }
  return result
}

/** 语义锚点词：Selection 的首尾 + Moment 的落点。它们词底才画 crimson 锚点条。 */
function anchorWordSet(spans: readonly AnchorSpan[]): Set<number> {
  const set = new Set<number>()
  for (const span of spans) {
    set.add(span.from)
    if (span.to !== undefined) set.add(span.to)
  }
  return set
}

/* ── 几何测量结果 ────────────────────────────────────────── */

interface BarGeom {
  id: string
  group: string
  at: number
  x: number
  y: number
  w: number
}

interface MomentGeom {
  id: string
  group: string
  at: number
  x: number
  y: number
  h: number
}

interface ConnGeom {
  id: string
  group: string
  at: number
  d: string
}

interface Geom {
  w: number
  h: number
  bars: BarGeom[]
  moments: MomentGeom[]
  conns: ConnGeom[]
}

const LANE_STEP = 5
const LANE_OFFSET = 9
/** 连接线总线通道的横向错开步长。 */
const BUS_STEP = 7

export interface HookAnchorsProps {
  className?: string
}

export function HookAnchors({ className }: HookAnchorsProps) {
  const scope = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const sentenceRef = useRef<HTMLParagraphElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map())
  const { locale, t } = useLocale()
  const desktop = useIsDesktop()

  // 台词词表：数据层已按语言切好（中文不按空格切，见 lib/utils/segment.ts）；
  // 若某天数据改成整句字符串，toWords 会在此处按语言切分兜底。
  const words = useMemo(() => toWords(t(hookDemo.sentence), locale), [t, locale])
  const spaced = usesWordSpacing(locale)
  const groups = useMemo(() => buildGroups(hookDemo.spans, words.length), [words.length])
  const lanes = useMemo(() => assignLanes(hookDemo.spans), [])
  const anchorWords = useMemo(() => anchorWordSet(hookDemo.spans), [])

  const [geom, setGeom] = useState<Geom | null>(null)
  const [ruler, setRuler] = useState<RulerGeom | null>(null)

  /* ── 测量 ─────────────────────────────────────────────── */

  const measure = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const stageBox = stage.getBoundingClientRect()
    if (stageBox.width === 0) return

    const wordBox = (i: number) => {
      const el = wordRefs.current[i]
      if (!el) return null
      const r = el.getBoundingClientRect()
      return {
        left: r.left - stageBox.left,
        right: r.right - stageBox.left,
        top: r.top - stageBox.top,
        bottom: r.bottom - stageBox.top,
      }
    }

    /* ── 帧刻度尺：等距位 → 词中心 ─────────────────────── */
    const sentence = sentenceRef.current
    if (sentence) {
      const sBox = sentence.getBoundingClientRect()
      const width = Math.round(sBox.width)
      const isNarrow = width < 640
      const count = Math.max(
        6,
        Math.round(words.length * TICK_RATIO * (isNarrow ? 0.5 : 1)),
      )
      const ticks: TickGeom[] = []
      for (let i = 0; i < count; i += 1) {
        const x0 = Math.round(((i + 0.5) / count) * width)
        const wi = Math.min(words.length - 1, Math.floor((i / count) * words.length))
        const el = wordRefs.current[wi]
        let x1 = x0
        if (el) {
          const r = el.getBoundingClientRect()
          x1 = Math.round(r.left + r.width / 2 - sBox.left)
        }
        const major = i % MAJOR_EVERY === 0
        ticks.push({
          i,
          x0,
          x1,
          major,
          rot: Number(((hash01(i) - 0.5) * 14).toFixed(2)),
          label: major ? timecode((i / MAJOR_EVERY) * SECONDS_PER_MAJOR) : null,
        })
      }
      setRuler({ w: width, ticks })
    }

    const bars: BarGeom[] = []
    const moments: MomentGeom[] = []
    const conns: ConnGeom[] = []

    // 连接线走「总线」：竖直段全部落在两栏之间的空白通道里，
    // 每条线错开 BUS_STEP，像一张真实的走线图，绝不压到正文上。
    const cardLefts = Array.from(cardRefs.current.values()).map(
      (el) => el.getBoundingClientRect().left - stageBox.left,
    )
    const busBase = cardLefts.length > 0 ? Math.min(...cardLefts) - 18 : stageBox.width
    const busX = (k: number) => Math.round(busBase - k * BUS_STEP)
    const groupList = groups
    const atOf = (span: AnchorSpan) =>
      groupList.find((g) => g.key === `${span.kind}:${span.name}`)?.at ?? 0

    hookDemo.spans.forEach((span, si) => {
      const groupKey = `${span.kind}:${span.name}`
      const at = atOf(span)

      if (span.kind === 'moment') {
        const box = wordBox(span.from)
        if (!box) return
        moments.push({
          id: `m${si}`,
          group: groupKey,
          at,
          x: box.left,
          y: box.top - LANE_OFFSET - 4,
          h: box.bottom - box.top + LANE_OFFSET + 4,
        })
        return
      }

      const lane = lanes.get(span) ?? 0
      const to = span.to ?? span.from
      // 按视觉行分组：折行的 Selection 每行画一段。
      const rows = new Map<number, { left: number; right: number; top: number }>()
      for (let i = span.from; i <= to; i += 1) {
        const box = wordBox(i)
        if (!box) continue
        const rowKey = Math.round(box.top / 4)
        const row = rows.get(rowKey)
        if (row) {
          row.left = Math.min(row.left, box.left)
          row.right = Math.max(row.right, box.right)
        } else {
          rows.set(rowKey, { left: box.left, right: box.right, top: box.top })
        }
      }
      const rowList = Array.from(rows.values())
      rowList.forEach((row, ri) => {
        bars.push({
          id: `b${si}-${ri}`,
          group: groupKey,
          at,
          x: row.left,
          y: row.top - LANE_OFFSET - lane * LANE_STEP,
          w: Math.max(2, row.right - row.left),
        })
      })

      // 连接线：从该段最后一行的右端牵到它触发的卡片。
      const card = cardRefs.current.get(groupKey)
      const lastRow = rowList[rowList.length - 1]
      if (card && lastRow) {
        const cardBox = card.getBoundingClientRect()
        const from = {
          x: Math.round(lastRow.right + 4),
          y: Math.round(lastRow.top - LANE_OFFSET - lane * LANE_STEP + 1),
        }
        const target = {
          x: Math.round(cardBox.left - stageBox.left - 4),
          y: Math.round(cardBox.top - stageBox.top + cardBox.height / 2),
        }
        const mx = busX(conns.length)
        if (target.x > from.x + 8 && mx > from.x + 8) {
          conns.push({
            id: `c${si}`,
            group: groupKey,
            at,
            // A3 INK RULE：只走直角，不用曲线。
            d: orthPath([from, { x: mx, y: from.y }, { x: mx, y: target.y }, target], 0),
          })
        }
      }
    })

    // Moment 也牵一条线到它的卡片。
    hookDemo.spans.forEach((span, si) => {
      if (span.kind !== 'moment') return
      const groupKey = `${span.kind}:${span.name}`
      const card = cardRefs.current.get(groupKey)
      const box = wordBox(span.from)
      if (!card || !box) return
      const cardBox = card.getBoundingClientRect()
      const from = { x: Math.round(box.left), y: Math.round(box.top - LANE_OFFSET - 4) }
      const target = {
        x: Math.round(cardBox.left - stageBox.left - 4),
        y: Math.round(cardBox.top - stageBox.top + cardBox.height / 2),
      }
      const mx = busX(conns.length)
      if (target.x > from.x + 8 && mx > from.x + 8) {
        conns.push({
          id: `cm${si}`,
          group: groupKey,
          at: atOf(span),
          d: orthPath([from, { x: mx, y: from.y }, { x: mx, y: target.y }, target], 0),
        })
      }
    })

    setGeom({
      w: Math.round(stageBox.width),
      h: Math.round(stageBox.height),
      bars,
      moments,
      conns,
    })
  }, [groups, lanes, words.length])

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage || typeof window === 'undefined') return

    measure()
    const ro = new ResizeObserver(() => measure())
    ro.observe(stage)
    let cancelled = false
    document.fonts?.ready.then(() => {
      if (!cancelled) measure()
    })
    return () => {
      cancelled = true
      ro.disconnect()
    }
  }, [measure, locale, desktop])

  /* ── 动效 ─────────────────────────────────────────────── */

  const hasGeom = geom !== null
  const hasRuler = ruler !== null

  useSectionTrigger(
    scope,
    ({ gsap, q, scrub, once, reduced, desktop, ScrollTrigger }) => {
      const wordEls = q('[data-word]')
      const bars = q('[data-anim="bar"]')
      const conns = q<SVGPathElement>('[data-anim="conn"]')
      const cards = q('[data-anim="card"]')
      const moments = q('[data-anim="moment"]')
      const ticks = q<SVGGElement>('[data-tick]')
      const digits = q<SVGTSpanElement>('[data-digit]')

      const at = (el: Element) => Number((el as HTMLElement).dataset.at ?? '0')
      const dx = (el: Element) => Number((el as SVGElement).dataset.dx ?? '0')
      const rot = (el: Element) => Number((el as SVGElement).dataset.rot ?? '0')
      /** 刻度绕自己的根部旋转（svgOrigin 用 SVG 用户坐标，不受 transform-box 影响）。 */
      const originOf = (el: Element) => `${(el as SVGElement).dataset.ox ?? '0'} ${RULER_H}`

      // gsap.set 空数组会打 "target not found" 警告，统一过一道守卫。
      const setAll = (targets: Element[], vars: gsap.TweenVars) => {
        if (targets.length > 0) gsap.set(targets, vars)
      }

      if (reduced) {
        setAll(wordEls, { '--w': 1 })
        setAll(bars, { '--lit': 1, scaleX: 1 })
        setAll(conns, { '--lit': 1, strokeDashoffset: 0 })
        setAll(cards, { '--lit': 1, opacity: 1, x: 0 })
        setAll(moments, { '--lit': 1, scaleY: 1, opacity: 1 })
        // 尺子直接以「已散架」的终态出现，数字不逐位掉。
        setAll(ticks, {
          svgOrigin: (i: number, el: Element) => originOf(el),
          x: (i: number, el: Element) => dx(el),
          rotate: (i: number, el: Element) => rot(el),
          '--lit': 1,
        })
        setAll(digits, { opacity: 0 })
        return
      }

      const tl = gsap.timeline({
        scrollTrigger: scrub({ start: 'top 70%', end: 'bottom 62%' }, SCRUB.tight),
      })

      if (wordEls.length > 0) {
        tl.to(
          wordEls,
          {
            '--w': 1,
            ease: 'none',
            duration: 0.1,
            stagger: { each: 0.9 / wordEls.length },
          },
          0,
        )
      }

      /* ── ★ 尺断：刻度一根根脱离等距位，滑去钉在词上 ── */
      if (ticks.length > 0) {
        tl.to(
          ticks,
          {
            svgOrigin: (i: number, el: Element) => originOf(el),
            x: (i: number, el: Element) => dx(el),
            rotate: (i: number, el: Element) => rot(el),
            '--lit': 1,
            ease: EASE_GSAP.compile,
            duration: 0.3,
            stagger: {
              each: 0.55 / ticks.length,
              // 散架就该是无序的 —— 全站唯一允许 from:'random' 的地方。
              from: desktop ? 'random' : 'start',
            },
          },
          0.02,
        )
      }
      if (digits.length > 0) {
        // 时间码在滑动途中一位位掉光，从末位开始。
        // 只动 opacity —— SVG 1.1 的 <tspan> 不支持 transform，位移在 Safari 上无效。
        tl.to(
          digits,
          {
            opacity: 0,
            ease: 'none',
            duration: 0.06,
            stagger: { each: 0.45 / digits.length, from: 'end' },
          },
          0.05,
        )
      }

      bars.forEach((el) => {
        tl.to(el, { '--lit': 1, scaleX: 1, ease: 'none', duration: 0.14 }, at(el))
      })
      conns.forEach((el) => {
        tl.to(el, { '--lit': 1, strokeDashoffset: 0, ease: 'none', duration: 0.18 }, at(el))
      })
      cards.forEach((el) => {
        tl.to(el, { '--lit': 1, opacity: 1, x: 0, ease: 'none', duration: 0.16 }, at(el))
      })

      // Moment 竖线：固定节奏 + overshoot（不 scrub，§4.1 白名单）。
      moments.forEach((el) => {
        gsap.fromTo(
          el,
          { scaleY: 0, opacity: 0, '--lit': 0 },
          {
            scaleY: 1,
            opacity: 1,
            '--lit': 1,
            duration: DUR.mid,
            ease: EASE_GSAP.snapMoment,
            scrollTrigger: once({ trigger: el as HTMLElement, start: 'top 92%' }),
          },
        )
      })

      /* 对照动画：滚进视口**播一轮就停在对比终态**。
         它要说明的是重生成前后的差值，不是节拍器——所以不再 repeat:-1。 */
      const speech = q('[data-speech]')
      const counter = q('[data-counter-scale]')
      // 移动端改静态对比，不跑动画。
      if (desktop && speech.length > 0) {
        const shift = gsap
          .timeline({ paused: true })
          .to(speech, { scaleX: 1.25, duration: 1.2, ease: EASE_GSAP.compile }, 0)
          .to(counter, { scaleX: 1 / 1.25, duration: 1.2, ease: EASE_GSAP.compile }, 0)
        ScrollTrigger.create({
          trigger: speech[0],
          start: 'top 92%',
          once: true,
          onEnter: () => shift.play(),
        })
      }
    },
    { deps: [locale, hasGeom, hasRuler, desktop] },
  )

  useEffect(() => {
    wordRefs.current.length = words.length
  }, [words.length])

  /** 落位后刻度转 crimson：--lit 由 GSAP 推 0→1。 */
  const litTick: CSSProperties = {
    ['--lit' as string]: 0,
    stroke:
      'color-mix(in oklab, var(--color-rule), var(--color-crimson) calc(var(--lit) * 100%))',
  }
  const litBar: CSSProperties = {
    ['--lit' as string]: 0,
    backgroundColor:
      'color-mix(in oklab, var(--color-rule), var(--color-ink) calc(var(--lit) * 100%))',
  }
  const litCard: CSSProperties = {
    ['--lit' as string]: 0,
    borderColor:
      'color-mix(in oklab, var(--color-rule), var(--color-crimson) calc(var(--lit) * 80%))',
  }
  const litConn: CSSProperties = {
    ['--lit' as string]: 0,
    stroke:
      'color-mix(in oklab, var(--color-rule), var(--color-crimson) calc(var(--lit) * 85%))',
  }

  return (
    <SectionShell
      id="hook"
      sec={5}
      hudAccent
      // P0-3 招牌镜头：无分隔线、full-bleed、setpiece 节奏，镜头顶到视口边缘。
      // 乐章首段的 eyebrow 与标题降到正文里，让刻度尺先入眼。
      width="full"
      divider={false}
      rhythm="setpiece"
      labelledById="hook-title"
      containerClassName="px-0"
      className={className}
    >
      <div ref={scope} className="gap-block relative flex flex-col">
        <div className="mx-auto w-full max-w-shell px-5 sm:px-8 lg:px-12">
          <Eyebrow variant="dot">{hookDemo.eyebrow}</Eyebrow>
          <h2
            id="hook-title"
            // 字号从 TITLE_SCALE 取（全站唯一来源）：这里是乐章 II 的首段标题，
            // 只因为镜头要顶到视口边缘才没走 shell 的报头，重要性没有降级。
            className={cn('text-text-0 mt-4', TITLE_SCALE.movement)}
          >
            {t(hookDemo.title)}
          </h2>
          <p className="text-text-1 mt-4 max-w-prose text-[length:var(--text-lead)] leading-[1.6]">
            {t(hookDemo.lead)}
          </p>
        </div>
        {/* ── 招牌镜头：帧刻度尺 → 台词 → 牵引线 → B-roll 卡片 ── */}
        <div
          ref={stageRef}
          className="relative mx-auto min-w-0 w-full max-w-[min(100%,88rem)] px-5 sm:px-8 lg:px-12"
        >
          <div className="grid min-w-0 gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="min-w-0 lg:col-span-7">
              {/* ★ 帧刻度尺：等距刻度 + 时间码，随滚动散架 */}
              {ruler ? (
                <svg
                  aria-hidden="true"
                  viewBox={`0 0 ${ruler.w} ${RULER_H}`}
                  width={ruler.w}
                  height={RULER_H}
                  fill="none"
                  className="mb-6 block h-[40px] w-full overflow-visible"
                >
                  {/* 尺身基线 */}
                  <line
                    x1={0}
                    y1={RULER_H - 0.5}
                    x2={ruler.w}
                    y2={RULER_H - 0.5}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                    className="stroke-rule"
                  />
                  {ruler.ticks.map((tick) => (
                    <g
                      key={tick.i}
                      data-tick
                      data-dx={tick.x1 - tick.x0}
                      data-rot={tick.rot}
                      data-ox={tick.x0}
                      style={litTick}
                    >
                      <line
                        x1={tick.x0}
                        y1={RULER_H - (tick.major ? TICK_MAJOR : TICK_MINOR)}
                        x2={tick.x0}
                        y2={RULER_H}
                        strokeWidth={1}
                        vectorEffect="non-scaling-stroke"
                      />
                      {tick.label ? (
                        <text
                          x={tick.x0 + 3}
                          y={RULER_H - TICK_MAJOR - 5}
                          className="fill-muted font-mono"
                          style={{ fontSize: 9, letterSpacing: '0.08em' }}
                        >
                          {Array.from(tick.label).map((ch, ci) => (
                            <tspan key={ci} data-digit>
                              {ch}
                            </tspan>
                          ))}
                        </text>
                      ) : null}
                    </g>
                  ))}
                </svg>
              ) : null}

              <p
                ref={sentenceRef}
                className="text-muted relative text-[length:var(--text-lead)] leading-[2.4]"
                aria-label={joinWords(words, locale)}
              >
                {words.map((word, i) => (
                  <Fragment key={`${locale}-${i}`}>
                    <span
                      data-word
                      data-anchor={anchorWords.has(i) ? '' : undefined}
                      ref={(el) => {
                        wordRefs.current[i] = el
                      }}
                    >
                      {word}
                    </span>
                    {spaced && i < words.length - 1 ? ' ' : null}
                  </Fragment>
                ))}
              </p>

              <p className="text-ink mt-8 font-mono text-[length:var(--text-mono)] leading-[1.65]">
                {hookDemo.formula}
              </p>
              <p className="text-muted mt-2 max-w-prose text-sm">{t(hookDemo.formulaNote)}</p>

              {/* 重生成对照：语音变长 → 时间码漂移，锚点跟着词走 */}
              <div className="border-rule mt-8 border-t pt-6">
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="min-w-0">
                    <Eyebrow variant="plain" tone="muted" className="mb-5">
                      {t(hookDemo.comparison.beforeLabel)}
                    </Eyebrow>
                    <div className="relative h-8">
                      <span className="bg-rule absolute top-3 left-0 block h-px w-[60%]" />
                      {/* 语音变长后固定时间码留在原地 —— 错位就发生在这里 */}
                      <span className="bg-rule absolute top-1 left-[36%] block h-4 w-px" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <Eyebrow variant="plain" tone="accent" className="mb-5">
                      {t(hookDemo.comparison.afterLabel)}
                    </Eyebrow>
                    <div className="relative h-8">
                      <span
                        data-speech
                        className="bg-rule absolute top-3 left-0 block h-px w-[60%] origin-left"
                      >
                        <span
                          data-counter-scale
                          className="bg-crimson absolute top-[-8px] left-[60%] block h-4 w-px origin-center"
                        />
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-muted mt-5 max-w-prose text-sm">
                  {t(hookDemo.comparison.note)}
                </p>
              </div>
            </div>

            {/* B-roll 卡片：说到哪个词，哪张卡就亮 */}
            <ul className="flex min-w-0 flex-col gap-3 lg:col-span-5">
              {groups.map((group) => (
                <li key={group.key} className="min-w-0">
                  <div
                    data-anim="card"
                    data-at={group.at}
                    data-group={group.key}
                    ref={(el) => {
                      if (el) cardRefs.current.set(group.key, el)
                      else cardRefs.current.delete(group.key)
                    }}
                    style={litCard}
                    className={cn(
                      'bg-paper-2 min-w-0 translate-x-2 border px-4 py-3 opacity-30',
                      'motion-reduce:translate-x-0 motion-reduce:opacity-100',
                    )}
                  >
                    <div className="flex min-w-0 items-baseline justify-between gap-3">
                      <span className="text-ink min-w-0 truncate font-mono text-[length:var(--text-mono)] leading-[1.65]">
                        {group.kind === 'moment' ? `@${group.name}!` : `@${group.name}`}
                      </span>
                      <span className="text-muted shrink-0 font-mono text-[length:var(--text-eyebrow)] tracking-[0.16em] uppercase">
                        {group.index} · {group.kind}
                      </span>
                    </div>
                    <p className="text-crimson mt-1 min-w-0 truncate font-mono text-[length:var(--text-eyebrow)] tracking-[0.12em]">
                      {group.ref}
                    </p>
                    <p className="text-muted mt-2 min-w-0 text-sm">
                      {group.occurrences
                        .map((occ) =>
                          joinWords(words.slice(occ.from, (occ.to ?? occ.from) + 1), locale),
                        )
                        .join(spaced ? ' … ' : '……')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* 区间条 / Moment 竖线：绝对定位覆盖层，不参与文档流 */}
          {geom ? (
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-1">
              {geom.bars.map((bar) => (
                <span
                  key={bar.id}
                  data-anim="bar"
                  data-at={bar.at}
                  data-group={bar.group}
                  style={{ ...litBar, left: bar.x, top: bar.y, width: bar.w }}
                  className="absolute block h-px origin-left scale-x-0 motion-reduce:scale-x-100"
                />
              ))}
              {geom.moments.map((moment) => (
                <span
                  key={moment.id}
                  data-anim="moment"
                  data-at={moment.at}
                  data-group={moment.group}
                  style={{
                    ['--lit' as string]: 0,
                    left: moment.x,
                    top: moment.y,
                    height: moment.h,
                  }}
                  className="bg-crimson absolute block w-px origin-bottom scale-y-0 opacity-0 motion-reduce:scale-y-100 motion-reduce:opacity-100"
                />
              ))}
            </div>
          ) : null}

          {/* 牵引线：桌面才画（移动端卡片在台词下方，横向牵线没有意义） */}
          {geom && desktop && geom.conns.length > 0 ? (
            <svg
              aria-hidden="true"
              viewBox={`0 0 ${geom.w} ${geom.h}`}
              width={geom.w}
              height={geom.h}
              fill="none"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full"
            >
              {geom.conns.map((conn) => (
                <path
                  key={conn.id}
                  data-anim="conn"
                  data-at={conn.at}
                  data-group={conn.group}
                  d={conn.d}
                  pathLength={1}
                  strokeWidth={1}
                  strokeDasharray={1}
                  strokeDashoffset={1}
                  vectorEffect="non-scaling-stroke"
                  style={litConn}
                />
              ))}
            </svg>
          ) : null}
        </div>

        <div className="mx-auto flex w-full max-w-shell flex-col gap-block px-5 sm:px-8 lg:px-12">
        <Rule tick="r" />

        {/* ── 吸附标记表（档案表格排版）───────────────────── */}
        {/* 表比 34rem 窄时会横滚 —— 截断语汇与全站同一套（ScrollEdge） */}
        <ScrollEdgeStyle />
        <div className={cn('min-w-0 overflow-x-auto', X_SCROLL)}>
          <table className="w-full min-w-[34rem] border-collapse text-left">
            <tbody>
              {hookDemo.affinity.map((row) => (
                <tr key={row.marker} className="border-rule border-b last:border-b-0">
                  <th
                    scope="row"
                    className="text-ink w-[10rem] py-2 pr-4 align-top font-mono text-[length:var(--text-mono)] leading-[1.65] font-normal"
                  >
                    {row.marker}
                  </th>
                  <td className="text-muted py-2 align-top text-sm">{t(row.meaning)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="flex min-w-0 flex-wrap gap-x-6 gap-y-2">
          {hookDemo.refExamples.map((ref) => (
            <li
              key={ref}
              className="text-muted font-mono text-[length:var(--text-mono)] leading-[1.65]"
            >
              {ref}
            </li>
          ))}
        </ul>

        {/* 大字金句已收回正文：全站只留 S3 / S11 / S17 三处落锤（P0-4.2） */}
        <p className="text-text-1 max-w-prose min-w-0 text-[length:var(--text-lead)] leading-[1.6]">
          {t(hookDemo.quote)}
        </p>
        </div>
      </div>
    </SectionShell>
  )
}

export default HookAnchors
