/**
 * S12 · 第五种范式对比表（蓝图 §3.13）。
 * 内容压缩自 BP「Comparison（对比：第五种范式）」四节原文，代表产品名不增不减。
 */

import type { L10n } from './types'

export interface Paradigm {
  id: 'timeline' | 'canvas' | 'saas' | 'codeframework' | 'narratage'
  isUs?: boolean
  paradigm: L10n
  representatives: string[]
  representationLayer: L10n
  agentStory: L10n
  ceiling: L10n
  killer: L10n
  note?: L10n
}

export interface ParadigmTableData {
  eyebrow: string
  intro: L10n
  columns: { key: string; label: L10n }[]
  rows: Paradigm[]
  /** 末列彩蛋逐条打勾。 */
  checklist: L10n[]
}

export const paradigms: ParadigmTableData = {
  eyebrow: 'MOVEMENT IV — ARGUE',
  intro: {
    en: 'Every video production tool on the market falls into one of four paradigms. Each has a structural deficiency — not a missing feature, but a ceiling built into the paradigm. Narratage is not an improvement on any of them.',
    cn: '市面上所有视频制作方案都落进四种范式之一。每一种都有结构性缺陷 —— 不是功能不够，而是范式本身的天花板。Narratage 不是对其中任何一种的改良。',
  },
  columns: [
    { key: 'representatives', label: { en: 'Representatives', cn: '代表' } },
    { key: 'representationLayer', label: { en: 'Representation layer', cn: '表示层' } },
    { key: 'agentStory', label: { en: 'The agent story', cn: 'Agent 故事' } },
    { key: 'ceiling', label: { en: 'Structural ceiling', cn: '结构性天花板' } },
    { key: 'killer', label: { en: 'One-line hit', cn: '一句话打击面' } },
  ],
  rows: [
    {
      id: 'timeline',
      paradigm: { en: 'Timeline', cn: '时间线' },
      representatives: [
        'Adobe Premiere Pro',
        'Apple Final Cut Pro',
        'DaVinci Resolve',
        'CapCut',
        'Avid Media Composer',
        'Vegas Pro',
        'Filmora',
        'KineMaster',
      ],
      representationLayer: {
        en: 'What asset appears on what track at what timecode.',
        cn: '什么素材在什么时间点出现在什么轨道上。',
      },
      agentStory: {
        en: 'ChatCut drives a timeline through a ChatGPT plugin; the CapCut community reverse-engineered draft_content.json into an unofficial CLI and MCP servers; DaVinci ships Python/Lua scripting with headless mode.',
        cn: 'ChatCut 用 ChatGPT 插件让 Agent 操作时间线；CapCut 社区逆向 draft_content.json 做出非官方 CLI 和 MCP Server；DaVinci 提供 Python/Lua 脚本与 headless 模式。',
      },
      ceiling: {
        en: 'Every effort amounts to giving the timeline a proxy operator — the agent does exactly what a human does, with different hands.',
        cn: '所有努力的本质都一样：给时间线配一个代操的 Agent。它做的还是人做的那些事，只是换了一双手。',
      },
      killer: {
        en: 'A hundred different versions is beyond what the timeline can express.',
        cn: '做一百条不同版本，时间线范式没有这个表达能力。',
      },
    },
    {
      id: 'canvas',
      paradigm: { en: 'Canvas', cn: '画布' },
      representatives: ['ComfyUI', 'LibTV', 'Descript', 'Dify / n8n'],
      representationLayer: { en: 'Data flow between nodes.', cn: '节点之间的数据流。' },
      agentStory: {
        en: 'ComfyUI launched an official MCP and a human-readable DSL in 2026; LibTV puts scriptwriting, storyboarding, generation and editing on one infinite canvas with an Agent Skill protocol.',
        cn: 'ComfyUI 2026 年推出官方 MCP 与人类可读 DSL；LibTV 用无限画布 + 节点图 + Agent Skill 协议，把脚本、分镜、生成、剪辑放进同一个空间。',
      },
      ceiling: {
        en: 'You are wiring “image node → scale node → composite node,” not “cut to the product when the host says its name.” At scale the canvas becomes a few thousand lines of JSON.',
        cn: '你连的是「图片节点 → 缩放节点 → 合成节点」，不是「主持人说出产品名的时候切产品特写」。规模上去之后，画布变成几千行 json。',
      },
      killer: {
        en: 'A canvas is not source code: no diff, no merge, no code review, no CI.',
        cn: '画布不是源码：不能 diff，不能 merge，不能 code review，不能在 CI 里跑。',
      },
      note: {
        en: 'Higgsfield, RunwayML and Kling AI are generation platforms, not composition tools — downstream infrastructure Narratage calls, not same-layer competitors.',
        cn: 'Higgsfield、RunwayML、Kling AI 本质是生成平台而非合成工具 —— 它们是 Narratage 调用的下层基础设施，不是同层竞品。',
      },
    },
    {
      id: 'saas',
      paradigm: { en: 'Info-feed SaaS', cn: '信息流 SaaS' },
      representatives: [
        'Arcads',
        'HeyGen',
        'Creatify',
        'Synthesia',
        'MakeUGC',
        'TopView',
        'InVideo',
        'D-ID',
        'Colossyan',
        'Pictory',
      ],
      representationLayer: { en: 'A template plus a form.', cn: '一个模板加一张表单。' },
      agentStory: {
        en: 'The most an agent can do is fill in the form for you.',
        cn: 'Agent 能做的只是帮你填表单。',
      },
      ceiling: {
        en: 'Templates lock the visual structure; closed source blocks your own models and self-hosting; the same script generated twice yields two different videos.',
        cn: '模板锁死视觉结构；闭源意味着不能改流程、不能接自己的模型、不能自部署；同一段文案生成两次得到两条完全不同的视频。',
      },
      killer: {
        en: 'They are forms, not programming systems.',
        cn: '它们本质上是表单，不是编程系统。',
      },
    },
    {
      id: 'codeframework',
      paradigm: { en: 'Code video frameworks', cn: '代码视频框架' },
      representatives: ['Remotion', 'Revideo', 'MoviePy', 'Motion Canvas', 'Manim', 'FFmpeg scripting'],
      representationLayer: {
        en: 'Which pixel each element occupies on each frame.',
        cn: '每一帧画什么、每个元素在哪个像素、每段动画几秒。',
      },
      agentStory: {
        en: 'Programmable, batchable, reproducible — the closest of the four to Narratage.',
        cn: '可编程、可批量、可复现 —— 四个范式里离 Narratage 最近的一个。',
      },
      ceiling: {
        en: 'No semantic layer: no segment, no speaker, no “when this sentence is spoken.” And no generation — visuals are hand-coded React components or Python functions.',
        cn: '没有语义层：没有段落、没有说话人、没有「在这句话的时候」。也没有 AI 生成：画面是你手写的 React 组件或 Python 函数画出来的。',
      },
      killer: {
        en: 'Remotion can make stunning data visualizations. It cannot make “a host explaining a product.”',
        cn: 'Remotion 能做出惊艳的数据可视化，但做不了「主持人讲解产品」。',
      },
    },
    {
      id: 'narratage',
      isUs: true,
      paradigm: { en: 'Narratage', cn: 'Narratage' },
      representatives: ['SVML', 'Narratage compiler', 'Narratage runtime'],
      representationLayer: {
        en: 'Narrative intent: who speaks, what they say, what the words trigger.',
        cn: '叙事意图：谁在说、说什么、这些词触发什么。',
      },
      agentStory: {
        en: 'Structured text in, finished film out. Agents read and write it the way they read and write code.',
        cn: '结构化文本进，成片出。Agent 像读写代码一样读写它。',
      },
      ceiling: {
        en: 'The bottleneck is GPU concurrency, not human hands.',
        cn: '瓶颈是 GPU 并发数，不是人手。',
      },
      killer: {
        en: 'Others give you a faster editing desk. We remove the editing desk.',
        cn: '别人给你更快的剪辑台，我们取消剪辑台。',
      },
    },
  ],
  checklist: [
    { en: 'Diffable, mergeable, reviewable source', cn: '可 diff、可 merge、可 review 的源码' },
    { en: 'Anchored to words, never to seconds', cn: '锚定到词，从不锚定到秒' },
    { en: 'Partial rebuilds with explicit reuse', cn: '局部重建，复用是显式声明的' },
    { en: 'Your models, your keys, your machine', cn: '你的模型、你的 key、你的机器' },
    { en: 'A hundred versions from one source', cn: '一份源码，一百个版本' },
    { en: 'Open source, end to end', cn: '从头到尾开源' },
  ],
}
