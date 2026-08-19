/**
 * S6 · LOCAL RECOMPILE 招牌镜头（蓝图 §3.7）。
 * 事实依据：docs/quickstart/run.md —— 「Narratage has no implicit cache.
 * Reusing a result is explicit Run Graph authoring.」（§8 红线 7）
 */

import type { L10n } from './types'

export interface RecompileChip {
  id: string
  word: L10n
  /** 驱动 uFrame 色相偏移，取值限制在琥珀带内（±20），不引入第三种强调色。 */
  hue: number
}

export interface RecompileDemo {
  eyebrow: string
  title: L10n
  lead: L10n
  sentenceBefore: string[]
  /** 被替换的词在 sentenceBefore 中的下标。 */
  swapIndex: number
  chips: RecompileChip[]
  hud: { template: string; lines: number }
  /** 未改动的部分靠显式 Candidate 复用，不是缓存。 */
  reuseNote: L10n
  quote: L10n
}

export const recompileDemo: RecompileDemo = {
  eyebrow: 'SEC/06',
  title: {
    en: 'Change one word, and one line recompiles.',
    cn: '改掉一个词，就只有那一行重新编译。',
  },
  lead: {
    en: 'The Segment you edited is the only Operation the plan still needs. Everything you already approved comes back as an explicit Candidate.',
    cn: '你改过的那个 Segment，是计划里唯一还需要执行的 Operation。已经确认过的部分，全部作为显式 Candidate 回到图里。',
  },
  sentenceBefore: ['At', '$299,', 'best', 'home', 'espresso', 'I’ve', 'ever', 'had.'],
  swapIndex: 4,
  chips: [
    { id: 'espresso', word: { en: 'espresso', cn: 'espresso' }, hue: 0 },
    { id: 'pour-over', word: { en: 'pour-over', cn: 'pour-over' }, hue: 14 },
    { id: 'cold-brew', word: { en: 'cold brew', cn: 'cold brew' }, hue: -12 },
  ],
  hud: {
    template: 'recompile: {lines} line',
    lines: 1,
  },
  reuseNote: {
    en: 'Prior takes return through <build-record> and <satisfy>. The compiler prunes every Operation those Candidates replace — this is a new Build, not a continuation of the old one.',
    cn: '旧片段通过 <build-record> 和 <satisfy> 回来。编译器裁掉这些 Candidate 替代掉的全部 Operation —— 这是一次全新的 Build，不是上一次的续跑。',
  },
  quote: {
    en: 'Narratage has no implicit cache. Reusing a result is explicit Run Graph authoring.',
    cn: 'Narratage 没有隐式缓存。复用一个结果，是显式的 Run Graph 编写行为。',
  },
}
