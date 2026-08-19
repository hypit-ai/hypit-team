'use client'

/**
 * 页脚 —— 全站的收工版面。
 *
 * 形态是**版权页（colophon）**，不是四栏链接墙（P1-4）：一块密排等宽的
 * 键值清单，一行一条 —— 版本 / 许可证 / 源码 / 联系 / 编译日期。四列各占一格、
 * 每列一条 np-rule 起头的那套是通用页脚模板，与「校样」这个概念毫无关系；
 * 一份印刷品的版权页本来就是密排的一小块字，读者要找什么自己顺着行找。
 *
 * 站内锚点降为字标下的一行 mono 目录（与报头同一份 `nav.items`），不再独立成栏。
 *
 * 内容全部取自 `lib/data/links.ts` / `lib/data/nav.ts` / `lib/data/timeline.ts`，
 * 组件内零硬编码文案、零编造数据：编译日期就是仓库最后一条提交的真实日期。
 *
 * 左边缘那条 1px 竖线接住全站齿孔栏最后收束的那条线。
 * 字标按 BRAND §3.4 双色：前段 ink、末四字 crimson。
 *
 * 'use client' 的唯一原因：目录行要跟随 `useLocale()` 切换语言。
 */

import { cn } from '@/lib/utils/cn'
import { nav } from '@/lib/data/nav'
import { linkById } from '@/lib/data/links'
import { timeline } from '@/lib/data/timeline'
import { Rule } from './Rule'
import { LocaleSwitch } from './LocaleSwitch'
import { useLocale } from '@/hooks/useLocale'
import { scrollToTarget } from '@/components/scroll/SmoothScroll'
import { NAV_HEIGHT } from './Nav'

/** BRAND §3.4：字标双色，末四字（TAGE）走 crimson。 */
const WORDMARK_ACCENT_LEN = 4

/**
 * 版权页的行标签。这些是**字段名**（版面槽位），不是可翻译文案 ——
 * 与全站 mono 记号（SEC/ · MOTION[ON] · LANG[EN]）同一套语汇。
 */
const FIELD = {
  version: 'VERSION',
  license: 'LICENSE',
  source: 'SOURCE',
  docs: 'DOCS',
  chat: 'CHAT',
  contact: 'CONTACT',
  site: 'SITE',
  compiled: 'COMPILED',
} as const

const licenseLink = linkById('license')
const githubLink = linkById('github')
const docsLink = linkById('docs')
const discordLink = linkById('discord')
const emailLink = linkById('email')
const websiteLink = linkById('website')

/** 最后一条提交的日期 —— 真实数据，不是 `new Date()` 造出来的「今天」。 */
const compiledOn = timeline.entries[timeline.entries.length - 1]?.date ?? ''

interface ColophonRow {
  field: string
  value: string
  href?: string | null
  note?: string
}

const rows: ColophonRow[] = ([
  { field: FIELD.version, value: nav.brand.version },
  licenseLink
    ? {
        field: FIELD.license,
        value: licenseLink.label,
        href: licenseLink.url,
        note: licenseLink.note,
      }
    : null,
  githubLink
    ? { field: FIELD.source, value: githubLink.note ?? githubLink.label, href: githubLink.url }
    : null,
  docsLink ? { field: FIELD.docs, value: docsLink.label, href: docsLink.url } : null,
  discordLink ? { field: FIELD.chat, value: discordLink.label, href: discordLink.url } : null,
  emailLink
    ? { field: FIELD.contact, value: emailLink.label, href: emailLink.url, note: emailLink.note }
    : null,
  websiteLink ? { field: FIELD.site, value: websiteLink.label, href: websiteLink.url } : null,
  compiledOn ? { field: FIELD.compiled, value: compiledOn } : null,
] as (ColophonRow | null)[])
  .filter((row): row is ColophonRow => row !== null)
  // D9：url 明确为 null 的条目不上线，禁止渲染死链
  .filter((row) => row.href !== null)

export interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  const { t } = useLocale()
  const wordmark = nav.brand.wordmark
  const cut = Math.max(0, wordmark.length - WORDMARK_ACCENT_LEN)

  return (
    <footer
      className={cn('border-line relative z-1 w-full border-t', className)}
      aria-label={nav.brand.name}
    >
      <div className="relative mx-auto w-full max-w-shell px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
        {/* 齿孔栏落进页脚的那条线 */}
        <span
          aria-hidden="true"
          className="bg-rule-soft absolute top-0 bottom-14 left-5 w-px sm:left-8 lg:left-12"
        />

        <div className="flex flex-col gap-10 pl-6">
          {/* 字标 + 一行 mono 目录 */}
          <div className="flex min-w-0 flex-col gap-4">
            <p className="text-[length:var(--text-h1)] leading-none font-bold tracking-[-0.02em]">
              <span className="text-ink">{wordmark.slice(0, cut)}</span>
              <span className="text-crimson">{wordmark.slice(cut)}</span>
            </p>

            <nav aria-label={wordmark} className="flex flex-wrap items-center gap-x-5 gap-y-1">
              {nav.items.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
                    e.preventDefault()
                    scrollToTarget(item.href, { offset: -NAV_HEIGHT })
                  }}
                  className={cn(
                    'text-text-1 hover:text-crimson flex min-h-11 items-center font-mono',
                    'text-[length:var(--text-eyebrow)] tracking-[0.16em] uppercase',
                    'transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
                  )}
                >
                  {t(item.label)}
                </a>
              ))}
            </nav>
          </div>

          {/* ── 版权页：一块密排等宽，不分栏 ─────────────────── */}
          <Rule tick="l" />

          <dl className="m-0 flex flex-col">
            {rows.map((row) => (
              <div
                key={row.field}
                className={cn(
                  'border-rule grid items-baseline gap-x-4 border-b py-2 last:border-b-0',
                  'grid-cols-[7.5rem_minmax(0,1fr)] sm:grid-cols-[9rem_minmax(0,1fr)]',
                )}
              >
                <dt className="text-muted font-mono text-[length:var(--text-micro)] leading-[1.9] tracking-[0.18em] uppercase">
                  {row.field}
                </dt>
                <dd className="text-text-1 m-0 min-w-0 font-mono text-[length:var(--text-footer)] leading-[1.9]">
                  {row.href ? (
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="hover:text-crimson transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)]"
                    >
                      {row.value}
                    </a>
                  ) : (
                    <span>{row.value}</span>
                  )}
                  {row.note ? (
                    <span className="text-muted ml-3 text-[length:var(--text-micro)] tracking-[0.18em] uppercase">
                      {row.note}
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center justify-end gap-4">
            <LocaleSwitch />
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
