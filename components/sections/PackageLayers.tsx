'use client'

/**
 * S8 · EVERYTHING IS PLUGIN —— 七层包架构（CREATIVE.md M8「七层视差堆叠」）。
 *
 * 排版：**档案表格**，但七层不再是同一张表里的七行，而是**七张各自独立的 1px 描边纸条**
 *      （共用一条表头栏）。这样它们才能各自位移——CREATIVE M8 要的是「一叠纸被抽开」。
 *      每层可展开（原生 <details>，CSS grid-rows 高度过渡，零 JS 布局抖动）。
 *
 * 动效（M8）：
 *  - 七层 translateY 速率 L1 .94 → L7 1.10 线性分布，滚动时层间产生开合；
 *    位移量 = (rate - 1) × PARALLAX_SPAN，桌面 span 300px（最大 ±15px），
 *    移动端速率区间压到 .98–1.03（几乎不动）。ease 恒 'none'，纯 translate3d。
 *  - 巨型章节字（从标题末词派生）以 0.72 速率反向漂，色 rule-soft，z-0。
 *    这是全站「巨型字反差」两处之一（另一处 S11）。
 *  - **没有淡入进场**：七层直接在位渲染，视差是这一段唯一的动效。
 * reduced-motion：全部速率 = 1.0（等于不动），巨型字静止。
 *
 * 纯 DOM，无 WebGL。GSAP 全部在 useGSAP scope 内创建并自动回滚；
 * getBoundingClientRect 只在 refresh 时经由 gsap 的函数式值求解，绝不在 onUpdate 里调。
 *
 * 文案全部来自 lib/data/architecture.ts。表头短语是 `PackageLayer` / `Facet`
 * 接口的**字段标识符**（level / name / owns / packages …），属结构元数据而非文案。
 */

import { useRef } from 'react'
import { SectionShell } from '@/components/ui/SectionShell'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { useSectionTrigger } from '@/components/scroll/useSectionTrigger'
import { useLocale } from '@/hooks/useLocale'
import {
  architectureIntro,
  coreQuote,
  disciplines,
  facets,
  layers,
  securityQuote,
  type Facet,
} from '@/lib/data/architecture'
import { SCRUB } from '@/lib/motion/tokens'
import { pad } from '@/lib/utils/format'

/* ── M8 视差参数 ────────────────────────────────────────────
   rate < 1 = 比正文慢（沉在底下），rate > 1 = 比正文快（浮在上面）。
   位移量 = (rate - 1) × SPAN，动画从 +amount/2 走到 -amount/2，
   所以 SPAN 就是「整段滚完时最快层与正文的相对行程」。 */
const LAYER_RATE = { desktopFrom: 0.94, desktopTo: 1.1, mobileFrom: 0.98, mobileTo: 1.03 } as const
const PARALLAX_SPAN = { desktop: 300, mobile: 220 } as const
/** 巨型章节字反向漂的速率（M8）。 */
const GIANT_RATE = 0.72
const GIANT_SPAN = 240

/** 巨型字取标题的**末词**（`Even the language is a plugin.` → `PLUGIN`）。
 *  纯派生，不新增文案；短词才能撑到 16vw 而不换行。 */
function giantWordOf(title: string): string {
  const word = title.trim().replace(/[.。！!？?]+$/, '').split(/\s+/).at(-1) ?? ''
  return word.toUpperCase()
}

const GIANT_WORD = giantWordOf(architectureIntro.title.en)

const CSS = `
[data-arch-stack]{ position:relative; isolation:isolate; }
[data-arch-giant]{
  position:absolute; z-index:0; pointer-events:none; user-select:none;
  right:0; top:50%; translate:0 -50%;
  font-size:clamp(80px,16vw,220px); line-height:.82; font-weight:700;
  letter-spacing:-0.06em; color:var(--color-rule-soft); white-space:nowrap;
}
[data-arch-rows]{ position:relative; z-index:1; }
/* 每张纸条自带纸底，层间轻微交错时后一张压住前一张，读起来才像叠纸 */
[data-layer]{
  background:var(--color-paper);
  translate:0 var(--pl-y, 0px);
}
@media (max-width: 47.99rem){
  [data-arch-giant]{ font-size:clamp(56px,22vw,120px); opacity:.5; }
}
@media (prefers-reduced-motion: reduce){
  [data-arch-giant]{ transform:none !important; }
  [data-layer]{ translate:none !important; }
}
`

/** 字段标识符（非文案）：与 PackageLayer / Facet 接口一一对应。 */
const FIELD = {
  level: 'level',
  name: 'name',
  owns: 'owns',
  packages: 'packages',
  facet: 'facet',
  abi: 'abi',
  authority: 'authority',
  chosenBy: 'chosen by',
} as const

const facetColumns: readonly DataTableColumn<Facet>[] = [
  {
    key: 'name',
    header: FIELD.facet,
    width: '10rem',
    cell: (row) => <span className="text-text-0">{row.name}</span>,
  },
  {
    key: 'abi',
    header: FIELD.abi,
    hideBelow: 'md',
    cell: (row) => <FacetText value={row.abi} />,
  },
  {
    key: 'authority',
    header: FIELD.authority,
    cell: (row) => <FacetText value={row.authority} />,
  },
  {
    key: 'chosenBy',
    header: FIELD.chosenBy,
    hideBelow: 'sm',
    cell: (row) => <FacetText value={row.chosenBy} />,
  },
]

function FacetText({ value }: { value: { en: string; cn: string } }) {
  const { t } = useLocale()
  return <span className="text-text-1">{t(value)}</span>
}

export function PackageLayers() {
  const root = useRef<HTMLDivElement>(null)
  const { t } = useLocale()

  useSectionTrigger(root, ({ gsap, q, one, scrub, reduced, desktop }) => {
    const rows = q('[data-layer]')
    if (!rows.length) return

    if (reduced) {
      gsap.set(rows, { clearProps: 'all' })
      return
    }

    /* M8 · 七层视差：各层速率线性铺开，滚动时层间开合。
       用 translateY 的**独立 tween**（属性名 `yPercent` 会与进场的 y 打架，
       所以视差写在每层的包裹节点 [data-layer] 的 `--pl-y` 上，由 CSS translate 消费）。 */
    const stack = one('[data-arch-stack]')
    const from = desktop ? LAYER_RATE.desktopFrom : LAYER_RATE.mobileFrom
    const to = desktop ? LAYER_RATE.desktopTo : LAYER_RATE.mobileTo
    const span = desktop ? PARALLAX_SPAN.desktop : PARALLAX_SPAN.mobile
    const last = Math.max(1, rows.length - 1)

    const parallaxRange = { start: 'top bottom', end: 'bottom top' } as const

    rows.forEach((rowEl, i) => {
      const rate = from + ((to - from) * i) / last
      const amount = (rate - 1) * span
      gsap.fromTo(
        rowEl,
        { '--pl-y': `${(amount / 2).toFixed(2)}px` },
        {
          '--pl-y': `${(-amount / 2).toFixed(2)}px`,
          ease: 'none',
          scrollTrigger: {
            ...scrub({ trigger: stack ?? rowEl, ...parallaxRange }, SCRUB.loose),
            // will-change 只在这一层真的在视口里滚动时存在（P2-7：不常驻）
            onToggle: (self) => {
              rowEl.style.willChange = self.isActive ? 'translate' : 'auto'
            },
          },
        },
      )
    })

    /* 巨型章节字反向漂（0.72 速率）。 */
    const giant = one('[data-arch-giant]')
    if (giant) {
      const amount = (GIANT_RATE - 1) * GIANT_SPAN
      gsap.fromTo(
        giant,
        { y: amount / 2 },
        {
          y: -amount / 2,
          ease: 'none',
          scrollTrigger: {
            ...scrub({ trigger: stack ?? giant, ...parallaxRange }, SCRUB.loose),
            onToggle: (self) => {
              giant.style.willChange = self.isActive ? 'transform' : 'auto'
            },
          },
        },
      )
    }

  })

  return (
    <SectionShell
      id="architecture"
      sec={8}
      title={t(architectureIntro.title)}
      lead={t(architectureIntro.lead)}
      className="scroll-mt-24"
    >
      <div ref={root} className="gap-block flex flex-col">
        <style href="nrt-arch-layers" precedence="default">
          {CSS}
        </style>

        {/* ── 档案表格：L1..L7，七张独立纸条（M8 视差需要各自位移）───── */}
        <div data-arch-stack className="w-full">
          <span aria-hidden="true" data-arch-giant>
            {GIANT_WORD}
          </span>

          <div
            aria-hidden="true"
            className="border-line bg-bg-0 text-text-2 relative z-1 grid grid-cols-[3rem_minmax(0,1fr)_4.5rem] items-center gap-x-3 border-x border-t border-b border-b-[color:var(--color-line-strong)] px-3 py-2.5 font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] uppercase md:grid-cols-[3rem_11rem_minmax(0,1fr)_4.5rem]"
          >
            <span>{FIELD.level}</span>
            <span>{FIELD.name}</span>
            <span className="hidden md:block">{FIELD.owns}</span>
            <span className="text-right">{FIELD.packages}</span>
          </div>

          <ul data-arch-rows className="m-0 list-none p-0">
            {layers.map((layer) => (
              <li key={layer.code} data-layer={layer.code} className="relative">
                <details className="group/layer border-line relative border-x border-b">
                  <span
                    aria-hidden="true"
                    className="bg-carbide pointer-events-none absolute inset-y-0 left-0 w-px origin-top scale-y-0 transition-transform duration-[var(--dur-mid)] ease-[var(--ease-out-cubic)] group-hover/layer:scale-y-100 group-open/layer:scale-y-100"
                  />
                  <summary className="grid min-h-11 cursor-pointer list-none grid-cols-[3rem_minmax(0,1fr)_4.5rem] items-baseline gap-x-3 px-3 py-3 transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)] hover:bg-bg-2 md:grid-cols-[3rem_11rem_minmax(0,1fr)_4.5rem] [&::-webkit-details-marker]:hidden">
                    <span className="font-mono text-[length:var(--text-eyebrow)] leading-none text-text-2 group-open/layer:text-carbide tracking-[0.12em] tabular-nums transition-colors duration-[var(--dur-base)]">
                      {layer.code}
                    </span>
                    <span className="text-text-0 min-w-0 font-mono text-[length:var(--text-mono)] leading-[1.65]">
                      {layer.name}
                    </span>
                    <span className="text-text-1 hidden min-w-0 truncate font-mono text-sm md:block">
                      {t(layer.owns)}
                    </span>
                    <span className="text-text-2 border-line group-open/layer:border-carbide group-open/layer:text-carbide justify-self-end border px-2 py-1 font-mono text-[length:var(--text-eyebrow)] leading-none tabular-nums transition-colors duration-[var(--dur-base)]">
                      {pad(layer.packages.length, 2)}
                    </span>
                  </summary>

                  <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-[var(--dur-mid)] ease-[var(--ease-out-quart)] group-open/layer:grid-rows-[1fr]">
                    <div className="overflow-hidden">
                      <div className="border-line mx-3 mb-4 flex flex-col gap-3 border-l pl-4">
                        <p className="text-text-1 max-w-prose text-sm leading-[1.7]">
                          {t(layer.owns)}
                        </p>
                        <ul className="m-0 flex list-none flex-wrap gap-x-2 gap-y-1 p-0">
                          {layer.packages.map((pkg) => (
                            <li
                              key={pkg}
                              className="border-line text-text-2 hover:text-text-0 hover:border-line-strong border px-2 py-1 font-mono text-[length:var(--text-eyebrow)] leading-none transition-colors duration-[var(--dur-base)]"
                            >
                              {pkg}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>

        {/*
          两条论断并排成双栏：单栏时每条都停在 624px，右侧 47% 是无意的空。
          并排后两栏各自仍在可读行长内，版心被真正填满。
        */}
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-2">
          <p className="text-text-1 max-w-prose text-[length:var(--text-lead)] leading-[1.6] lg:max-w-none">
            {t(coreQuote)}
          </p>

          <p className="text-text-1 max-w-prose text-[length:var(--text-lead)] leading-[1.6] lg:max-w-none">
            {t(securityQuote)}
          </p>
        </div>

        {/* ── 五种 facet（档案表格）────────────────────────── */}
        <div className="flex flex-col gap-4">
          <Eyebrow variant="dot">{FIELD.facet}</Eyebrow>
          <DataTable
            columns={facetColumns}
            rows={facets}
            rowKey={(row) => row.name}
            caption={t(architectureIntro.title)}
            minWidth="46rem"
          />
        </div>

        {/* ── 三条依赖铁律：清样式规则行，不是三张等宽卡 ────── */}
        <ul className="m-0 flex list-none flex-col p-0">
          {disciplines.map((d, i) => (
            <li
              key={d.id}
              // lg 起第四栏右对齐压着不变式的 id：右侧不是空，是承重的注解
              className="border-line grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 border-b py-4 last:border-b-0 md:grid-cols-[2.5rem_minmax(0,20ch)_minmax(0,1fr)] md:gap-x-6 lg:grid-cols-[2.5rem_minmax(0,20ch)_minmax(0,39rem)_minmax(0,1fr)]"
            >
              <span className="text-text-2 font-mono text-[length:var(--text-eyebrow)] leading-[1.9] tracking-[0.16em] tabular-nums uppercase">
                {pad(i + 1, 2)}
              </span>
              <h3 className="text-text-0 font-mono text-[length:var(--text-mono)] leading-[1.65] font-semibold">
                {t(d.title)}
              </h3>
              <p className="text-text-1 col-start-2 max-w-prose text-sm leading-[1.7] md:col-start-3">
                {t(d.body)}
              </p>
              <span
                aria-hidden="true"
                className="text-text-2 hidden font-mono text-[length:var(--text-eyebrow)] leading-[1.9] tracking-[0.12em] lg:col-start-4 lg:row-start-1 lg:block lg:justify-self-end"
              >
                {d.id}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  )
}

export default PackageLayers
