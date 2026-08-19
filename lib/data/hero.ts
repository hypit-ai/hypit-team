/** Hero（蓝图 §3.2 / S1）。metaLine 数字全部实测，见 stats.ts。 */

import type { L10n } from './types'

export interface HeroData {
  eyebrow: string
  headline: { line1: L10n; line2: L10n }
  lead: L10n
  /** "Built to kill Adobe." → text-fuse，全站 fuse 用量的第 1 处。 */
  warcry: L10n
  primaryCta: { label: L10n; linkId: string }
  secondaryCta: { label: L10n; linkId: string }
  metaLine: string[]
  /** 收尾段的引导句。 */
  closingLead: L10n
  closingCtaLinkIds: string[]
}

export const hero: HeroData = {
  eyebrow: 'SEC/00 — NARRATAGE v0.0.1',
  headline: {
    line1: { en: 'Humans edit video.', cn: '人剪视频。' },
    line2: { en: 'Agents compile it.', cn: 'Agent 编译视频。' },
  },
  lead: {
    en: 'The video programming language for AI agents.',
    cn: '面向 AI Agent 的视频编程语言与系统。',
  },
  warcry: { en: 'Built to kill Adobe.', cn: '生来就是为了终结 Adobe。' },
  primaryCta: { label: { en: 'Read the source', cn: '阅读源码' }, linkId: 'github' },
  secondaryCta: { label: { en: 'Join Discord', cn: '加入 Discord' }, linkId: 'discord' },
  metaLine: ['88 packages', '648 ts files', '9 providers', 'Narratage Open Source License'],
  closingLead: {
    en: 'Clone it, run it on your own keys, keep every frame you make.',
    cn: '克隆下来，用自己的 key 跑，产出的每一帧都归你。',
  },
  closingCtaLinkIds: ['github', 'discord', 'docs'],
}
