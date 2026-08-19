/**
 * S5 · HOOK 招牌镜头（蓝图 §3.6）。
 *
 * 台词取自 docs/quickstart/script.md 的 combination example（meeting 段）。
 * spans 的 from/to 是 sentence 数组的下标（含首含尾）。
 * 其中包含一组交叉闭合（recap × proof）与一组同名非连续 Selection（beat）。
 */

import type { L10n } from './types'

export interface AnchorSpan {
  name: string
  kind: 'selection' | 'moment'
  from: number
  to?: number
}

export interface AffinityRow {
  marker: string
  meaning: L10n
}

export interface HookDemo {
  eyebrow: string
  title: L10n
  lead: L10n
  sentence: { en: string[]; cn: string[] }
  spans: AnchorSpan[]
  /** 显示用公式。锚点来自 Segment 边界与 token 边界（docs/quickstart/script.md §Segment Anchors）。 */
  formula: string
  formulaNote: L10n
  affinity: AffinityRow[]
  refExamples: string[]
  quote: L10n
  /** 重生成对照：语音变长后，锚点跟词走，时间码全错位。 */
  comparison: { beforeLabel: L10n; afterLabel: L10n; note: L10n }
}

export const hookDemo: HookDemo = {
  eyebrow: 'MOVEMENT II — BREAK',
  title: {
    en: 'Say the word, and the picture is already there.',
    cn: '说到哪个词，画面就在哪个词出现。',
  },
  lead: {
    en: 'A Selection marks a range, opened with @name and closed with @/name. A Moment marks a single point, fired with @name!. Neither one knows what a second is.',
    cn: 'Selection 标一段时间范围，用 @name 开启、@/name 关闭；Moment 标一个精确时间点，用 @name! 触发。两者都不认识「秒」。',
  },
  sentence: {
    en: [
      'I',
      'started',
      'sending',
      'BCC',
      'recaps',
      'after',
      'every',
      'meeting:',
      'timestamps,',
      'decisions,',
      'who',
      'said',
      'what.',
      'After',
      'the',
      'first',
      'recap,',
      'everything',
      'changed.',
    ],
    cn: [
      '我',
      '开始',
      '在',
      '每次',
      '会议',
      '后',
      '发',
      'BCC',
      '纪要',
      '：',
      '时间戳',
      '、',
      '决策',
      '、',
      '谁',
      '说了',
      '什么',
      '。',
      '第一份',
      '纪要',
      '之后',
      '，',
      '一切',
      '都',
      '变了',
      '。',
    ],
  },
  spans: [
    { name: 'solution', kind: 'selection', from: 0, to: 18 },
    // 交叉闭合：recap 先开、proof 后开，recap 先关、proof 后关。
    { name: 'recap', kind: 'selection', from: 3, to: 12 },
    { name: 'proof', kind: 'selection', from: 10, to: 16 },
    // 同名非连续：一个 id 出现两次，编译成带空隙的 SelectionSet。
    { name: 'beat', kind: 'selection', from: 8, to: 9 },
    { name: 'beat', kind: 'selection', from: 15, to: 16 },
    { name: 'ranking', kind: 'moment', from: 13 },
  ],
  formula: 'M Segments + N tokens → 2M + 2N semantic anchors',
  formulaNote: {
    en: 'Every Segment contributes a start and an end anchor; every token contributes its own two. A Hook aligned to a clip edge snaps to the Segment anchor, not to the first word — the tiny gap between them is exactly the drift editors chase by hand.',
    cn: '每个 Segment 贡献首尾两个锚点，每个词也贡献首尾两个。需要贴片段最前沿时，Hook 吸附到 Segment 起点而不是第一个词的起点 —— 两者之间那点时间差，正是剪辑师手动追的错位。',
  },
  affinity: [
    { marker: '@id', meaning: { en: 'Open, right-absorbing — starts at the next word', cn: '开启，右吸附 —— 从下一个词的起点开始' } },
    { marker: '~@id', meaning: { en: 'Open, left-absorbing — starts at the previous word’s end', cn: '开启，左吸附 —— 从上一个词的终点开始' } },
    { marker: '@/id', meaning: { en: 'Close, left-absorbing — ends at the previous word’s end', cn: '关闭，左吸附 —— 在上一个词的终点结束' } },
    { marker: '@/id~', meaning: { en: 'Close, right-absorbing — ends at the next word’s start', cn: '关闭，右吸附 —— 在下一个词的起点结束' } },
    { marker: '@id!', meaning: { en: 'Moment, right-absorbing — the point at the next word’s start', cn: 'Moment，右吸附 —— 时间点落在下一个词的起点' } },
    { marker: '~@id!', meaning: { en: 'Moment, left-absorbing — the point at the previous word’s end', cn: 'Moment，左吸附 —— 时间点落在上一个词的终点' } },
  ],
  refExamples: [
    '{story.selection.solution}',
    '{story.moment.ranking}',
    '{story.segment.meeting.dialogue}',
    '{story.caption.correspondence}',
  ],
  quote: {
    en: 'Pinned to words — regeneration shifts timing, yet B-roll and effects follow their words.',
    cn: '锚定到词 —— 重新生成会改变时长，但 B-roll 和特效依旧跟着它们的词走。',
  },
  comparison: {
    beforeLabel: { en: 'Timecodes · ——', cn: '时间码 · ——' },
    afterLabel: { en: 'Anchors · @recap', cn: '语义锚点 · @recap' },
    note: {
      en: 'Regenerate the take and the speech gets longer. Timecodes drift and every insert lands wrong; anchors move with the word they were written on.',
      cn: '重新生成一条，语音变长。时间码整体漂移、每个插入都落错位置；锚点跟着它当初写在的那个词一起移动。',
    },
  },
}
