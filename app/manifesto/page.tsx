import type { Metadata } from 'next'
import Link from 'next/link'
import { WhyWeBuiltThis } from '@/components/sections/WhyWeBuiltThis'
import { WhatWeAreNot } from '@/components/sections/WhatWeAreNot'
import { Origin } from '@/components/sections/Origin'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Rule } from '@/components/ui/Rule'
import { nav } from '@/lib/data/nav'
import { why } from '@/lib/data/manifesto'
import { pick } from '@/lib/i18n'
import { resolveLocale } from '@/lib/server/locale'
import type { L10n } from '@/lib/data/types'

const ROUTE = 'manifesto'

/** 页面标题（`%s — Narratage` 模板的左半）。 */
const TITLE: L10n = { en: 'Manifesto', cn: '宣言' }

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale()
  return {
    title: pick(TITLE, locale),
    description: pick(why.title, locale),
    alternates: { canonical: `/${ROUTE}` },
  }
}

/**
 * 子页 `/manifesto`：WHY / WHAT WE ARE NOT / ORIGIN 全文（prose 44rem）。
 * RSC —— 三个 section 各自是 client 组件，页面本身不需要 'use client'。
 * 页面级文案一律取自 lib/data（nav.brand / manifesto），路由名只用作 mono 面包屑。
 */
export default function ManifestoPage() {
  return (
    <main>
      <header className="mx-auto flex w-full max-w-prose flex-col gap-6 px-5 pt-24 pb-block sm:px-8">
        <Eyebrow variant="dot">{nav.brand.version}</Eyebrow>

        {/*
          页面 h1 只承担「这是哪一页」，不复述 section 里的句子：
          正文的三段（WHY / NOT / ORIGIN）各自带自己的 h2。
        */}
        <h1 className="text-text-0 text-[length:var(--text-h1)] leading-[1.02] font-bold tracking-[-0.035em]">
          <span className="text-text-2">{nav.brand.wordmark}</span>
          <span aria-hidden="true" className="text-carbide">
            /
          </span>
          <span className="uppercase">{ROUTE}</span>
        </h1>

        <Link
          href="/"
          className={[
            'text-text-2 hover:text-carbide inline-flex min-h-11 items-center gap-2 self-start',
            'font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] uppercase',
            'transition-colors duration-(--dur-base) ease-(--ease-out-quart)',
          ].join(' ')}
        >
          <span aria-hidden="true">←</span>
          {nav.brand.wordmark}
        </Link>

        <Rule variant="ruler" />
      </header>

      <WhyWeBuiltThis id="why" divider />
      <WhatWeAreNot id="not" />
      <Origin id="origin" />
    </main>
  )
}
