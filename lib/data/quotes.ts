/**
 * 留白处金句池（蓝图 §3.18）。仓库原文优先，source 标注出处。
 *
 * 只承担段落之间的空隙：任何已经在某一段正文里出现过的句子都不进池
 * （Harness / pay-after-confirm / free-open 已在 manifesto、pipeline、source-state
 * 里出现；"Humans edit video." 是 hero 的 headline，no-implicit-cache 是 S6 的
 * quote，core-neutral 是 S8 的 coreQuote —— 逐字重复会让全站读起来像复读，
 * 因此一律不进池）。
 */

import type { L10n } from './types'

export interface Quote {
  id: string
  text: L10n
  source?: string
}

export const quotes: Quote[] = [
  {
    id: 'pinned',
    text: {
      en: 'Pinned to words — regeneration shifts timing, yet B-roll and effects follow their words.',
      cn: '锚定到词 —— 重新生成会改变时长，但 B-roll 和特效依旧跟着它们的词走。',
    },
    source: 'README.md',
  },
  {
    id: 'batch',
    text: {
      en: 'The bottleneck is not human hands. It is GPU concurrency.',
      cn: '瓶颈不是人手，是 GPU 并发数。',
    },
  },
]

const index = new Map(quotes.map((q) => [q.id, q]))

export function quoteById(id: string): Quote | undefined {
  return index.get(id)
}
