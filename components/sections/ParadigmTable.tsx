'use client'

/**
 * S11 · THE FIFTH PARADIGM —— ★ 招牌时刻 #3「吞噬 The Fifth Column」
 * （CREATIVE.md §3 招牌 #3 / M9；结构仍依 BLUEPRINT §1 S11）。
 *
 * 观众看到的是一个横向 pin 的**长镜头**：前四种旧范式以 0.34 倍速率向左漂，
 * Narratage 列以 1.0 倍速率从右方追上来。旧范式被推到视口左缘时不是滚出去——
 * 它们被**压扁**成一条 1px 竖线，钉在左边缘，旁边留一行竖排 mono 残骸标签。
 * 镜头结束时满屏只剩第五列，左侧四条线像书脊上的四道折痕。
 *
 * 三种形态由 React 媒体查询决定，写在根节点的 `data-mode` 上，CSS 单独响应：
 *  - `pin`   桌面：横向 pin 滚动 + 塌缩 + 书脊残骸；
 *  - `swipe` 移动端：**放弃 pin**（M9 移动端条目），原生 `overflow-x-auto` +
 *            `scroll-snap-type: x mandatory`，IntersectionObserver 点亮当前列；
 *            塌缩取消，改为「已滑过的列顶部留一道 crimson 短刻度」；
 *  - `stack` prefers-reduced-motion：纵向堆叠五张卡，无横向运动；
 *            前四张卡顶部各标一条短刻度表示「已被压缩」。
 *
 * 运动实现要点（§7.3 性能红线）：
 *  - pin 只有一个 ScrollTrigger（drift），列的 0.34 视差**不另开 trigger**，
 *    而是在 drift 的 onUpdate 里直接写 CSS 变量 `--pcx`，不进 React state；
 *  - 每列宽度只在 `onRefresh` 时用 offsetWidth 量一次，绝不在 onUpdate 里量；
 *  - 塌缩本身是**定时**动画（.5s / --ease-in-out-quint），由 class 切换触发 CSS transition，
 *    不做 scrub——CREATIVE 明确给了时长，scrub 会把「被压扁」的打击感磨平；
 *  - 辉光已按 BRAND.md §3「无阴影」取消，末列打勾改 crimson-soft 底 + 1px crimson 内描边。
 *
 * 明暗分级与打勾的初始隐藏都挂在 JS 才会写上的 `data-js` 上：禁用 JS 时全部内容常亮可读。
 * 文案全部来自 lib/data/paradigms.ts，组件内零硬编码；竖排残骸标签由 `paradigm` 派生。
 */

import { useEffect, useRef } from 'react'
import { paradigms, type Paradigm } from '@/lib/data/paradigms'
import { useLocale } from '@/hooks/useLocale'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useSectionTrigger } from '@/components/scroll/useSectionTrigger'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { SectionRule } from '@/components/ui/SectionRule'
import { RHYTHM, TITLE_SCALE } from '@/components/ui/SectionShell'
import { SCRUB } from '@/lib/motion/tokens'
import { hexIndex } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

/** 旧范式的漂移速率（M9）：1 - 0.34 = 0.66 的滞后补偿量按列宽计。 */
const LAG_RATE = 0.34
/** 塌缩后残留的宽度比例（scaleX 目标值）。 */
const CRUSHED_SCALE = 0.02
/**
 * 塌缩后**让出**的宽度比例。scaleX 不改变布局，塌掉的列会在轨道上留下一个整列宽的空洞，
 * 第五列就要隔着四个空洞才登场——镜头会散掉。所以每塌一列，其后所有列一起向左补进
 * 62% 列宽（纯 transform，与塌缩共用同一条 .5s 过渡），读起来正是「第五列追上来」。
 * 同时把 pin 的总行程按让出量扣掉，末帧才不会在第五列右侧留白。
 */
const PULL_RATE = 0.62

const CSS = `
[data-paradigms] [data-viewport]{
  overflow-x:auto; overflow-y:hidden; overscroll-behavior-x:contain;
  scroll-snap-type:x mandatory; scrollbar-width:thin;
}
[data-paradigms] [data-track]{ display:flex; align-items:stretch; width:max-content; gap:0; }
[data-paradigms] [data-col]{
  flex:0 0 auto; width:min(84vw,21rem); scroll-snap-align:center;
  background:var(--color-paper);
  translate:var(--pcx, 0px) 0;
  transition:opacity var(--dur-mid) var(--ease-out-quart);
}
[data-paradigms] [data-colinner]{
  display:flex; flex-direction:column; min-width:0; height:100%;
  border-left:1px solid var(--color-line);
  transform-origin:left center;
  transform:translate3d(var(--pull, 0px), 0, 0) scaleX(var(--crush, 1));
  transition:transform .5s var(--ease-in-out-quint),
             border-color var(--dur-mid) var(--ease-out-quart);
}
[data-paradigms] [data-col]:last-child [data-colinner]{ border-right:1px solid var(--color-line); }
/* 只有 JS 接管（挂上 data-js）后才做明暗分级；无 JS 时全部常亮可读 */
[data-paradigms][data-js] [data-col]{ opacity:.5; }
[data-paradigms] [data-col].is-lit{ opacity:1; }
[data-paradigms] [data-col][data-us].is-lit [data-colinner]{
  border-color:color-mix(in oklab, var(--color-crimson) 55%, transparent);
}

/* ── 末列打勾：默认收起，列点亮后逐条揭开 ───────────────── */
[data-paradigms] [data-tick]{
  transition:opacity .28s var(--ease-out-expo), transform .28s var(--ease-out-expo);
}
[data-paradigms][data-js] [data-tick]{ opacity:0; transform:translateX(-6px); }
[data-paradigms] [data-col].is-lit [data-tick]{ opacity:1; transform:translateX(0); }
[data-paradigms] [data-tick-mark]{
  transition:background-color .28s var(--ease-out-expo), box-shadow .28s var(--ease-out-expo);
}
[data-paradigms] [data-col].is-lit [data-tick-mark]{
  background:var(--color-crimson-soft);
  box-shadow:inset 0 0 0 1px var(--color-crimson);
  border-radius:3px; padding:.12em .22em;
}

/* ── 桌面横向 pin ───────────────────────────────────────── */
[data-paradigms][data-mode="pin"] [data-viewport]{
  position:relative; overflow:hidden; scroll-snap-type:none;
  height:100dvh; display:flex; align-items:center;
}
/* will-change 不写死在 CSS 里（P2-7）：轨道与 5+ 列常驻提升会一直占着合成层。
   由 pin 的 ScrollTrigger onToggle 在进出场时开关，抄仓内 usePinnedScene 的做法。 */
[data-paradigms][data-mode="pin"] [data-track]{
  padding-inline:clamp(1.25rem,6vw,7rem); height:min(84dvh,52rem);
}
[data-paradigms][data-mode="pin"] [data-col]{ width:clamp(20rem,32vw,28rem); }
[data-paradigms][data-mode="pin"] [data-colbody]{ overflow-y:auto; scrollbar-width:thin; }

/* ★ 塌缩：整列压成 2% 宽，内容从中线向内收拢（M9） */
[data-paradigms][data-mode="pin"] [data-col].is-crushed [data-colinner]{
  --crush:${CRUSHED_SCALE};
}
[data-paradigms][data-mode="pin"] [data-crushable]{
  transition:clip-path .5s var(--ease-in-out-quint), opacity .4s var(--ease-in-out-quint);
  clip-path:inset(0 0 0 0);
}
[data-paradigms][data-mode="pin"] [data-col].is-crushed [data-crushable]{
  clip-path:inset(0 49% 0 49%); opacity:0;
}

/* ★ 书脊：塌缩掉的旧范式在左边缘留下的四道折痕 */
[data-paradigms] [data-spines]{ display:none; }
[data-paradigms][data-mode="pin"] [data-spines]{
  position:absolute; z-index:2; inset-block:0; left:0;
  display:flex; align-items:stretch; gap:0;
  padding-left:clamp(1.25rem,6vw,7rem);
  padding-block:calc((100dvh - min(84dvh,52rem)) / 2);
  background:var(--color-paper); pointer-events:none;
}
/*
  书脊仍然动 width（P0-8 的唯一例外，有意为之）：四道折痕是**互相推挤**的，
  第 n 道出现时前 n-1 道必须真的让开位置，这个位移就是「旧范式被压扁后留下的
  厚度」本身，用 transform 伪造会让折痕互相重叠、语义直接失效。
  代价可控：spines 是 pin 视口内的绝对定位覆盖层（不参与文档流），
  子节点恒为 4 个，整页最多触发 4 次，不产生任何文档级 reflow。
*/
[data-paradigms] [data-spine]{
  display:flex; align-items:flex-start; gap:.5rem;
  width:0; opacity:0; overflow:hidden; white-space:nowrap;
  transition:width .5s var(--ease-in-out-quint), opacity .4s var(--ease-in-out-quint) .1s;
}
[data-paradigms] [data-spine].is-shown{ width:1.6rem; opacity:1; }
[data-paradigms] [data-spine-line]{
  flex:0 0 1px; align-self:stretch; background:var(--color-rule);
}
[data-paradigms] [data-spine].is-shown [data-spine-line]{ background:var(--color-crimson); }
[data-paradigms] [data-spine-label]{
  writing-mode:vertical-rl; text-orientation:mixed;
  font-size:9px; line-height:1; letter-spacing:.18em;
  color:var(--color-muted);
}

/* ── 移动端 swipe：不塌缩，已滑过的列顶部留一道 crimson 短刻度 ── */
/* 刻度是 transform，不是 width——逐帧动 width 会让整列跟着重排（P0-8）。 */
[data-paradigms] [data-passmark]{
  display:block; height:1px; width:2.25rem; background:var(--color-crimson);
  transform:scaleX(0); transform-origin:left center;
  transition:transform .32s var(--ease-out-expo);
}
[data-paradigms] [data-col].is-passed [data-passmark]{ transform:scaleX(1); }

/* ── reduced-motion：纵向堆叠 ───────────────────────────── */
[data-paradigms][data-mode="stack"] [data-viewport]{ overflow:visible; scroll-snap-type:none; }
[data-paradigms][data-mode="stack"] [data-track]{ flex-direction:column; width:100%; }
[data-paradigms][data-mode="stack"] [data-col]{
  width:100%; opacity:1; translate:none;
}
[data-paradigms][data-mode="stack"] [data-colinner]{
  border-left:0; border-right:0; border-top:1px solid var(--color-line);
}
[data-paradigms][data-mode="stack"] [data-tick]{ opacity:1; transform:none; }

@media (prefers-reduced-motion: reduce){
  [data-paradigms] [data-col]{ opacity:1; translate:none !important; }
  [data-paradigms] [data-colinner]{ transform:none !important; }
  [data-paradigms] [data-tick]{ opacity:1; transform:none; }
  [data-paradigms] [data-crushable]{ clip-path:none !important; opacity:1 !important; }
}
`

type Mode = 'pin' | 'swipe' | 'stack'

interface RowDef {
  key: string
  label: string
  value: string
}

export interface ParadigmTableProps {
  /** 锚点 id，默认 `paradigms`。 */
  id?: string
  className?: string
}

export function ParadigmTable({ id = 'paradigms', className }: ParadigmTableProps) {
  const root = useRef<HTMLElement>(null)
  const { t } = useLocale()

  const desktop = useIsDesktop()
  const reduced = useReducedMotion()
  const mode: Mode = reduced ? 'stack' : desktop ? 'pin' : 'swipe'

  /* 前四列（旧范式）的索引——第五列是我们，不参与塌缩。 */
  const oldCount = paradigms.rows.filter((r) => !r.isUs).length

  /* 桌面：横向 pin + 0.34 视差 + 塌缩。仅在 mode==='pin' 时建 trigger。 */
  useSectionTrigger(
    root,
    ({ gsap, ScrollTrigger, one, q }) => {
      if (mode !== 'pin') return
      const viewport = one('[data-viewport]')
      const track = one('[data-track]')
      if (!viewport || !track) return

      const cols = q('[data-col]')
      const inners = q('[data-colinner]')
      const spines = q('[data-spine]')
      const lagCols = cols.slice(0, oldCount)

      /** 每列的滞后补偿量与让出量（px），只在 refresh 时测量（§7.3）。 */
      let lag: number[] = []
      let pull: number[] = []
      let totalPull = 0
      const crushed: boolean[] = cols.map(() => false)

      const measure = () => {
        lag = lagCols.map((c) => c.offsetWidth * LAG_RATE)
        pull = lagCols.map((c) => c.offsetWidth * PULL_RATE)
        totalPull = pull.reduce((a, b) => a + b, 0)
      }
      measure()

      /** 轨道的真实行程 = 内容溢出量 - 塌缩让出的总宽度。 */
      const travel = () => Math.max(0, track.scrollWidth - viewport.clientWidth - totalPull)

      /** 把「已塌缩列让出的宽度」累加进其后每一列的 --pull（纯 transform，.5s 过渡）。 */
      const applyPull = () => {
        let acc = 0
        for (let j = 0; j < inners.length; j += 1) {
          inners[j].style.setProperty('--pull', `${(-acc).toFixed(2)}px`)
          if (crushed[j]) acc += pull[j] ?? 0
        }
      }

      const drift = gsap.to(track, {
        x: () => -travel(),
        ease: 'none',
        scrollTrigger: {
          trigger: viewport,
          start: 'top top',
          end: () => `+=${travel()}`,
          pin: viewport,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: SCRUB.loose,
          invalidateOnRefresh: true,
          // 必须用 onRefreshInit：start/end 在 refresh 期间求值，晚于它就来不及了
          onRefreshInit: measure,
          /* 合成层只在这一幕真的在演的时候存在（P2-7）。 */
          onToggle: (self) => {
            track.style.willChange = self.isActive ? 'transform' : 'auto'
            for (const col of cols) col.style.willChange = self.isActive ? 'translate' : 'auto'
          },
          /* 0.34 视差：旧范式列反向补偿，合成后它们只以 0.34 倍速率向左漂。
             纯 CSS 变量直写，不进 React state，不读 layout。 */
          onUpdate: (self) => {
            const p = self.progress
            for (let i = 0; i < lagCols.length; i += 1) {
              lagCols[i].style.setProperty('--pcx', `${(p * (lag[i] ?? 0)).toFixed(2)}px`)
            }
          },
        },
      })

      for (const [i, col] of cols.entries()) {
        /* ① 点亮：列进入镜头中段 */
        ScrollTrigger.create({
          trigger: col,
          containerAnimation: drift,
          start: 'left 78%',
          end: 'right 22%',
          toggleClass: { targets: col, className: 'is-lit' },
        })

        /* ② 塌缩：列的左缘触及视口左缘时被压扁，同时点亮对应的书脊折痕，
              其后所有列向左补进它让出的宽度。 */
        if (i >= oldCount) continue
        const spine = spines[i]
        ScrollTrigger.create({
          trigger: col,
          containerAnimation: drift,
          start: 'left left',
          end: 'right left',
          onEnter: () => {
            crushed[i] = true
            col.classList.add('is-crushed')
            spine?.classList.add('is-shown')
            applyPull()
          },
          onLeaveBack: () => {
            crushed[i] = false
            col.classList.remove('is-crushed')
            spine?.classList.remove('is-shown')
            applyPull()
          },
        })
      }
    },
    { deps: [mode, oldCount] },
  )

  /* 移动端：原生横滑 + IntersectionObserver 点亮 / 标记已滑过（M9 移动端条目）。 */
  useEffect(() => {
    const el = root.current
    if (!el) return
    el.dataset.js = ''
    const cols = Array.from(el.querySelectorAll<HTMLElement>('[data-col]'))
    if (cols.length === 0) return

    if (mode !== 'swipe') {
      // pin / stack 由 GSAP 或 CSS 负责；确保切换断点时不残留 IO 点亮态
      // 断点切换时清掉 pin 模式留下的内联量，避免残留形态
      for (const c of cols) {
        c.classList.remove('is-passed', 'is-crushed')
        c.style.removeProperty('--pcx')
        c.style.removeProperty('will-change')
        c.querySelector<HTMLElement>('[data-colinner]')?.style.removeProperty('--pull')
      }
      for (const s of el.querySelectorAll('[data-spine]')) s.classList.remove('is-shown')
      if (mode === 'stack') {
        cols.forEach((c, i) => {
          c.classList.add('is-lit')
          // 前四张卡顶部标一条短刻度：表示「已被压缩」
          c.classList.toggle('is-passed', i < oldCount)
        })
      }
      return
    }

    const viewport = el.querySelector<HTMLElement>('[data-viewport]')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const target = e.target as HTMLElement
          target.classList.toggle('is-lit', e.isIntersecting)
          // 已经从左侧滑出去的列 = 「被压缩」的旧范式，顶部留一道短刻度
          if (!e.isIntersecting && e.boundingClientRect.left < (e.rootBounds?.left ?? 0)) {
            target.classList.add('is-passed')
          }
        }
      },
      { root: viewport, threshold: 0.55 },
    )
    for (const c of cols) io.observe(c)
    return () => {
      io.disconnect()
      for (const c of cols) c.classList.remove('is-lit', 'is-passed')
    }
  }, [mode, oldCount])

  const columns = paradigms.columns

  return (
    <section
      ref={root}
      id={id}
      data-section={id}
      data-sec="11"
      data-hud-accent=""
      data-paradigms=""
      data-mode={mode}
      aria-labelledby={`${id}-title`}
      // 乐章 IV ARGUE 的首段：movement 档（间距唯一来源见 SectionShell 的 RHYTHM）
      className={cn('border-line relative isolate w-full border-t', RHYTHM.movement, className)}
    >
      {/* 乐章 IV「ARGUE」的入口线：全站五条章节转场之一（P0-4.3） */}
      <SectionRule />

      <style href="nrt-paradigms" precedence="default">
        {CSS}
      </style>

      <header className="mx-auto mb-block flex w-full max-w-shell flex-col gap-4 px-5 sm:px-8 lg:px-12">
        <Eyebrow variant="dot">{paradigms.eyebrow}</Eyebrow>
        <h2
          id={`${id}-title`}
          className={cn('text-text-0', TITLE_SCALE.default)}
        >
          {t(paradigms.rows[4].killer)}
        </h2>
        <p className="text-text-1 max-w-prose text-[length:var(--text-lead)] leading-[1.6]">
          {t(paradigms.intro)}
        </p>
      </header>

      <div data-viewport="">
        {/* 书脊：四道折痕，只在 pin 模式可见，逐条随塌缩点亮 */}
        <div data-spines="" aria-hidden="true">
          {paradigms.rows
            .filter((row) => !row.isUs)
            .map((row) => (
              <span key={row.id} data-spine="">
                <span data-spine-line="" />
                <span data-spine-label="">{t(row.paradigm).toUpperCase()}</span>
              </span>
            ))}
        </div>

        <div data-track="">
          {paradigms.rows.map((row, i) => (
            <ParadigmColumn key={row.id} row={row} index={i} columns={columns} />
          ))}
        </div>
      </div>
    </section>
  )
}

function ParadigmColumn({
  row,
  index,
  columns,
}: {
  row: Paradigm
  index: number
  columns: { key: string; label: { en: string; cn: string } }[]
}) {
  const { t } = useLocale()
  const us = Boolean(row.isUs)

  const values: Record<string, string> = {
    representatives: row.representatives.join(' · '),
    representationLayer: t(row.representationLayer),
    agentStory: t(row.agentStory),
    ceiling: t(row.ceiling),
    killer: t(row.killer),
  }

  const rows: RowDef[] = columns.map((c) => ({
    key: c.key,
    label: t(c.label),
    value: values[c.key] ?? '',
  }))

  return (
    <article
      data-col=""
      data-us={us || undefined}
      className={cn('flex min-w-0', us ? 'bg-crimson-soft' : 'bg-transparent')}
    >
      <div data-colinner="" className="w-full">
        {/* 移动端「已滑过」短刻度 / reduced-motion「已被压缩」标记 */}
        {!us ? <span data-passmark="" aria-hidden="true" /> : null}

        <header
          data-crushable=""
          className="border-line flex items-baseline gap-3 border-b px-4 py-4 sm:px-5"
        >
          <span
            className={cn(
              'shrink-0 font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.12em] uppercase',
              us ? 'text-crimson' : 'text-text-2',
            )}
          >
            {hexIndex(index + 1)}
          </span>
          <h3
            className={cn(
              'min-w-0 text-[length:var(--text-h3)] leading-[1.25] font-semibold tracking-[-0.018em]',
              us ? 'text-crimson' : 'text-text-0',
            )}
          >
            {t(row.paradigm)}
          </h3>
        </header>

        <div data-colbody="" data-crushable="" className="flex min-w-0 flex-1 flex-col">
          <dl className="flex min-w-0 flex-col">
            {rows.map((r) => (
              <div
                key={r.key}
                className="border-line min-w-0 border-b px-4 py-3.5 last:border-b-0 sm:px-5"
              >
                <dt className="text-text-2 font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] uppercase">
                  {r.label}
                </dt>
                <dd
                  className={cn(
                    'mt-2 min-w-0 text-sm leading-[1.6] break-words',
                    r.key === 'representatives' &&
                      'font-mono text-[length:var(--text-mono)] leading-[1.65]',
                    r.key === 'killer' ? (us ? 'text-crimson' : 'text-text-0') : 'text-text-1',
                  )}
                >
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>

          {row.note ? (
            <p className="border-line text-text-1 border-t px-4 py-3.5 text-sm leading-[1.6] sm:px-5">
              {t(row.note)}
            </p>
          ) : null}

          {us ? (
            <ul className="border-line-strong mt-auto flex flex-col gap-2.5 border-t px-4 py-4 sm:px-5">
              {paradigms.checklist.map((item, i) => (
                <li
                  key={i}
                  data-tick=""
                  style={{ transitionDelay: `${(i * 0.06).toFixed(2)}s` }}
                  className="text-text-0 flex min-w-0 items-start gap-2.5 text-sm leading-[1.5]"
                >
                  <span
                    data-tick-mark=""
                    aria-hidden="true"
                    className="text-crimson mt-[0.15em] shrink-0 font-mono text-[length:var(--text-mono)] leading-none"
                  >
                    ✓
                  </span>
                  <span className="min-w-0">{t(item)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default ParadigmTable
