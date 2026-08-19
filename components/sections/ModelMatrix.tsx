'use client'

/**
 * S10 · MODELS & PROVIDERS —— BYOK（蓝图 §1 S10 / §7 T7 / §9.1 M4）。
 *
 * 排版：9 个 Provider 包用**档案表格**（密排等宽 + 行首序号 + 行尾部署形态标签，
 *      标签由包名派生，不新增文案）；下方是作者包 × 模型家族矩阵。
 * 动效：**没有进场动画**——只有 hover 时格子边框转 crimson。这一段是 S11 之前的
 *      呼吸段（CREATIVE.md §2 留白规则），节奏走 `rhythm="flow"`。
 * 移动端：矩阵横向 `scroll-snap-type: x mandatory`（body 绝不横滚）。
 * 纯 DOM，不依赖 T3。
 *
 * 文案全部来自 lib/data/models.ts。
 */

import { SectionShell } from '@/components/ui/SectionShell'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { useLocale } from '@/hooks/useLocale'
import { models, type ProviderPkg } from '@/lib/data/models'

/** 字段标识符（非文案）：与 ProviderPkg / ModelEntry 接口一一对应。 */
const FIELD = {
  pkg: 'pkg',
  covers: 'covers',
  deployment: 'deployment',
  models: 'models',
  vendor: 'vendor',
  env: 'env',
  runtime: 'third party runtime',
  note: 'note',
} as const

const PROVIDER_PREFIX = '@narratage/provider-'

/** 部署形态从包名派生：…-local → local，…-aws-lambda → aws-lambda，否则取首段。 */
function deploymentOf(pkg: string): string {
  const tail = pkg.startsWith(PROVIDER_PREFIX) ? pkg.slice(PROVIDER_PREFIX.length) : pkg
  if (tail.endsWith('-local')) return 'local'
  if (tail.endsWith('-aws-lambda')) return 'aws-lambda'
  return tail.split('-')[0]
}

function CoversCell({ row }: { row: ProviderPkg }) {
  const { t } = useLocale()
  return <span className="text-text-1">{t(row.covers)}</span>
}

const providerColumns: readonly DataTableColumn<ProviderPkg>[] = [
  {
    key: 'pkg',
    header: FIELD.pkg,
    width: '22rem',
    cell: (row) => <span className="text-text-0">{row.pkg}</span>,
  },
  {
    key: 'covers',
    header: FIELD.covers,
    mono: false,
    cell: (row) => <CoversCell row={row} />,
  },
]

export function ModelMatrix() {
  const { t } = useLocale()

  return (
    <SectionShell
      id="models"
      sec={10}
      title={t(models.title)}
      lead={t(models.byokNote)}
      className="scroll-mt-24"
    >
      <div className="gap-block flex flex-col">
        {/* ── Provider 档案表格 ────────────────────────────── */}
        <DataTable
          columns={providerColumns}
          rows={models.providers}
          rowKey={(row) => row.pkg}
          caption={models.eyebrow}
          statusHeader={FIELD.deployment}
          status={(row) => ({
            label: deploymentOf(row.pkg),
            // 强调色只有 crimson，所以「本地 / 远程」的对照走 accent↔muted 的
            // 明度差，而不是冷暖两色。（曾经的 'cool' 枚举已连同 token 一起删除。）
            tone: deploymentOf(row.pkg) === 'local' ? 'accent' : 'muted',
          })}
          minWidth="48rem"
        />

        {/* ── 作者包 × 模型矩阵 ────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <Eyebrow variant="dot">{FIELD.models}</Eyebrow>
            <span className="text-text-2 font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] uppercase">
              {FIELD.vendor}
            </span>
          </div>

          <ul
            className="-mx-5 m-0 flex list-none snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3"
            aria-label={models.eyebrow}
          >
            {models.models.map((entry) => (
              <li
                key={entry.slug}
                data-model-entry=""
                className="border-line bg-bg-1 flex min-w-[78vw] shrink-0 snap-start flex-col gap-3 border p-4 sm:min-w-0 sm:shrink"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <code className="text-text-0 min-w-0 truncate font-mono text-[length:var(--text-mono)] leading-[1.65]">
                    {entry.authorModule}
                  </code>
                  <span className="text-text-2 font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] uppercase">
                    {entry.vendor}
                  </span>
                </div>
                <ul className="m-0 flex list-none flex-wrap gap-x-2 gap-y-2 p-0">
                  {entry.models.map((model) => (
                    <li
                      key={model}
                      data-cell={model}
                      className="border-line text-text-1 hover:border-carbide hover:text-text-0 border px-2 py-1 font-mono text-[length:var(--text-eyebrow)] leading-none transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)]"
                    >
                      {model}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          {/*
            注解不是正文：满宽墨线 + 左侧 mono 栏标把它标成脚注，
            624px 的行长因此是有意的窄，而不是没填满的空。
          */}
          <div className="border-line grid gap-x-6 gap-y-1 border-t pt-3 md:grid-cols-[6rem_minmax(0,1fr)]">
            <span className="text-text-2 font-mono text-[length:var(--text-eyebrow)] leading-[1.9] tracking-[0.16em] uppercase">
              {FIELD.note}
            </span>
            <p className="text-text-1 max-w-prose text-sm leading-[1.7]">{t(models.authorNote)}</p>
          </div>
        </div>

        {/* ── 接入成本：四个环境变量 + 第三方运行时 ────────── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
          <div className="flex flex-col gap-3">
            <Eyebrow variant="dot">{FIELD.env}</Eyebrow>
            <ul className="m-0 flex list-none flex-col p-0">
              {models.envVars.map((name) => (
                <li
                  key={name}
                  className="border-line text-text-1 border-b py-2 font-mono text-[length:var(--text-mono)] leading-[1.65] last:border-b-0"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Eyebrow variant="dot">{FIELD.runtime}</Eyebrow>
            <ul className="m-0 flex list-none flex-wrap gap-x-2 gap-y-2 p-0">
              {models.thirdPartyRuntime.map((name) => (
                <li
                  key={name}
                  className="border-line text-text-2 border px-2 py-1 font-mono text-[length:var(--text-eyebrow)] leading-none"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-line grid gap-x-6 gap-y-1 border-t pt-3 md:grid-cols-[6rem_minmax(0,1fr)]">
          <span className="text-text-2 font-mono text-[length:var(--text-eyebrow)] leading-[1.9] tracking-[0.16em] uppercase">
            {FIELD.note}
          </span>
          <p className="text-text-1 max-w-prose text-sm leading-[1.7]">{t(models.quotes.swap)}</p>
        </div>
      </div>
    </SectionShell>
  )
}

export default ModelMatrix
