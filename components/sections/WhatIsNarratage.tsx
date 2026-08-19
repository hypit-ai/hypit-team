'use client'

/**
 * S2 · WHAT IS NARRATAGE —— 词级点亮 + 墨线牵引（CREATIVE.md M3）。
 *
 * 强度 1：本段是全站文字密度最高处，也是最安静的一屏，**靠排版撑住，不靠动效**。
 * 唯一的运动是 anchor 词从词底锚点条右端牵出的那条墨线。
 *
 * 逐词点亮已经取消（P0-5）：它与 S5 的招牌手法是同一套机制、同一批属性名，
 * 提前演一遍等于把高潮花掉。词现在直接以终态渲染。
 *
 * 硬性要求：
 * - **纯 DOM**：词是真实文本节点，可选中、可被搜索引擎抓取（词已在 lib/data
 *   构建期切好，零 CLS、零 hydration 抖动）。
 * - 墨线是 A3「INK RULE」语汇：1px crimson、**只走直角**、末端 8px 短刻度收尾，
 *   用 `stroke-dasharray` 从 0 生长（禁止用 border 拼线）。它只在
 *   「某物锚定到某词」时出现 —— 这里锚定的是页边的校对记号。
 * - 几何量在**布局后**测量（ResizeObserver + document.fonts.ready + 语言切换），
 *   overlay 是 absolute，不参与文档流，重测不产生 CLS。
 * - 移动端每行只保留第一条墨线。
 * - reduced-motion：墨线一次性落终态。
 *
 * 注：旧版这里有一把「随词点亮而崩解的帧刻度尺」。它已上交 S5（M6 尺断）——
 * 同一个隐喻演两遍会互相削弱，本段留白就是给 S5 让位。
 */

import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { SectionShell } from '@/components/ui/SectionShell'
import { Rule } from '@/components/ui/Rule'
import { useSectionTrigger } from '@/components/scroll/useSectionTrigger'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { pick, useLocale } from '@/hooks/useLocale'
import { whatIsNarratage } from '@/lib/data/narrative'
import { DUR, EASE_GSAP, STAGGER } from '@/lib/motion/tokens'
import { orthPath } from '@/components/ui/Trace'
import { usesWordSpacing } from '@/lib/utils/segment'

/** 词直接以终态渲染（globals.css 的 `[data-word]{--w:0}` 由 inline style 覆盖）。 */
const WORD_LIT = { ['--w' as string]: 1 } as CSSProperties

/** 墨线横向伸出长度：clamp(24, 6vw, 88)（CREATIVE M3）。 */
function inkReach(stageWidth: number): number {
  return Math.round(Math.min(88, Math.max(24, stageWidth * 0.06)))
}

/**
 * 末端短刻度（直角折下）。行距 2.4 时词底还剩约 8.7px 半行距，
 * 6px 刻度落在行间空白里，不会碰到下一行的字。
 */
const INK_TICK = 6

/** 墨线所在的高度：与 globals.css 里 `bottom:-0.6em` 的词底锚点条同一水平线。 */
const INK_BASELINE = 8

interface InkGeom {
  w: number
  h: number
  lines: { id: string; d: string; at: number }[]
}

export interface WhatIsNarratageProps {
  className?: string
}

export function WhatIsNarratage({ className }: WhatIsNarratageProps) {
  const scope = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const anchorRefs = useRef<Map<string, HTMLElement>>(new Map())
  const { locale, t } = useLocale()
  const desktop = useIsDesktop()
  // 词间是否插真实空格：英文插，中文不插（切词规则见 lib/utils/segment.ts）。
  const spaced = usesWordSpacing(locale)

  /**
   * anchor 词清单（跨行连续编号）。移动端每行只留第一个 —— 窄屏画满墨线会糊成噪声。
   * 在渲染期决定而不是运行时改属性，锚点条是 ::after 绝对定位，切换不产生 CLS。
   */
  const anchorKeys = useMemo(() => {
    const keys: { key: string; at: number }[] = []
    const perLineTaken = new Set<number>()
    let total = 0
    const flat: { key: string; li: number; order: number }[] = []
    whatIsNarratage.lines.forEach((line, li) => {
      pick(line, locale).forEach((token, wi) => {
        if (!token.anchor) return
        flat.push({ key: `${li}:${wi}`, li, order: total })
        total += 1
      })
    })
    flat.forEach((entry) => {
      if (!desktop) {
        if (perLineTaken.has(entry.li)) return
        perLineTaken.add(entry.li)
      }
      keys.push({
        key: entry.key,
        // 与词的 stagger 同一条时间轴：先亮词，墨线随后长出。
        at: Number((Math.min(0.88, (entry.order / Math.max(1, total)) * 0.9)).toFixed(4)),
      })
    })
    return keys
  }, [locale, desktop])

  /** 渲染期查表：哪些词真的要画锚点条 + 墨线。 */
  const anchorSet = useMemo(() => new Set(anchorKeys.map((a) => a.key)), [anchorKeys])

  const [geom, setGeom] = useState<InkGeom | null>(null)

  /* ── 测量：把每个 anchor 词的右下角换算成 stage 局部坐标 ─────── */

  const measure = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return
    const box = stage.getBoundingClientRect()
    if (box.width === 0) return

    const reach = inkReach(box.width)
    const lines: InkGeom['lines'] = []

    anchorKeys.forEach(({ key, at }) => {
      const el = anchorRefs.current.get(key)
      if (!el) return
      const r = el.getBoundingClientRect()
      // 起点 = 词底锚点条的右端（globals.css 把锚点条画在 bottom:-0.6em）。
      const from = {
        x: Math.round(r.right - box.left),
        y: Math.round(r.bottom - box.top + INK_BASELINE),
      }
      const turn = { x: Math.min(Math.round(box.width - 1), from.x + reach), y: from.y }
      if (turn.x <= from.x + 6) return
      lines.push({
        id: key,
        at,
        d: orthPath([from, turn, { x: turn.x, y: turn.y + INK_TICK }], 0),
      })
    })

    setGeom({ w: Math.round(box.width), h: Math.round(box.height), lines })
  }, [anchorKeys])

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

  const hasGeom = geom !== null

  /* S2 是全站最安静的一屏。**逐词点亮已经取消** —— 那套机制（同一批 [data-word]
     属性、同一条 stagger）是 S5 的招牌手法，提前在这里演一遍等于把高潮花掉。
     这里只保留一件器械：墨线在进入视口时一次性画出来，正文本身直接是终态。 */
  useSectionTrigger(
    scope,
    ({ gsap, q, once, reduced }) => {
      const inks = q<SVGPathElement>('[data-ink]')
      if (inks.length === 0) return

      if (reduced) {
        gsap.set(inks, { strokeDashoffset: 0, opacity: 1 })
        return
      }

      gsap.fromTo(
        inks,
        { strokeDashoffset: 1, opacity: 0 },
        {
          strokeDashoffset: 0,
          opacity: 1,
          duration: DUR.mid,
          ease: EASE_GSAP.outQuart,
          stagger: STAGGER.row,
          scrollTrigger: once({ start: 'top 72%' }),
        },
      )
    },
    { deps: [locale, desktop, hasGeom] },
  )

  return (
    <SectionShell
      id="what"
      sec={2}
      eyebrow={whatIsNarratage.eyebrow}
      title={t(whatIsNarratage.title)}
      titleScale="movement"
      transition
      width="wide"
      // 乐章 I 的首段：movement 档，上方 312px 的边界把 READ 从 hero 里切出来
      rhythm="movement"
      className={className}
    >
      <div ref={scope} className="relative">
        <div ref={stageRef} className="relative max-w-[46rem]">
          {/* 墨线层：1px crimson 直角线，只在 anchor 词处出现（A3 INK RULE） */}
          {geom && geom.lines.length > 0 ? (
            <svg
              aria-hidden="true"
              viewBox={`0 0 ${geom.w} ${geom.h}`}
              width={geom.w}
              height={geom.h}
              fill="none"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
            >
              {geom.lines.map((line) => (
                <path
                  key={line.id}
                  data-ink
                  data-at={line.at}
                  d={line.d}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  className="stroke-crimson opacity-0 motion-reduce:opacity-100"
                />
              ))}
            </svg>
          ) : null}

          <div
            aria-label={t(whatIsNarratage.plain)}
            className="text-muted relative z-1 text-[length:var(--text-lead)] leading-[2.4]"
          >
            {whatIsNarratage.lines.map((line, li) => {
              const tokens = t(line)
              return (
                <p key={li} data-line={li} className="mb-block last:mb-0">
                  {tokens.map((token, wi) => {
                    const key = `${li}:${wi}`
                    const isAnchor = token.anchor && anchorSet.has(key)
                    return (
                      <Fragment key={wi}>
                        <span
                          data-word
                          style={WORD_LIT}
                          data-anchor={isAnchor ? '' : undefined}
                          ref={
                            isAnchor
                              ? (el) => {
                                  if (el) anchorRefs.current.set(key, el)
                                  else anchorRefs.current.delete(key)
                                }
                              : undefined
                          }
                        >
                          {token.t}
                        </span>
                        {spaced && wi < tokens.length - 1 ? ' ' : null}
                      </Fragment>
                    )
                  })}
                </p>
              )
            })}
          </div>
        </div>

        <Rule tick="r" className="mt-block" />

        <p className="text-text-1 mt-block max-w-prose text-[length:var(--text-lead)] leading-[1.6]">
          {t(whatIsNarratage.closing)}
        </p>
      </div>
    </SectionShell>
  )
}

export default WhatIsNarratage
