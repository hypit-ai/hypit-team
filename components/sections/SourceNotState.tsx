'use client'

/**
 * S3 · SOURCE, NOT STATE —— 「翻面 The Impression」（CREATIVE.md M4 / 招牌时刻 #1）。
 *
 * 镜头：纸上一块半调网点版。滚动推进，网点**在原地**改变直径 ——
 * 从源码那一侧的均匀墨点，重排成一帧画面的灰阶（剪影 + 帧格边框）。
 * 网点数量不变、位置不变，只有直径在变：同一批墨点既是代码也是画面，
 * 中间没有导出、没有渲染器、没有第三种东西。
 *
 * 分段（scrub，桌面 pin `+=200%`）：
 *   p 0–.30   网点=源码密度，左栏代码可读；一条墨线从代码块牵向画格
 *   p .30–.72 主戏：网点直径插值到画面灰阶，剪影浮出（占一半行程，不要赶）
 *   p .72–1   帧格边框以墨线画出 + 四角裁切标记转 crimson + HUD 标签落位
 *
 * 实现约定：
 * - 本文件是**纯 DOM/CSS 版**的 Impression：`[data-impression-slot]` 是留给
 *   WebGL 版（components/three）的挂载位 —— 它是 S3 内部一个有明确 rect 的
 *   grid cell（`inset:0`、`pointer-events:none`），**不是全屏固定层**（§5.0 铁律 1/2）。
 *   canvas 未挂载时，下方的 CSS 半调层就是完整可用的静态降级。
 * - 滚动量只写 CSS 变量（`--dot` `--pic`）与 transform，不进 React state，
 *   不触发 layout/paint。
 * - 颜色只有 ink 与 crimson，均取自主题变量；无阴影、无圆角、无渐变主视觉。
 * - 移动端：不 pin，网点间距放大到 11px（网点数降到约 1/3）。
 * - reduced-motion：不建 trigger，直接落终态（画面态），墨线以最终态出现。
 */

import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { SectionShell } from '@/components/ui/SectionShell'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { useSectionTrigger } from '@/components/scroll/useSectionTrigger'
import { setScrollChannel, SCROLL_CHANNEL } from '@/components/scroll/scrollBus'
import { setImpressionProgress } from '@/components/three/impressionProgress'
import { useLocale } from '@/hooks/useLocale'
import { codeSamples } from '@/lib/data/code-samples'
import { sourceNotState } from '@/lib/data/source-state'
import { SCRUB } from '@/lib/motion/tokens'
import { orthPath } from '@/components/ui/Trace'

/** 网点间距（逻辑像素）。桌面 6，移动端 11（CREATIVE §5.1 uDotPitch）。 */
const PITCH_DESKTOP = 6
const PITCH_MOBILE = 11

export interface SourceNotStateProps {
  className?: string
}

export function SourceNotState({ className }: SourceNotStateProps) {
  const scope = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const codeRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const { locale, t } = useLocale()
  const sample = codeSamples[sourceNotState.codeSampleId]

  /** 代码块 → 画格的墨线（A3 语汇：1px crimson、只走直角）。 */
  const [ink, setInk] = useState<{ w: number; h: number; d: string } | null>(null)

  const measure = useCallback(() => {
    const stage = stageRef.current
    const code = codeRef.current
    const frame = frameRef.current
    if (!stage || !code || !frame) return
    const box = stage.getBoundingClientRect()
    if (box.width === 0) return
    const c = code.getBoundingClientRect()
    const f = frame.getBoundingClientRect()

    const from = {
      x: Math.round(c.right - box.left),
      y: Math.round(c.top - box.top + Math.min(c.height * 0.5, 180)),
    }
    const to = { x: Math.round(f.left - box.left), y: Math.round(f.top - box.top + 22) }
    // 画格在代码右侧（桌面双栏）才画牵引线；单栏时两者上下堆叠，横向牵线没有意义。
    if (to.x <= from.x + 24) {
      setInk(null)
      return
    }
    const mx = Math.round(from.x + (to.x - from.x) * 0.55)
    setInk({
      w: Math.round(box.width),
      h: Math.round(box.height),
      d: orthPath([from, { x: mx, y: from.y }, { x: mx, y: to.y }, to], 0),
    })
  }, [])

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
  }, [measure, locale])

  const hasInk = ink !== null

  useSectionTrigger(
    scope,
    ({ gsap, q, one, root, reduced, desktop }) => {
      const figure = one('[data-code-figure]')
      const codeLines = q('[data-code-line]')
      const plate = one('[data-plate]')
      const frame = one('[data-frame]')
      const crops = q('[data-crop]')
      const hudRows = q('[data-hud-row]')
      const inkPath = q<SVGPathElement>('[data-ink]')
      const pitch = desktop ? PITCH_DESKTOP : PITCH_MOBILE

      const setAll = (targets: Element[], vars: gsap.TweenVars) => {
        if (targets.length > 0) gsap.set(targets, vars)
      }

      if (plate) gsap.set(plate, { '--pitch': pitch })

      if (reduced) {
        // 终态 = 画面态。正文与代码永远保持可读（opacity 不低于 .35）。
        if (figure) gsap.set(figure, { opacity: 0.55 })
        if (plate) gsap.set(plate, { '--dot': pitch * 0.42, '--pic': 1 })
        setAll(crops, { '--lit': 1 })
        setAll(hudRows, { opacity: 1, y: 0 })
        setAll(inkPath, { strokeDashoffset: 0, opacity: 1 })
        if (frame) gsap.set(frame, { opacity: 1 })
        // WebGL 版同样落到终态（tier=static 时根本不挂 Canvas，这里只是兜底）。
        setImpressionProgress(1)
        setScrollChannel(SCROLL_CHANNEL.impression, 1)
        return
      }

      const stage = one('[data-stage]')

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: desktop ? '+=200%' : 'bottom top',
          scrub: SCRUB.base,
          pin: desktop ? stage : false,
          pinSpacing: desktop,
          anticipatePin: desktop ? 1 : 0,
          invalidateOnRefresh: true,
          // S3 是 uProgress 的**唯一**写方（impressionProgress.ts 的公开契约）。
          // 少了这一行，ImpressionScene 的 uProgress 恒为 0——WebGL 半调层
          // 会挂上去却永远停在源码态，招牌镜头 #1 整个不动。
          onUpdate: (self) => {
            setImpressionProgress(self.progress)
            setScrollChannel(SCROLL_CHANNEL.impression, self.progress)
          },
        },
      })

      // ── p 0–.30 · 网点还是源码那一侧；墨线把代码牵向画格 ──
      if (inkPath.length > 0) {
        tl.to(inkPath, { strokeDashoffset: 0, opacity: 1, ease: 'none', duration: 0.22 }, 0.04)
      }
      if (figure) {
        // 代码不消失，只退到次要层级（JS 挂掉也必须完整可读）。
        tl.to(figure, { opacity: 0.55, ease: 'none', duration: 0.3 }, 0)
      }
      if (codeLines.length > 0) {
        tl.to(
          codeLines,
          {
            opacity: 0.45,
            ease: 'none',
            duration: 0.1,
            stagger: { each: 0.3 / codeLines.length },
          },
          0,
        )
      }

      // ── p .30–.72 · 主戏：网点原地改直径，字形溶成画面 ──
      if (plate) {
        tl.fromTo(
          plate,
          { '--dot': pitch * 0.16, '--pic': 0 },
          { '--dot': pitch * 0.42, '--pic': 1, ease: 'none', duration: 0.42 },
          0.3,
        )
      }

      // ── p .72–1 · 帧格边框画出 + 裁切标记转 crimson + HUD 落位 ──
      setAll(crops, { '--lit': 0 })
      if (crops.length > 0) {
        tl.to(crops, { '--lit': 1, ease: 'none', duration: 0.12 }, 0.74)
      }
      if (hudRows.length > 0) {
        tl.fromTo(
          hudRows,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, ease: 'none', duration: 0.12, stagger: 0.04 },
          0.76,
        )
      }
    },
    { deps: [locale, hasInk] },
  )

  /**
 * WebGL 半调层一旦挂上（`[data-impression-slot]` 有子节点），DOM 半调层就退场。
 * 两者画的是同一批网点，叠在一起会变成一片糊，而不是「同一批墨点既是代码也是画面」。
 * 用 `:has()` 而不是 JS：挂载与卸载都由 R3F 决定，CSS 跟着 DOM 走最不容易失配。
 * `visibility` 一并关掉，避免透明层仍参与合成。
 */
const IMPRESSION_STAGE_CSS = `
[data-impression-stage]:has([data-impression-slot] > *) [data-plate] {
  opacity: 0;
  visibility: hidden;
  transition: opacity .35s linear;
}
`

/** 半调网点版：一层均匀网点 + 一层「画面」遮罩，直径由 --dot 驱动。 */
  const plateStyle: CSSProperties = {
    ['--pitch' as string]: PITCH_DESKTOP,
    ['--dot' as string]: PITCH_DESKTOP * 0.16,
    ['--pic' as string]: 0,
  }

  return (
    <SectionShell
      id="source"
      sec={3}
      hudAccent
      // P0-3 招牌镜头：不走 shell 报头、无分隔线、full-bleed、setpiece 节奏，
      // 让这一格顶到视口边缘。标题降级成正文里的图注。
      width="full"
      divider={false}
      rhythm="setpiece"
      labelledById="source-title"
      containerClassName="px-0"
      className={className}
    >
      <div ref={scope} className="relative">
        <div className="mx-auto mb-10 w-full max-w-shell px-5 sm:px-8 lg:px-12">
          <h2
            id="source-title"
            className="text-text-2 font-mono text-[length:var(--text-eyebrow)] leading-[1.9] tracking-[0.16em] uppercase"
          >
            {t(sourceNotState.title)}
          </h2>
          <p className="text-text-1 mt-4 max-w-prose text-[length:var(--text-lead)] leading-[1.6]">
            {t(sourceNotState.lead)}
          </p>
        </div>

        <div
          data-stage
          className="relative mx-auto flex min-h-[70svh] w-full max-w-[min(100%,88rem)] flex-col justify-center gap-10 px-5 sm:px-8 lg:min-h-[86svh] lg:px-12"
        >
          <div ref={stageRef} className="relative min-w-0">
            {/* 墨线：代码 → 画格。1px crimson、只走直角、dasharray 生长 */}
            {ink ? (
              <svg
                aria-hidden="true"
                viewBox={`0 0 ${ink.w} ${ink.h}`}
                width={ink.w}
                height={ink.h}
                fill="none"
                className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full lg:block"
              >
                <path
                  data-ink
                  d={ink.d}
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1}
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                  className="stroke-crimson opacity-0 motion-reduce:opacity-100"
                />
              </svg>
            ) : null}

            <div className="relative z-1 grid min-w-0 items-start gap-10 lg:grid-cols-12">
              {/* 左：源码 —— 它才是这支视频本身 */}
              <div ref={codeRef} data-code-figure className="min-w-0 lg:col-span-6">
                <CodeBlock
                  lines={sample.lines}
                  lang={sample.lang}
                  filename={sample.filename}
                  meta={sample.meta}
                  // 按**整行**收尾：26rem 会把第 16 行拦腰切掉，看起来像渲染错误。
                  // 15 行 = 15×26px + 上下 12px，裁切正好落在行距边界上；
                  // 「下面还有」由 CodeBlock 的 scroll-shadow 遮片说明（滚到底自动消失）。
                  maxLines={15}
                  ariaLabel={sample.filename}
                  lineAttr="data-code-line"
                />
              </div>

              {/* 右：压印版 —— 同一批墨点翻面成画面 */}
              <div className="min-w-0 lg:col-span-5 lg:col-start-8">
                <div
                  ref={frameRef}
                  data-frame
                  className="border-rule relative isolate w-full min-w-0 border"
                >
                  <div className="border-rule text-muted flex items-center justify-between gap-3 border-b px-3 py-2 font-mono text-[length:var(--text-eyebrow)] tracking-[0.16em] uppercase">
                    <span className="text-ink truncate">{sourceNotState.output.filename}</span>
                    <span className="flex shrink-0 gap-2">
                      {sourceNotState.output.tags.map((tag) => (
                        <span key={tag}>[{tag}]</span>
                      ))}
                    </span>
                  </div>

                  <div
                    data-impression-stage
                    className="relative aspect-video w-full overflow-hidden"
                  >
                    <style>{IMPRESSION_STAGE_CSS}</style>

                    {/* WebGL 版 Impression 的挂载位：section 内部、有明确 rect。
                        未挂载时下方 CSS 半调层即是完整降级 —— 两者互斥由
                        IMPRESSION_STAGE_CSS 的 :has() 真正保证（此前只是注释里的
                        一句声明，实际两层网点会叠加成一片糊）。 */}
                    <div
                      data-impression-slot
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-1 empty:hidden"
                    />

                    {/* 半调网点版（DOM 版）：网点位置固定，只有直径在变 */}
                    <div
                      data-plate
                      aria-hidden="true"
                      style={plateStyle}
                      className="absolute inset-0 z-0"
                    >
                      {/* 底层：均匀墨点场 —— 源码那一侧 */}
                      <div
                        className="absolute inset-0 opacity-70"
                        style={{
                          backgroundSize: 'calc(var(--pitch) * 1px) calc(var(--pitch) * 1px)',
                          backgroundImage:
                            'radial-gradient(circle at 50% 50%, var(--color-ink) calc(var(--dot) * 1px), transparent calc(var(--dot) * 1px + 0.6px))',
                        }}
                      />
                      {/* 上层：同一批网点被「画面」遮罩重排 —— 剪影 + 两条帧格线 */}
                      <div
                        className="absolute inset-0"
                        style={{
                          opacity: 'var(--pic)',
                          backgroundSize:
                            'calc(var(--pitch) * 1px) calc(var(--pitch) * 1px)',
                          backgroundImage:
                            'radial-gradient(circle at 50% 50%, var(--color-ink) calc(var(--dot) * 1.55px), transparent calc(var(--dot) * 1.55px + 0.6px))',
                          maskImage:
                            'radial-gradient(38% 54% at 50% 62%, #000 0%, #000 42%, transparent 78%), linear-gradient(to bottom, transparent 0 8%, #000 8% 9.2%, transparent 9.2% 90.8%, #000 90.8% 92%, transparent 92% 100%)',
                          WebkitMaskImage:
                            'radial-gradient(38% 54% at 50% 62%, #000 0%, #000 42%, transparent 78%), linear-gradient(to bottom, transparent 0 8%, #000 8% 9.2%, transparent 9.2% 90.8%, #000 90.8% 92%, transparent 92% 100%)',
                        }}
                      />
                    </div>

                    {/* 帧格齿孔：本站唯一合法的图形语汇（印样条） */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 z-2 h-[6px]"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(to right, var(--color-rule) 0 1px, transparent 1px 12px)',
                      }}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 z-2 h-[6px]"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(to right, var(--color-rule) 0 1px, transparent 1px 12px)',
                      }}
                    />

                    {/* 四角裁切标记：p>.72 转 crimson —— 全站仅三处的「重点」信号之一 */}
                    {CROPS.map((crop) => (
                      <span
                        key={crop.id}
                        data-crop
                        aria-hidden="true"
                        style={{ ['--lit' as string]: 0, ...crop.style }}
                        className="absolute z-2 block size-[12px]"
                      >
                        <span
                          className="absolute block"
                          style={{
                            color:
                              'color-mix(in oklab, var(--color-rule), var(--color-crimson) calc(var(--lit) * 100%))',
                            background: 'currentColor',
                            ...crop.arm.h,
                          }}
                        />
                        <span
                          className="absolute block"
                          style={{
                            color:
                              'color-mix(in oklab, var(--color-rule), var(--color-crimson) calc(var(--lit) * 100%))',
                            background: 'currentColor',
                            ...crop.arm.v,
                          }}
                        />
                      </span>
                    ))}

                    {/* HUD：三行读数只打标签 —— 帧数/时长/锚点都是编译产物，源码里一个都不存 */}
                    <div className="absolute inset-x-0 bottom-0 z-2 flex items-end justify-between gap-3 p-3">
                      {sourceNotState.hudLabels.map((label) => (
                        <span
                          key={label}
                          data-hud-row
                          className="text-crimson font-mono text-[length:var(--text-eyebrow)] tracking-[0.16em] uppercase"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="border-rule text-muted border-t px-3 py-2 text-sm">
                    {t(sourceNotState.output.note)}
                  </p>
                </div>

                <p className="text-muted mt-4 font-mono text-[length:var(--text-mono)] leading-[1.65]">
                  {t(sourceNotState.hudNote)}
                </p>
              </div>
            </div>
          </div>

          {/* 三段动线并成一行 mono 记号，不再是三等分栅格（P1-1） */}
          <p className="text-muted min-w-0 max-w-prose font-mono text-[length:var(--text-mono)] leading-[1.9]">
            {sourceNotState.flow.map((stage, i) => (
              <span key={stage.id}>
                {i > 0 ? <span className="text-rule px-2">→</span> : null}
                <span className={stage.id === 'compiler' ? 'text-crimson' : 'text-text-1'}>
                  {stage.label}
                </span>
              </span>
            ))}
          </p>
        </div>

        <p className="text-ink mt-block mx-auto w-full max-w-shell px-5 text-[length:var(--text-h2)] leading-[1.35] font-bold tracking-[-0.01em] sm:px-8 lg:px-12">
          <span className="block max-w-[46rem]">{t(sourceNotState.quote)}</span>
        </p>
      </div>
    </SectionShell>
  )
}

/** 四角 L 形裁切标记的几何（12px 臂长，1px 线）。 */
const CROPS = [
  {
    id: 'tl',
    style: { left: 8, top: 10 } as CSSProperties,
    arm: {
      h: { left: 0, top: 0, width: 12, height: 1 } as CSSProperties,
      v: { left: 0, top: 0, width: 1, height: 12 } as CSSProperties,
    },
  },
  {
    id: 'tr',
    style: { right: 8, top: 10 } as CSSProperties,
    arm: {
      h: { right: 0, top: 0, width: 12, height: 1 } as CSSProperties,
      v: { right: 0, top: 0, width: 1, height: 12 } as CSSProperties,
    },
  },
  {
    id: 'bl',
    style: { left: 8, bottom: 10 } as CSSProperties,
    arm: {
      h: { left: 0, bottom: 0, width: 12, height: 1 } as CSSProperties,
      v: { left: 0, bottom: 0, width: 1, height: 12 } as CSSProperties,
    },
  },
  {
    id: 'br',
    style: { right: 8, bottom: 10 } as CSSProperties,
    arm: {
      h: { right: 0, bottom: 0, width: 12, height: 1 } as CSSProperties,
      v: { right: 0, bottom: 0, width: 1, height: 12 } as CSSProperties,
    },
  },
] as const

export default SourceNotState
