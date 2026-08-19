/**
 * `/team` —— 完整团队页（蓝图 §1 子页表 / §7 T9）。
 *
 * 复用 `Team.tsx` 的 `variant="full"`（highlights 与创始人评语全文）+ `TeamLog`。
 * 纯 RSC 外壳：文案与 metadata 全部取自 `lib/data/*`，不硬编码。
 * metadata 随服务端解析出的语言走（cookie → Accept-Language → en）：
 * 中文用户拿到的 <title> / description 必须和正文同语言。
 */

import type { Metadata } from 'next'
import { Team } from '@/components/sections/Team'
import { TeamLog } from '@/components/sections/TeamLog'
import { MonoTag } from '@/components/ui/MonoTag'
import { team } from '@/lib/data/team'
import { pick } from '@/lib/i18n'
import { resolveLocale } from '@/lib/server/locale'
import type { L10n } from '@/lib/data/types'

/** 页面标题（`%s — Narratage` 模板的左半）。 */
const TITLE: L10n = { en: 'Team', cn: '团队' }

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale()
  const title = pick(TITLE, locale)
  const description = pick(team.hook, locale)

  return {
    title,
    description,
    alternates: { canonical: '/team' },
    openGraph: { type: 'website', url: '/team', title, description },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default function TeamPage() {
  return (
    <main>
      <div className="max-w-shell mx-auto flex w-full px-5 pt-6 sm:px-8 lg:px-12">
        <MonoTag label="INDEX" value="/" href="/" aria-label="Narratage" />
      </div>

      <Team variant="full" headingLevel={1} divider={false} />
      <TeamLog />
    </main>
  )
}
