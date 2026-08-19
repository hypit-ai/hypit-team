'use client'

/**
 * S9 · BUILD —— Write → Generate → Align → Render，然后是账单。
 *
 * 这一段是 S9(PIPELINE) 与 S10(DURABLE BUILD) 合并后的结果：原来两段是同一个版式
 * 背靠背（4-up 编号卡网格 → 宽终端 + 窄右栏清单）演了两遍。现在只有一次四步，
 * 一次终端，一次账单：**流程**说清楚要做什么，**账单**说清楚花多少钱。
 *
 * 四步不再是四张等宽卡片（那是 LLM 默认输出的形状），而是一条**行式时间轴**：
 * 一行一步，编号靠左悬挂，包清单收在同一行的 <details> 里。
 *
 * 动效：只剩一件器械 —— 步骤条随滚动 scrub 填充（rail scaleX，ease:'none'），
 *      当前步及之前的步骤挂 `data-lit`。没有任何淡入位移进场。
 *      终端逐行打字由 Terminal 组件自带。
 * reduced-motion → 全部步骤直接点亮。
 */

import { useRef, useState } from 'react'
import { SectionShell } from '@/components/ui/SectionShell'
import { Counter } from '@/components/ui/Counter'
import { Terminal } from '@/components/ui/Terminal'
import { useSectionTrigger } from '@/components/scroll/useSectionTrigger'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { useLocale } from '@/hooks/useLocale'
import { durableFacts, durableIntro, durableSteps, pipeline, pipelineIntro } from '@/lib/data/pipeline'
import { cliCommands, terminals } from '@/lib/data/cli-demo'
import { SCRUB } from '@/lib/motion/tokens'
import { pad } from '@/lib/utils/format'

/** 字段标识符（非文案）：与 PipelineStep 接口一一对应。 */
const FIELD = { packages: 'packages', services: 'services' } as const

const cliFlow = terminals['cli-flow']
const planBill = terminals['plan-bill']

/** 账单摘要：全部从 plan-bill 脚本本身派生，不新增任何文案。 */
const billHeaderIndex = planBill.lines.findIndex((line) => line.text.trim() === 'operations')
const billLabel = billHeaderIndex >= 0 ? planBill.lines[billHeaderIndex].text.trim() : ''
const billOperations =
  billHeaderIndex >= 0
    ? planBill.lines.slice(billHeaderIndex + 1).filter((line) => line.text.includes('→'))
    : []
const billEndpoints = Array.from(
  new Set(
    billOperations
      .map((line) => line.text.split('→')[1]?.trim())
      .filter((value): value is string => Boolean(value)),
  ),
)

export function Pipeline() {
  const root = useRef<HTMLDivElement>(null)
  const desktop = useIsDesktop()
  const { t, locale } = useLocale()
  const [billOpen, setBillOpen] = useState<boolean | null>(null)
  const isBillOpen = billOpen ?? desktop
  const facts = t(durableFacts)

  useSectionTrigger(root, ({ gsap, q, one, scrub, ScrollTrigger, reduced }) => {
    const steps = q<HTMLElement>('[data-step]')
    const fill = one<HTMLElement>('[data-rail-fill]')
    if (!steps.length) return

    if (reduced) {
      for (const step of steps) step.setAttribute('data-lit', '')
      if (fill) gsap.set(fill, { scaleX: 1 })
      return
    }

    const range = { start: 'top 72%', end: 'bottom 72%' } as const

    if (fill) {
      gsap.fromTo(
        fill,
        { scaleX: 0 },
        { scaleX: 1, ease: 'none', scrollTrigger: scrub({ ...range }, SCRUB.tight) },
      )
    }

    let last = -1
    ScrollTrigger.create({
      ...scrub({ ...range }, SCRUB.tight),
      onUpdate: (self) => {
        const i = Math.min(steps.length - 1, Math.floor(self.progress * steps.length))
        if (i === last) return
        last = i
        steps.forEach((step, idx) => {
          if (idx <= i) step.setAttribute('data-lit', '')
          else step.removeAttribute('data-lit')
        })
      },
    })
  })

  return (
    <SectionShell
      id="pipeline"
      sec={9}
      title={t(pipelineIntro.title)}
      lead={t(durableIntro.lead)}
      className="scroll-mt-24"
    >
      <div ref={root} className="gap-block flex flex-col">
        {/* ── 四步：行式时间轴 ─────────────────────────────── */}
        <div className="flex flex-col">
          <div className="border-line relative h-px w-full border-t">
            <span
              aria-hidden="true"
              data-rail-fill
              className="bg-carbide absolute inset-x-0 -top-px h-px origin-left scale-x-0"
            />
          </div>

          <ol className="m-0 flex list-none flex-col p-0">
            {pipeline.map((step) => (
              <li
                key={step.key}
                data-step={step.key}
                /*
                  lg 起是四栏：序号 · 标题 · 正文(封顶 39rem 行长) · 包清单。
                  第四栏不是留白的装饰，它承重——每一步真正装了哪些包，
                  从正文里的折叠块移出来独立成栏，右侧才有东西压住版心。
                */
                className="border-line group/step grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-2 border-b py-6 sm:grid-cols-[4.5rem_minmax(0,18ch)_minmax(0,1fr)] sm:gap-x-6 lg:grid-cols-[4.5rem_minmax(0,16ch)_minmax(0,39rem)_minmax(0,1fr)]"
              >
                <span className="text-text-2 group-data-[lit]/step:text-carbide row-span-2 font-mono text-[length:var(--text-eyebrow)] leading-[1.9] tracking-[0.16em] tabular-nums uppercase transition-colors duration-[var(--dur-base)] sm:row-span-1">
                  {pad(step.n, 2)} <span className="hidden sm:inline">{step.key}</span>
                </span>

                <h3 className="text-text-1 group-data-[lit]/step:text-text-0 text-[length:var(--text-h3)] leading-[1.25] tracking-[-0.018em] font-semibold transition-colors duration-[var(--dur-base)]">
                  {t(step.title)}
                </h3>

                {/* lg:contents —— 这一层在 lg 上化掉，正文与包清单各自成栏 */}
                <div className="col-start-2 flex min-w-0 flex-col gap-3 sm:col-start-3 sm:row-start-1 lg:contents">
                  <p className="text-text-1 text-sm leading-[1.7] lg:col-start-3 lg:row-start-1 lg:min-w-0">
                    {t(step.body)}
                  </p>

                  <details className="group/pkg lg:col-start-4 lg:row-start-1 lg:min-w-0">
                    <summary className="text-text-2 hover:text-carbide flex min-h-11 cursor-pointer list-none items-center gap-2 font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] uppercase transition-colors duration-[var(--dur-base)] [&::-webkit-details-marker]:hidden">
                      <span aria-hidden="true" className="group-open/pkg:text-carbide">
                        [{step.packages.length + (step.services?.length ?? 0)}]
                      </span>
                      <span>{FIELD.packages}</span>
                    </summary>
                    <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-[var(--dur-mid)] ease-[var(--ease-out-quart)] group-open/pkg:grid-rows-[1fr]">
                      <div className="overflow-hidden">
                        <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-2 gap-y-1 p-0">
                          {step.packages.map((pkg) => (
                            <li
                              key={pkg}
                              className="border-line text-text-2 border px-2 py-1 font-mono text-[length:var(--text-eyebrow)] leading-none"
                            >
                              {pkg}
                            </li>
                          ))}
                        </ul>
                        {step.services?.length ? (
                          <div className="mt-3 flex flex-col gap-1">
                            <span className="text-text-2 font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] uppercase">
                              {FIELD.services}
                            </span>
                            <ul className="m-0 flex list-none flex-wrap gap-x-2 gap-y-1 p-0">
                              {step.services.map((service) => (
                                <li
                                  key={service}
                                  className="border-line-strong text-text-1 border px-2 py-1 font-mono text-[length:var(--text-eyebrow)] leading-none"
                                >
                                  {service}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </details>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* ── CLI 动线终端（顶到容器边，命令清单密排在下）───── */}
        <div className="flex flex-col gap-3">
          <Terminal
            lines={cliFlow.lines}
            title={cliFlow.title}
            ariaLabel={cliFlow.title}
            maxRows={desktop ? undefined : 6}
            bodyClassName="text-[12px] md:text-[length:var(--text-mono)]"
          />
          <ul className="m-0 flex list-none flex-wrap gap-x-2 gap-y-1 p-0">
            {cliCommands.map((command) => (
              <li
                key={command}
                className="text-text-2 border-line hover:text-text-0 border px-2 py-1 font-mono text-[length:var(--text-eyebrow)] leading-none transition-colors duration-[var(--dur-base)]"
              >
                {command}
              </li>
            ))}
          </ul>
        </div>

        {/* ── 账单预览：花钱前先看账单 ─────────────────────── */}
        <div className="flex flex-col gap-6">
          <h3 className="text-text-0 max-w-[24ch] text-[length:var(--text-h3)] leading-[1.22] tracking-[-0.018em] font-semibold">
            {t(durableIntro.title)}
          </h3>

          <details
            open={isBillOpen}
            onToggle={(event) => setBillOpen(event.currentTarget.open)}
            className="group/bill border-line min-w-0 border"
          >
            <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-3 py-3 [&::-webkit-details-marker]:hidden">
              <code className="text-text-0 font-mono text-[length:var(--text-mono)] leading-[1.65]">
                {durableSteps[0].command}
              </code>
              <span className="text-text-2 group-open/bill:text-carbide inline-flex items-center gap-2 font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] uppercase transition-colors duration-[var(--dur-base)]">
                <Counter
                  value={billOperations.length}
                  className="tabular-nums"
                  aria-label={`${billOperations.length} ${billLabel}`}
                />
                <span>{billLabel}</span>
              </span>
            </summary>

            <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-[var(--dur-mid)] ease-[var(--ease-out-quart)] group-open/bill:grid-rows-[1fr]">
              <div className="overflow-hidden">
                <div className="flex flex-col gap-3 px-3 pb-3">
                  <Terminal
                    lines={planBill.lines}
                    title={planBill.title}
                    ariaLabel={planBill.title}
                    typing={false}
                    className="border-line-strong"
                    bodyClassName="text-[12px] md:text-[length:var(--text-mono)]"
                  />
                  {billEndpoints.length ? (
                    <ul className="m-0 flex list-none flex-wrap gap-x-2 gap-y-1 p-0">
                      {billEndpoints.map((endpoint) => (
                        <li
                          key={endpoint}
                          className="border-line text-text-2 border px-2 py-1 font-mono text-[length:var(--text-eyebrow)] leading-none"
                        >
                          {endpoint}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          </details>

          {/* 事实清单：lg 起两栏并排——单栏时 624px 的行长会让右侧 47% 空掉 */}
          <ul className="m-0 flex list-none flex-col p-0 lg:grid lg:grid-cols-2 lg:gap-x-12">
            {facts.map((fact, i) => (
              <li
                key={fact}
                className="border-line text-text-1 flex gap-3 border-b py-3 text-sm leading-[1.7] last:border-b-0 lg:last:border-b"
                lang={locale === 'cn' ? 'zh-CN' : undefined}
              >
                <span
                  aria-hidden="true"
                  className="text-text-2 shrink-0 font-mono text-[length:var(--text-eyebrow)] leading-[1.9] tracking-[0.12em] tabular-nums"
                >
                  {pad(i + 1, 2)}
                </span>
                <span className="min-w-0 max-w-prose lg:max-w-none">{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  )
}

export default Pipeline
