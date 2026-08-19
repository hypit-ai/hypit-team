'use client'

/**
 * S16 · TEAM LOG —— 编译日志时间线（CREATIVE §5.3：胶片卷，**纯 SVG，不用 WebGL**）。
 *
 * 文案全部来自 `lib/data/timeline.ts`（日期取自 narratage 仓库真实提交历史）。
 *
 * 形态：中轴是一条 18px 宽的**齿孔纸带**——两侧 1px rule 边，内部等距齿孔（SVG pattern，
 * 一个 <rect> 描边重复，零位图、零网络成本）。与全站齿孔栏在 S15–S16 的形态呼应。
 *
 * 关键一点：**条目间距按真实日期差拉开**（`gap = clamp(28, 20 + Δ天 × 14, 120)`）。
 * 8/10 → 8/15 的五天空档在纸上是真的空一段，19 天的节奏因此可以用眼睛量。
 * 时间线不等距，这既是数据的真相，也是「时间属于事件、不属于刻度」的字面表达。
 *
 * 动效（P0-2：通用 stagger 淡入已删，只留器械本身）：
 * - 纸带 `scaleY 0→1`（origin top）随滚动 scrub 展开——胶片卷放下来的动作；
 *   条目一律在位渲染，不做位移淡入；
 * - 结尾天数 count-up 一次（<Counter>）；
 * - 移动端：纸带与条目动效保留（纯 transform，很便宜）；
 * - reduced-motion：不建任何 tween，DOM 即终态。
 *
 * [覆盖 BP] ribbon 90° 扭转取消——本段不碰 WebGL、不写任何 uniform。
 */

import { useRef } from 'react'
import { Counter } from '@/components/ui/Counter'
import { Rule } from '@/components/ui/Rule'
import { useSectionTrigger } from '@/components/scroll/useSectionTrigger'
import { useLocale } from '@/hooks/useLocale'
import { timeline } from '@/lib/data/timeline'
import { DUR_MS, SCRUB } from '@/lib/motion/tokens'
import { RHYTHM, TITLE_SCALE } from '@/components/ui/SectionShell'
import { cn } from '@/lib/utils/cn'
import { formatLogDate, clamp, pad } from '@/lib/utils/format'

/** 中轴纸带宽度（px），齿孔 pattern 与条目缩进都以它为基准。 */
const TAPE = 18
/** 条目左缩进（px）。 */
const INDENT = 44

const DAY_MS = 86_400_000

/** ISO 日期差（天）。用 Date.parse 解析 UTC 午夜，SSR / CSR 结果一致。 */
function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.parse(fromIso)
  const b = Date.parse(toIso)
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  return Math.round((b - a) / DAY_MS)
}

/** 真实日期差 → 条目上方留白（px）。第一条不留。 */
function gapFor(delta: number): number {
  return clamp(20 + delta * 14, 28, 120)
}

export interface TeamLogProps {
  /** HUD 用 section 序号，默认 16（首页 S16）。 */
  sec?: number
  /** 覆盖 section id（首页锚点为 `log`）。 */
  id?: string
  className?: string
}

export function TeamLog({ sec = 16, id = 'log', className }: TeamLogProps) {
  const { t } = useLocale()
  const root = useRef<HTMLElement>(null)

  useSectionTrigger(root, ({ gsap, one, reduced, scrub }) => {
    if (reduced) return

    const axis = one('[data-log-axis]')
    if (!axis) return

    gsap.fromTo(
      axis,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: scrub({ start: 'top 80%', end: 'bottom 90%' }, SCRUB.base),
      },
    )
  })

  const first = timeline.entries[0]

  return (
    <section
      ref={root}
      id={id}
      data-section={id}
      data-sec={pad(sec, 2)}
      aria-labelledby={`${id}-title`}
      className={cn('border-line relative isolate w-full border-t', RHYTHM.flow, className)}
    >
      <div className="mx-auto w-full max-w-shell px-5 sm:px-8 lg:px-12">
        <header className="mb-block flex flex-col gap-5">
          <h2
            id={`${id}-title`}
            className={cn('text-ink', TITLE_SCALE.default)}
          >
            {t(timeline.title)}
          </h2>
        </header>

        <div className="relative">
          {/* 齿孔纸带 */}
          <div
            aria-hidden="true"
            data-log-axis
            className="border-rule text-rule-soft absolute top-[6px] bottom-0 left-0 origin-top border-x"
            style={{ width: TAPE }}
          >
            {/* 父层已 aria-hidden，这里再写一次是为了让「装饰性 svg 必须显式隐藏」
                这条规则在节点自身可读 —— 将来纸带被搬出这个容器也不会漏读。 */}
            <svg width={TAPE} height="100%" aria-hidden="true" className="block">
              <pattern
                id="nrt-sprocket"
                width={TAPE}
                height="22"
                patternUnits="userSpaceOnUse"
              >
                <rect
                  x="4.5"
                  y="5.5"
                  width={TAPE - 9}
                  height="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
              <rect width={TAPE} height="100%" fill="url(#nrt-sprocket)" />
            </svg>
          </div>

          <ol className="list-none" style={{ paddingLeft: INDENT }}>
            {timeline.entries.map((entry, i) => {
              const delta = i === 0 ? 0 : daysBetween(timeline.entries[i - 1].date, entry.date)
              return (
                <li
                  key={entry.date}
                  data-log-item
                  data-current={entry.current || undefined}
                  // lg 起是有意的不对称：左栏日期与标题（账簿），右栏正文封顶 39rem。
                  // 单栏时正文停在 624px，右侧近一半是无意的空。
                  className="group/log relative lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,39rem)] lg:items-baseline lg:gap-x-12"
                  style={{ marginTop: i === 0 ? 0 : gapFor(delta) }}
                >
                  {/* 帧标记：贴在纸带上的一格 */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute top-[3px] block size-[10px] border',
                      'transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
                      entry.current
                        ? 'border-crimson bg-crimson'
                        : 'border-rule bg-paper group-hover/log:border-crimson',
                    )}
                    style={{ left: -(INDENT - 4) }}
                  />

                  <p className="flex flex-wrap items-baseline gap-x-3 lg:col-start-1 lg:row-start-1 font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] tabular-nums uppercase">
                    <span className="text-muted">{formatLogDate(entry.date)}</span>
                    {delta > 0 ? (
                      <span className="text-rule-soft">{`+${delta}d`}</span>
                    ) : null}
                  </p>

                  <h3 className="text-ink mt-3 lg:col-start-1 lg:row-start-2 text-[length:var(--text-h2)] leading-[1.35] font-bold tracking-[-0.018em]">
                    {t(entry.title)}
                  </h3>
                  <p className="text-text-1 mt-2 max-w-prose lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mt-0 text-[length:var(--text-body)] leading-[1.7]">
                    {t(entry.body)}
                  </p>
                </li>
              )
            })}
          </ol>
        </div>

        {/* 结尾：N days. From zero to product. */}
        <Rule className="mt-block" />
        <p className="text-ink mt-8 flex flex-wrap items-baseline gap-x-[0.3em] gap-y-2 text-[length:var(--text-h1)] leading-[1.06] font-bold tracking-[-0.036em]">
          <Counter
            value={timeline.closing.days}
            durationMs={DUR_MS.stage}
            className="text-crimson"
          />
          <span>{t(timeline.closing.text)}</span>
        </p>
        {first ? (
          <p className="text-muted mt-4 font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] tabular-nums">
            {`${formatLogDate(first.date)} — ${formatLogDate(
              timeline.entries[timeline.entries.length - 1].date,
            )}`}
          </p>
        ) : null}
      </div>
    </section>
  )
}

export default TeamLog
