'use client'

/**
 * S14 · ORIGIN —— Narration + Montage（CREATIVE M10 上半）。
 *
 * 拼词动画：两个词向中间滑动合并成一个词，`--dur-stage / --ease-in-out-quint`，只播一次。
 * 实现方式是「真合并」而不是交叉淡入：
 *   narration → `narrat` + `ion`     （`narrat` 是 narration 与 narratage 的公共前缀）
 *   montage   → `mont`   + `age`     （`age`    是 narratage 去掉公共前缀后的剩余）
 * 动画把 `ion` / `mont` / 中缀 `+` 的宽度收到 0，剩下的字面拼接就是 `narratage`。
 * 切分完全由 `origin.parts` 推导，组件内不硬编码任何词面；推导失败时自动降级为整词淡入。
 *
 * 合并本身不走 GSAP：先用 JS 把三段当前宽度锁成 px（等 document.fonts.ready 之后，
 * 避免 webfont 换字宽），再由 IntersectionObserver 打上 `.is-merged`，
 * 交给 CSS transition 收到 0。这样移动端同样生效，且不依赖任何滚动库。
 *
 * 排版（CREATIVE §2 乐章 IV）：1933 年的引文是一幅**跨页剪报**——上下 1px 横切、
 * 满宽、纸纹。正文压到两段平排：悬挂式 mono 段号是 S12 的文体，全站只用一次。
 * 段内没有任何进场动画，唯一的运动就是那次拼词。
 * reduced-motion：跳过过渡，直接落到终态 `narratage`。
 * 无障碍：视觉层 aria-hidden，另给一条 sr-only 的完整表达式。
 */

import { useEffect, useRef } from 'react'
import { origin } from '@/lib/data/manifesto'
import { useLocale } from '@/hooks/useLocale'
import { RHYTHM, TITLE_SCALE } from '@/components/ui/SectionShell'
import { cn } from '@/lib/utils/cn'

/** 报纸纹理噪点（opacity .06）。 */
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='120' height='120' filter='url(%23g)'/></svg>\")"

/* 合并只走 transform/opacity —— 旧实现动的是 width + margin，900ms 里让整行
   逐帧重排（P0-8）。现在丢弃的三段原地 scaleX 收到 0，保留的后半段用一次
   translateX 补上空出来的宽度，合成层全程零 layout。 */
const CSS = `
[data-origin] [data-collapse],
[data-origin] [data-shift]{
  display:inline-block; white-space:nowrap; vertical-align:bottom;
  transition:transform var(--dur-stage) var(--ease-in-out-quint),
             opacity var(--dur-stage) var(--ease-in-out-quint);
}
[data-origin] [data-collapse]{ transform-origin:left center; }
/* 锁宽前不做任何视觉改变；锁宽后才允许收起 */
[data-origin].is-merged[data-locked] [data-collapse]{ transform:scaleX(0); opacity:0; }
[data-origin].is-merged[data-locked] [data-shift]{
  transform:translateX(calc(var(--merge-shift, 0px) * -1));
}
@media (prefers-reduced-motion: reduce){
  [data-origin] [data-collapse],
  [data-origin] [data-shift]{ transition:none; }
}
`

interface MergeParts {
  keepA: string
  dropA: string
  dropB: string
  keepB: string
}

/** 由 parts 推导可合并的四段；无法整齐拼出 result 时返回 null。 */
function deriveMerge(a: string, b: string, result: string): MergeParts | null {
  let i = 0
  while (i < a.length && i < result.length && a[i] === result[i]) i += 1
  const keepA = result.slice(0, i)
  const keepB = result.slice(i)
  if (keepA.length === 0 || keepB.length === 0) return null
  if (!b.endsWith(keepB)) return null
  return {
    keepA,
    dropA: a.slice(keepA.length),
    dropB: b.slice(0, b.length - keepB.length),
    keepB,
  }
}

export interface OriginProps {
  /** 锚点 id，默认 `origin`。 */
  id?: string
  divider?: boolean
  className?: string
}

const MERGE = deriveMerge(origin.parts[0], origin.parts[1], origin.parts[2])

export function Origin({ id = 'origin', divider = true, className }: OriginProps) {
  const root = useRef<HTMLElement>(null)
  const { t } = useLocale()
  const body = t(origin.body)

  /**
   * 拼词合并：不走 GSAP —— 先把三段的当前宽度锁成 px，再由 IntersectionObserver
   * 打上 `.is-merged`，宽度/透明度/外边距一起过渡到 0。纯 CSS 过渡，移动端同样生效。
   */
  useEffect(() => {
    const el = root.current
    if (!el) return
    const drops = Array.from(el.querySelectorAll<HTMLElement>('[data-collapse]'))
    const word = el.querySelector<HTMLElement>('[data-word-merge]')
    if (drops.length === 0 || !word) return

    let io: IntersectionObserver | null = null
    let cancelled = false

    const lockAndWatch = () => {
      if (cancelled) return
      // 一次性读出三段要消失的总宽度（含外边距），之后再无布局读取
      let shift = 0
      for (const d of drops) {
        const rect = d.getBoundingClientRect()
        const style = getComputedStyle(d)
        shift += rect.width + parseFloat(style.marginLeft) + parseFloat(style.marginRight)
      }
      word.style.setProperty('--merge-shift', `${shift.toFixed(2)}px`)
      el.dataset.locked = ''

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.classList.add('is-merged')
        return
      }
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            el.classList.add('is-merged')
            io?.disconnect()
          }
        },
        { threshold: 0.4 },
      )
      io.observe(word)
    }

    // 中文/西文 webfont 会改字宽，必须等字体就绪后再锁宽
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(lockAndWatch)
    } else {
      lockAndWatch()
    }

    return () => {
      cancelled = true
      io?.disconnect()
      el.classList.remove('is-merged')
      delete el.dataset.locked
      word.style.removeProperty('--merge-shift')
    }
  }, [])

  const [wordA, wordB, wordResult] = origin.parts

  return (
    <section
      ref={root}
      id={id}
      data-section={id}
      data-sec="14"
      data-origin=""
      aria-labelledby={`${id}-title`}
      className={cn(
        'relative isolate w-full overflow-hidden',
        RHYTHM.flow,
        divider && 'border-line border-t',
        className,
      )}
    >
      <style href="nrt-origin" precedence="default">
        {CSS}
      </style>

      {/* 报纸纹理 */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-1 opacity-[0.06] [mix-blend-mode:var(--grain-blend)]"
        style={{ backgroundImage: GRAIN }}
      />

      <div className="flex w-full flex-col gap-block">
        {/*
          全段只有一条版心轴：64rem，与下面剪报 figure 里的 blockquote 同宽。
          此前报头是居中的 39rem 窄栏浮在整幅 figure 之上，两个不同的居中宽度
          意味着两条不同的左边线——那正是「无意的错位」。
        */}
        <header className="mx-auto flex w-full max-w-[64rem] flex-col gap-6 px-5 sm:px-8">
          {/* 拼词：narration + montage → narratage */}
          <h2
            id={`${id}-title`}
            data-word-merge=""
            className={cn('text-ink', TITLE_SCALE.setpiece)}
          >
            <span className="sr-only">{`${wordA} + ${wordB} = ${wordResult}`}</span>
            {/* 相邻 span 之间没有空白文本节点，因此不会在拼接处断行 */}
            <span aria-hidden="true">
              {MERGE ? (
                <>
                  <span>{MERGE.keepA}</span>
                  <span data-collapse="" className="text-muted">
                    {MERGE.dropA}
                  </span>
                  <span data-collapse="" className="text-crimson mx-[0.22em]">
                    +
                  </span>
                  <span data-collapse="" className="text-muted">
                    {MERGE.dropB}
                  </span>
                  <span data-shift="">{MERGE.keepB}</span>
                </>
              ) : (
                <span>{wordResult}</span>
              )}
            </span>
          </h2>

        </header>

        {/* 1933 年的剪报：整幅跨页 figure，上下 1px 横切，不再是 S13 那块加了
            四角标的小方框（S13/S15 曾是同一模板复制两遍，P0-5）。 */}
        <figure
          data-clipping=""
          className="border-rule bg-paper-2/60 relative m-0 w-full border-y py-10 sm:py-14"
        >
          <blockquote className="text-text-1 mx-auto max-w-[64rem] px-5 font-mono text-[length:var(--text-lead)] leading-[1.75] sm:px-8">
            {t(origin.citation)}
          </blockquote>
        </figure>

        {/* 长文：lg 起分双栏，报纸正文的排法——每栏仍在可读行长内，
            版心被填满，而不是一条 39rem 的窄带挂在 64rem 的剪报下面。 */}
        <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-7 px-5 sm:px-8">
          <div className="lg:columns-2 lg:gap-x-12">
            {body.map((p, i) => (
              <p
                key={i}
                className="text-text-1 mb-7 text-[length:var(--text-body)] leading-[1.7] break-inside-avoid last:mb-0"
              >
                {p}
              </p>
            ))}
          </div>
          <p className="text-text-1 border-crimson border-l pl-5 text-[length:var(--text-lead)] leading-[1.6]">
            {t(origin.closing)}
          </p>
        </div>
      </div>
    </section>
  )
}

export default Origin
