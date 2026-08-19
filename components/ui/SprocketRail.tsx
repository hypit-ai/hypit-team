'use client'

/**
 * A1 · SPROCKET RAIL —— 齿孔栏（CREATIVE.md §1-A1 / M1）。
 *
 * 视口左缘一条固定竖栏，画的是**印样条的齿孔**。它贯穿 S1–S18，是全站统一感的
 * 唯一来源，也是「时间线的消亡」这句话的物理载体：随章节推进，齿孔从等距 →
 * 被词长调制 → 变虚 → 塌成一条线 → 变成团队真实提交日志的刻度 → 归零汇入页脚。
 *
 * 性能约定（CREATIVE §7.3）：
 * - 连续量（滚动视差位移）只写 `style.transform`，**绝不进 React state**，
 *   数据来自全站唯一的 `scrollBus`，不自建 scroll 监听。
 * - 离散量（形态 mode）来自全站唯一的 `activeSection` IntersectionObserver，
 *   整页最多切 6 次，走 React 渲染是合适的。
 * - 齿孔位置用 `transform: translate3d(0, calc(var(--sp-gap) * i), 0)` 排布，
 *   `--sp-gap` 经 `@property` 注册为 `<length>` 才能被 CSS 过渡插值；
 *   走 transform 而不是 `top`，形态切换的那 .5s 不产生逐帧布局。
 * - 齿孔总数按 `100vh / 最小 gap` 静态推出（不量布局），多出的部分被 `overflow:hidden` 裁掉。
 *
 * reduced-motion：不订阅滚动、栏不位移，形态仍按当前 section 一次性写入
 * （CREATIVE 明确要求「用 IntersectionObserver 而非 scrub」）。
 *
 * 文案：栏内出现的字符只有**排版记号**——时间码（由索引推出）与词首字母
 * （取自 `lib/data/hook-demo.ts` 的台词），没有任何写死的句子。
 * 整体 `aria-hidden` + `pointer-events:none`，不参与朗读与命中。
 */

import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { cn } from '@/lib/utils/cn'
import { pad } from '@/lib/utils/format'
import { useLocale } from '@/hooks/useLocale'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useLatestRef } from '@/hooks/useLatestRef'
import { useActiveSection } from '@/components/scroll/activeSection'
import { subscribeScroll, setScrollChannel, SCROLL_CHANNEL } from '@/components/scroll/scrollBus'
import { hookDemo } from '@/lib/data/hook-demo'
import { timeline } from '@/lib/data/timeline'

/** 视差速率：齿孔栏是第 1 层（CREATIVE §1-A1）。 */
const RATE = 0.35

/** 等距形态的 gap（px）。与 CSS 里的 `--sp-gap` 初值一致，JS 只用它算循环周期。 */
const BASE_GAP = 16
/** 齿孔数：按 1440px 高的大屏 + 一个循环周期推出，多余的被 `overflow:hidden` 裁掉。 */
const HOLE_COUNT = 120
/** 每 N 个齿孔打一次刻度数字。 */
const LABEL_EVERY = 5
/** 每格代表的秒数——与 Hero 刻度尺同一把尺。 */
const STEP_SECONDS = 4

/** 齿孔形态。与 CREATIVE §1-A1 的区间表一一对应。 */
type RailMode = 'even' | 'word' | 'faint' | 'line' | 'log' | 'end'

/**
 * `data-sec`（'01'..'17'）→ 形态。null / 解析失败一律回落到 even。
 *
 * 切换点与 app/page.tsx 的五个乐章边界对齐（S9+S10 合并后段号是连续的 01..17，
 * 旧的 18 段区间表会让 `end` 永远取不到、并把 ARGUE 的落锤留在 BUILD 的形态里）：
 *   01–04 even  报头 + READ
 *   05–06 word  BREAK（两个招牌镜头，词长调制）
 *   07–10 faint BUILD
 *   11–14 line  ARGUE
 *   15–16 log   PEOPLE（齿孔变成 timeline.ts 的真实提交分布）
 *   17    end   尾声：齿孔褪尽，只剩脊线
 */
function modeForSec(sec: string | null): RailMode {
  const n = sec ? Number.parseInt(sec, 10) : Number.NaN
  if (!Number.isFinite(n)) return 'even'
  if (n <= 4) return 'even'
  if (n <= 6) return 'word'
  if (n <= 10) return 'faint'
  if (n <= 14) return 'line'
  if (n <= 16) return 'log'
  return 'end'
}

/** `00:04` —— 由索引推出的时间码，排版记号而非文案。 */
function timecode(index: number): string {
  const total = index * STEP_SECONDS
  return `${pad(Math.floor(total / 60), 2)}:${pad(total % 60, 2)}`
}

/**
 * S16–S17 的「真实日期分布」刻度：把 timeline.ts 的提交日期按时间轴归一化到 0..1。
 * 分布是天然不等距的（07-30 起连打 5 天，之后跳到 08-15 / 08-17），
 * 这正是 CREATIVE 要的「齿孔变成团队的编译日志」。模块级算一次。
 */
const LOG_TICKS: { at: number; accent: boolean }[] = (() => {
  const days = timeline.entries.map((e) => Date.parse(e.date))
  const min = Math.min(...days)
  const max = Math.max(...days)
  const span = max - min || 1
  return timeline.entries.map((e, i) => ({
    at: (days[i] - min) / span,
    accent: e.current === true || i === timeline.entries.length - 1,
  }))
})()

export interface SprocketRailProps {
  className?: string
}

export function SprocketRail({ className }: SprocketRailProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { t } = useLocale()
  const { sec } = useActiveSection()
  const mode = modeForSec(sec)

  /**
   * 词长调制用的词表（S5–S6）：取 S5 台词的实词。
   * gap = 8 + wordLen * 2.4（CREATIVE 原式），首字母作为刻度标签。
   * CJK 无空格分词，逐字即「词」，公式照用。
   */
  const rail = useMemo(() => {
    const raw = t(hookDemo.sentence)
    const words = raw
      .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
      .filter((w) => w.length > 0)

    /*
     * 词长调制的位置必须是**累进和**，不能写成「平均 gap × i」——
     * 后者会让齿孔互相穿插甚至倒序。这里在 JS 里一次算完（换语言才重算），
     * 逐帧不做任何计算。
     */
    const holes: { i: number; y: number; initial: string | null }[] = []
    let y = 0
    for (let i = 0; i < HOLE_COUNT; i += 1) {
      const w = words.length > 0 ? words[i % words.length] : null
      holes.push({ i, y, initial: w ? (w[0]?.toUpperCase() ?? null) : null })
      y += 8 + Math.min(w ? w.length : 4, 12) * 2.4
    }

    /** 一整轮词表的高度 —— word 形态的无缝循环周期。 */
    const wordPeriod =
      words.length > 0
        ? words.reduce((sum, w) => sum + 8 + Math.min(w.length, 12) * 2.4, 0)
        : BASE_GAP * LABEL_EVERY

    return { holes, wordPeriod }
  }, [t])

  /* ── 连续量：视差位移 + 广播 sprocket 通道。零 setState、零布局读取。 ── */
  // 用 useLatestRef（layout effect 写入）而不是渲染期写 ref ——
  // 本项目启用了 React Compiler，渲染期写 ref 是被禁的。
  const periodRef = useLatestRef(
    mode === 'word' ? rail.wordPeriod : BASE_GAP * LABEL_EVERY,
  )

  useEffect(() => {
    if (reduced) return
    const track = trackRef.current
    if (!track) return

    // will-change 只在真的逐帧写 transform 的分支里挂上，不写进 CSS ——
    // reduced-motion 与 SSR 的静态栏不该为一个不会动的图层付合成层的代价。
    track.style.willChange = 'transform'

    const unsubscribe = subscribeScroll((s) => {
      // 只写 transform。取模让齿孔无缝循环：位移永远落在 [0, 一个周期) 内，
      // 因此固定数量的齿孔就能铺满无限长的页面。周期取当前形态的真实节距，
      // 否则循环点会「跳一格」。
      const period = periodRef.current || BASE_GAP * LABEL_EVERY
      const y = -((s.y * RATE) % period)
      track.style.transform = `translate3d(0,${y}px,0)`
      setScrollChannel(SCROLL_CHANNEL.sprocket, s.progress)
    })

    return () => {
      unsubscribe()
      track.style.willChange = ''
    }
  }, [reduced, periodRef])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      data-sprocket=""
      data-sp-mode={mode}
      className={cn('np-sprocket', className)}
    >
      <style>{RAIL_CSS}</style>

      {/* 恒在的竖线：S12 之后齿孔塌掉，只剩它 */}
      <span className="np-sprocket__spine" />

      {/* 齿孔轨道：唯一被 JS 逐帧写 transform 的节点 */}
      <div ref={trackRef} className="np-sprocket__track">
        {rail.holes.map((hole) => {
          const label =
            mode === 'word'
              ? hole.initial
              : hole.i % LABEL_EVERY === 0
                ? timecode(hole.i)
                : null
          return (
            <span
              key={hole.i}
              className="np-sprocket__hole"
              data-accent={hole.i % 8 === 0 ? '' : undefined}
              style={
                {
                  // 两套位置：等距（--sp-i × --sp-gap）与词长调制（--sp-y，JS 累进算好）。
                  // 由形态的 CSS 规则选用哪一套，切换时经 --sp-gap 过渡插值。
                  '--sp-i': hole.i,
                  '--sp-y': `${hole.y.toFixed(2)}px`,
                } as CSSProperties
              }
            >
              {label ? <span className="np-sprocket__label">{label}</span> : null}
            </span>
          )
        })}
      </div>

      {/* S16–S17：按 timeline.ts 真实提交日期分布的刻度（不等距，且不随滚动位移） */}
      <div className="np-sprocket__log">
        {LOG_TICKS.map((tick, i) => (
          <span
            key={i}
            className="np-sprocket__logtick"
            data-accent={tick.accent ? '' : undefined}
            style={{ top: `${tick.at * 100}%` }}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * 组件私有样式。`@property` 注册让 `--sp-gap` 能被过渡插值——
 * 没有它，形态切换会是瞬间跳变而不是 CREATIVE 要的 .5s 演化。
 */
const RAIL_CSS = `
@property --sp-gap {
  syntax: "<length>";
  inherits: true;
  initial-value: 16px;
}

.np-sprocket {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: clamp(20px, 2.2vw, 28px);
  z-index: 30;
  pointer-events: none;
  overflow: hidden;
  user-select: none;
  --sp-gap: 16px;
  --sp-op: 1;
  --sp-hole-h: 10px;
  --sp-spine: 0;
  --sp-accent: 0;
  --sp-label: 1;
  transition:
    --sp-gap var(--dur-slow) var(--ease-out-quart),
    opacity var(--dur-slow) linear;
}

/* 恒在的竖线：齿孔在，它是背衬；齿孔没了，它就是全部（S12+）。 */
.np-sprocket__spine {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--color-rule-soft);
  opacity: var(--sp-spine);
  transition: opacity var(--dur-slow) linear;
}

.np-sprocket__track {
  position: absolute;
  left: 0;
  right: 0;
  top: -40px;
  height: 0;
}

/* 一枚齿孔：1px 描边的小矩形。位置走 transform，不走 top —— 不产生布局。 */
.np-sprocket__hole {
  position: absolute;
  left: 50%;
  top: 0;
  display: block;
  width: 9px;
  height: var(--sp-hole-h);
  margin-left: -4.5px;
  border: 1px solid var(--color-rule);
  opacity: var(--sp-op);
  transform: translate3d(0, calc(var(--sp-gap) * var(--sp-i)), 0);
  transition: opacity var(--dur-slow) linear, border-color var(--dur-slow) linear,
    transform var(--dur-slow) var(--ease-out-quart);
}

/* 每 8 个里 1 个 crimson 实心（S7–S11 才点亮） */
.np-sprocket__hole[data-accent] {
  background: color-mix(in srgb, var(--color-crimson) calc(var(--sp-accent) * 100%), transparent);
  border-color: color-mix(in srgb, var(--color-crimson) calc(var(--sp-accent) * 100%), var(--color-rule));
  transition: background-color var(--dur-slow) var(--ease-out-quart),
    border-color var(--dur-slow) var(--ease-out-quart), opacity var(--dur-slow) linear;
}

.np-sprocket__label {
  position: absolute;
  left: calc(100% + 5px);
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--font-mono);
  font-size: 9px;
  line-height: 1;
  letter-spacing: 0.1em;
  color: var(--color-muted);
  opacity: var(--sp-label);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  transition: opacity var(--dur-slow) linear;
}

/* 日志刻度层：默认不存在，只有 log 形态显形 */
.np-sprocket__log {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity var(--dur-slow) linear;
}
.np-sprocket__logtick {
  position: absolute;
  left: 50%;
  width: 9px;
  height: 1px;
  margin-left: -4.5px;
  background: var(--color-rule);
}
.np-sprocket__logtick[data-accent] {
  background: var(--color-crimson);
  width: 13px;
  margin-left: -6.5px;
}

/* ── 形态区间（CREATIVE §1-A1 的表）────────────────────── */

/* S1–S4 · 完全等距，每 5 个打一次时间码 —— 时间线还活着 */
.np-sprocket[data-sp-mode="even"] { --sp-gap: 16px; --sp-op: 1; --sp-label: 1; --sp-spine: 0; --sp-accent: 0; }

/* S5–S6 · 间距被词长调制，数字换成词首字母 —— 词开始接管时间 */
.np-sprocket[data-sp-mode="word"] { --sp-gap: 16px; --sp-op: 1; --sp-label: 1; --sp-spine: 0; --sp-accent: 0; }
.np-sprocket[data-sp-mode="word"] .np-sprocket__hole {
  /* gap = 8 + wordLen * 2.4（CREATIVE 原式）的**累进和**，由 JS 一次算好写进 --sp-y。 */
  transform: translate3d(0, var(--sp-y), 0);
}

/* S7–S11 · 齿孔变虚，每 8 个里 1 个 crimson 实心 —— 编译器接管 */
.np-sprocket[data-sp-mode="faint"] { --sp-gap: 16px; --sp-op: 0.45; --sp-label: 0; --sp-spine: 0.5; --sp-accent: 1; }

/* S12–S15 · 齿孔完全消失，只剩一条竖线 —— 旧范式被压成一条线 */
.np-sprocket[data-sp-mode="line"] { --sp-gap: 16px; --sp-op: 0; --sp-label: 0; --sp-spine: 1; --sp-accent: 0; }
/* 零星 crimson 短刻度：塌成线之后仍留下的几道刻痕 */
.np-sprocket[data-sp-mode="line"] .np-sprocket__hole[data-accent] {
  opacity: 0.9;
  height: 1px;
  background: var(--color-crimson);
  border-color: transparent;
}

/* S16–S17 · 刻度按真实提交日期分布排列（不等距） */
.np-sprocket[data-sp-mode="log"] { --sp-gap: 16px; --sp-op: 0; --sp-label: 0; --sp-spine: 1; --sp-accent: 0; }
.np-sprocket[data-sp-mode="log"] .np-sprocket__log { opacity: 1; }

/* S18 · 齿孔归零，竖线向下延伸汇入页脚 —— 收工 */
.np-sprocket[data-sp-mode="end"] { --sp-gap: 16px; --sp-op: 0; --sp-label: 0; --sp-spine: 1; --sp-accent: 0; }

/* 移动端：宽度降到 12px、无标签、整体压淡，但形态演化保留（它便宜） */
@media (max-width: 767px) {
  .np-sprocket { width: 12px; opacity: 0.5; }
  .np-sprocket__label { display: none; }
  .np-sprocket__hole { width: 6px; margin-left: -3px; }
}

/* reduced-motion：栏静止（JS 不订阅滚动），形态仍随 section 一次性写入。 */
@media (prefers-reduced-motion: reduce) {
  .np-sprocket,
  .np-sprocket__spine,
  .np-sprocket__hole,
  .np-sprocket__label,
  .np-sprocket__log { transition: none; }
}
`

export default SprocketRail
