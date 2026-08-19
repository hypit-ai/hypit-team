/**
 * S2 词级高亮叙事段（蓝图 §3.4）。
 *
 * tokens 由 `lib/utils/segment.ts` 在构建期切好并落盘为字面量：
 * 运行时零成本、零 hydration 抖动、零 CLS。
 * 改文案后重新生成，不要手改 token 数组的空格结构。
 *
 * 文案出处：BP「What is Narratage」段（中英双语原文压缩）。
 */

import type { L10n } from './types'

/** anchor=true 的词下方绘制 2px carbide 锚点条。 */
export interface WordToken {
  t: string
  anchor: boolean
}

export interface NarrativeLine {
  en: WordToken[]
  cn: WordToken[]
}

export interface NarrativeBlock {
  eyebrow: string
  title: L10n
  /** 无障碍用：给整段的完整原文（span 层是真实文本节点，可选中）。 */
  plain: L10n
  lines: NarrativeLine[]
  closing: L10n
}

const lines: NarrativeLine[] = [
  {
    en: [
      { t: "Video", anchor: false },
      { t: "models", anchor: false },
      { t: "generate", anchor: false },
      { t: "shots.", anchor: true },
      { t: "Generation", anchor: false },
      { t: "is", anchor: false },
      { t: "not", anchor: false },
      { t: "production.", anchor: true },
    ],
    cn: [
      { t: "视频", anchor: false },
      { t: "模型", anchor: false },
      { t: "能", anchor: false },
      { t: "生成", anchor: false },
      { t: "镜头", anchor: true },
      { t: "，", anchor: false },
      { t: "但", anchor: false },
      { t: "生成", anchor: false },
      { t: "不", anchor: false },
      { t: "等于", anchor: false },
      { t: "制作", anchor: true },
      { t: "。", anchor: false },
    ],
  },
  {
    en: [
      { t: "A", anchor: false },
      { t: "finished", anchor: false },
      { t: "video", anchor: false },
      { t: "is", anchor: false },
      { t: "a", anchor: false },
      { t: "script,", anchor: true },
      { t: "segments,", anchor: false },
      { t: "voice,", anchor: false },
      { t: "captions,", anchor: true },
      { t: "B-roll,", anchor: true },
      { t: "effects", anchor: false },
      { t: "and", anchor: false },
      { t: "a", anchor: false },
      { t: "render", anchor: true },
      { t: "—", anchor: false },
      { t: "structurally", anchor: false },
      { t: "related", anchor: false },
      { t: "in", anchor: false },
      { t: "ways", anchor: false },
      { t: "no", anchor: false },
      { t: "model", anchor: false },
      { t: "understands.", anchor: false },
    ],
    cn: [
      { t: "一支", anchor: false },
      { t: "成", anchor: false },
      { t: "片", anchor: false },
      { t: "是", anchor: false },
      { t: "脚本", anchor: true },
      { t: "、", anchor: false },
      { t: "段落", anchor: false },
      { t: "、", anchor: false },
      { t: "配音", anchor: false },
      { t: "、", anchor: false },
      { t: "字幕", anchor: true },
      { t: "、", anchor: false },
      { t: "B", anchor: false },
      { t: "-", anchor: false },
      { t: "roll", anchor: false },
      { t: "、", anchor: false },
      { t: "特效", anchor: false },
      { t: "和", anchor: false },
      { t: "渲染", anchor: true },
      { t: "，", anchor: false },
      { t: "它们", anchor: false },
      { t: "之间", anchor: false },
      { t: "的", anchor: false },
      { t: "结构", anchor: false },
      { t: "关系", anchor: false },
      { t: "，", anchor: false },
      { t: "模型", anchor: false },
      { t: "一无所知", anchor: false },
      { t: "。", anchor: false },
    ],
  },
  {
    en: [
      { t: "Timelines", anchor: true },
      { t: "organize", anchor: false },
      { t: "those", anchor: false },
      { t: "relationships", anchor: false },
      { t: "for", anchor: false },
      { t: "human", anchor: false },
      { t: "hands", anchor: true },
      { t: "and", anchor: false },
      { t: "eyes.", anchor: true },
      { t: "An", anchor: false },
      { t: "agent", anchor: true },
      { t: "cannot", anchor: false },
      { t: "drag", anchor: false },
      { t: "a", anchor: false },
      { t: "slider", anchor: false },
      { t: "or", anchor: false },
      { t: "align", anchor: false },
      { t: "a", anchor: false },
      { t: "clip", anchor: false },
      { t: "by", anchor: false },
      { t: "looking", anchor: false },
      { t: "at", anchor: false },
      { t: "it.", anchor: false },
    ],
    cn: [
      { t: "时间", anchor: false },
      { t: "线", anchor: false },
      { t: "用", anchor: false },
      { t: "来", anchor: false },
      { t: "组织", anchor: false },
      { t: "这些", anchor: false },
      { t: "关系", anchor: false },
      { t: "，", anchor: false },
      { t: "但", anchor: false },
      { t: "它是", anchor: false },
      { t: "为人", anchor: false },
      { t: "的", anchor: false },
      { t: "手", anchor: false },
      { t: "和", anchor: false },
      { t: "眼睛", anchor: true },
      { t: "设计", anchor: false },
      { t: "的", anchor: false },
      { t: "。", anchor: false },
      { t: "Agent", anchor: true },
      { t: "拖", anchor: false },
      { t: "不动", anchor: false },
      { t: "滑", anchor: false },
      { t: "块", anchor: false },
      { t: "，", anchor: false },
      { t: "也没", anchor: false },
      { t: "法", anchor: false },
      { t: "靠", anchor: false },
      { t: "目", anchor: false },
      { t: "视", anchor: false },
      { t: "对", anchor: false },
      { t: "齐", anchor: false },
      { t: "。", anchor: false },
    ],
  },
  {
    en: [
      { t: "SVML", anchor: true },
      { t: "replaces", anchor: false },
      { t: "the", anchor: false },
      { t: "timeline.", anchor: false },
      { t: "Nothing", anchor: false },
      { t: "is", anchor: false },
      { t: "pinned", anchor: false },
      { t: "to", anchor: false },
      { t: "seconds;", anchor: true },
      { t: "everything", anchor: false },
      { t: "is", anchor: false },
      { t: "anchored", anchor: false },
      { t: "to", anchor: false },
      { t: "words.", anchor: true },
    ],
    cn: [
      { t: "SVML", anchor: true },
      { t: "取代", anchor: false },
      { t: "时间", anchor: false },
      { t: "线", anchor: false },
      { t: "。", anchor: false },
      { t: "没有", anchor: false },
      { t: "任何", anchor: false },
      { t: "东西", anchor: false },
      { t: "钉在", anchor: false },
      { t: "秒", anchor: true },
      { t: "上", anchor: false },
      { t: "，", anchor: false },
      { t: "一切都", anchor: false },
      { t: "挂", anchor: false },
      { t: "在", anchor: false },
      { t: "词", anchor: true },
      { t: "上", anchor: false },
      { t: "。", anchor: false },
    ],
  },
]

export const whatIsNarratage: NarrativeBlock = {
  eyebrow: 'MOVEMENT I — READ',
  title: {
    en: 'A language and a compiler for complete videos.',
    cn: '一门语言，一套编译系统，产出完整的视频。',
  },
  plain: {
    en: "Video models generate shots. Generation is not production. A finished video is a script, segments, voice, captions, B-roll, effects and a render — structurally related in ways no model understands. Timelines organize those relationships for human hands and eyes. An agent cannot drag a slider or align a clip by looking at it. SVML replaces the timeline. Nothing is pinned to seconds; everything is anchored to words.",
    cn: "视频模型能生成镜头，但生成不等于制作。一支成片是脚本、段落、配音、字幕、B-roll、特效和渲染，它们之间的结构关系，模型一无所知。时间线用来组织这些关系，但它是为人的手和眼睛设计的。Agent 拖不动滑块，也没法靠目视对齐。SVML 取代时间线。没有任何东西钉在秒上，一切都挂在词上。",
  },
  lines,
  closing: {
    en: 'No timeline — videos are written, not dragged.',
    cn: '没有时间线 —— 视频是写出来的，不是拖出来的。',
  },
}
