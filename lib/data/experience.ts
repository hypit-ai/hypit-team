import type { L10n, L10nList } from './types'

export interface ExperienceStage {
  index: string
  verb: string
  title: L10n
  body: L10n
  signal: string
}

export interface ExperienceArtifact {
  index: string
  label: L10n
  title: L10n
  body: L10n
  metric: string
  tone: 'source' | 'graph' | 'relay'
}

export interface ExperienceManifesto {
  index: string
  lines: L10nList
}

export interface ExperienceFieldNote {
  index: string
  src: string
  width: number
  height: number
  alt: L10n
  caption: L10n
  signals: L10nList
  className: 'founder' | 'idea' | 'working' | 'alvin'
}

export const experience = {
  hero: {
    eyebrow: 'HYPIT AI · SHENZHEN · 2026',
    title: {
      en: "WE DON'T EDIT VIDEO. WE COMPILE INTENT.",
      cn: '我们不剪视频。我们编译意图。',
    },
    body: {
      en: 'Narratage turns narrative into source code — readable by people, executable by agents.',
      cn: 'Narratage 把叙事写成源码：人可以阅读，Agent 可以执行。',
    },
    scroll: { en: 'ENTER THE COMPILER', cn: '进入编译器' },
  },
  thesis: {
    index: '00 / THESIS',
    title: {
      en: 'A video should not collapse into a timeline.',
      cn: '视频，不该只剩下一条时间轴。',
    },
    body: {
      en: 'A timeline remembers operations, not intent. Narratage records why first, then resolves when, where and how an idea appears. The same narrative source can be inspected, revised and compiled again.',
      cn: '时间轴保存操作，不保存意图。Narratage 先记录「为什么」，再决定「何时、在哪里、怎样出现」。同一份叙事源码，可以被检查、修改、再次编译。',
    },
  },
  artifacts: [
    {
      index: 'A / LANGUAGE',
      label: { en: 'Narratage / SVML', cn: 'Narratage / SVML' },
      title: { en: 'Source, not state.', cn: '源码，而非状态。' },
      body: {
        en: 'Before pixels, there is readable source. Every render keeps the reason behind the frame.',
        cn: '像素之前，先有可读源码。每次渲染，都保留画面背后的理由。',
      },
      metric: '.svml',
      tone: 'source',
    },
    {
      index: 'B / SYSTEM',
      label: { en: 'Narrative graph', cn: '叙事图' },
      title: { en: 'Meaning owns time.', cn: '意义拥有时间。' },
      body: {
        en: 'Hooks bind intent to narrative anchors. Change one idea without breaking the whole film.',
        cn: 'Hook 把意图绑定到叙事锚点。修改一个想法，不必打碎整条片子。',
      },
      metric: 'HOOK[]',
      tone: 'graph',
    },
    {
      index: 'C / OUTPUT',
      label: { en: 'Hypit / runtime', cn: 'Hypit / 运行现场' },
      title: { en: 'SOURCE IN. WORK OUT.', cn: '源码进去，作品出来。' },
      body: {
        en: 'Whiteboard language enters the compiler. What leaves must be visible, editable and ready to render again.',
        cn: '白板上的语言进入编译器；出来的东西，必须能被看见、修改，并再次生成。',
      },
      metric: 'R→',
      tone: 'relay',
    },
  ] satisfies ExperienceArtifact[],
  fieldNotes: {
    index: '02 / FIELD NOTES',
    title: { en: 'NOT CAMPAIGN SHOTS. WORKING FRAMES.', cn: '不是宣传照。是工作留下的切片。' },
    body: {
      en: '“Video language” on one board; SVML, Hook and LLM diagrams on another. Around them: a shared table, several laptops, and one founder portrait that refused to look like a founder portrait.',
      cn: '一块白板写着「video language」，另一块画着 SVML、Hook 与 LLM。白板之外，是一张共用的长桌、几台电脑，以及一张拒绝像创始人肖像的创始人肖像。',
    },
    items: [
      {
        index: '02.1 / VIDEO LANGUAGE',
        src: 'https://video.wjsphy.top/hypit-team/founder.png',
        width: 1200,
        height: 2000,
        alt: { en: 'Two-panel editorial collage of Alvin in front of a whiteboard labelled high-level video language', cn: 'Alvin 在写有 high-level video language 的白板前，画面被编排成上下两段纸张拼贴' },
        caption: {
          en: 'The board asks for a high-level video language: developer-readable, editing-free and built to scale.',
          cn: '白板上的问题很直接：高级视频语言、开发者可读、摆脱剪辑操作，并能规模化。',
        },
        signals: {
          en: ['VIDEO LANGUAGE', 'DEVELOPER-READABLE', 'NO TIMELINE'],
          cn: ['视频语言', '开发者可读', '摆脱时间轴'],
        },
        className: 'founder',
      },
      {
        index: '02.2 / SVML ON A BOARD',
        src: 'https://video.wjsphy.top/hypit-team/idea.jpg',
        width: 1707,
        height: 1280,
        alt: { en: 'Alvin pointing to a Semantic Video Markup whiteboard with Hook, LLM and intent-to-material diagrams', cn: 'Alvin 指向写有 Semantic Video Markup、Hook、LLM 与意图到素材关系图的白板' },
        caption: {
          en: 'Intent, raw material, edit, overlay; Hook, encoders and an LLM — the system drawn before it was typeset.',
          cn: '意图、原始素材、剪辑、叠加层；Hook、编码器与 LLM —— 系统在成为代码前，先被画在这里。',
        },
        signals: {
          en: ['HOOK', 'LLM', 'INTENT → MATERIAL'],
          cn: ['HOOK', 'LLM', '意图 → 素材'],
        },
        className: 'idea',
      },
      {
        index: '02.3 / SAME TABLE',
        src: 'https://video.wjsphy.top/hypit-team/working.jpg',
        width: 1080,
        height: 1920,
        alt: { en: 'Several Hypit team members working on laptops around one shared office table', cn: '多位 Hypit 成员围着同一张办公室长桌使用电脑工作' },
        caption: {
          en: 'Not a team portrait: one table, several laptops, everyone already inside the work.',
          cn: '不是团队合影：一张长桌，几台电脑，每个人都已经在工作里。',
        },
        signals: {
          en: ['ONE TABLE', 'SEVERAL LAPTOPS', 'WORK IN PROGRESS'],
          cn: ['一张长桌', '几台电脑', '工作进行中'],
        },
        className: 'working',
      },
      {
        index: '02.4 / NO PORTRAIT SETUP',
        src: 'https://video.wjsphy.top/hypit-team/Alvin.jpg',
        width: 1280,
        height: 1707,
        alt: { en: 'Candid photo of Hypit founder Alvin eating fries at a McDonald’s', cn: 'Hypit 创始人 Alvin 在麦当劳吃薯条时的抓拍' },
        caption: {
          en: 'Alvin · founder. Fries, iced tea, and a portrait with no attempt to look official.',
          cn: 'Alvin · 创始人。薯条、冰红茶，以及完全没打算显得正式的一秒。',
        },
        signals: {
          en: ['FRIES', 'ICED TEA', 'NO PORTRAIT SETUP'],
          cn: ['薯条', '冰红茶', '没有肖像布景'],
        },
        className: 'alvin',
      },
    ] satisfies ExperienceFieldNote[],
  },
  stages: [
    {
      index: '3.0',
      verb: 'WRITE',
      title: { en: 'Write the intent.', cn: '写下意图。' },
      body: {
        en: 'Agents author narrative source instead of dragging a timeline they cannot see.',
        cn: 'Agent 编写叙事源码，而不是拖动一条它看不见的时间轴。',
      },
      signal: 'SOURCE / 01',
    },
    {
      index: '4.0',
      verb: 'ANCHOR',
      title: { en: 'Bind meaning to time.', cn: '把意义绑定到时间。' },
      body: {
        en: 'Narrative anchors give effects and assets a semantic home, not a brittle timestamp.',
        cn: '叙事锚点让效果与素材拥有语义归属，而不是脆弱的时间戳。',
      },
      signal: 'HOOK / 14',
    },
    {
      index: '5.0',
      verb: 'GRAPH',
      title: { en: 'Resolve the graph.', cn: '解析叙事图。' },
      body: {
        en: 'Content, layout and timing stay separate until the compiler resolves their relationships.',
        cn: '内容、布局与时间彼此分离，直到编译器解析它们之间的关系。',
      },
      signal: 'DAG / 88',
    },
    {
      index: '6.0',
      verb: 'COMPILE',
      title: { en: 'Ship the world.', cn: '编译成世界。' },
      body: {
        en: 'One durable source becomes frames, motion and sound — ready to inspect, revise and render again.',
        cn: '一份持久源码成为画面、运动与声音，并可继续检查、修改、再次渲染。',
      },
      signal: 'OUTPUT / ∞',
    },
  ] satisfies ExperienceStage[],
  manifestos: [
    {
      index: 'M / 01',
      lines: {
        en: ['IDEAS', 'BECOME WORLDS.'],
        cn: ['让想象', '成为世界。'],
      },
    },
    {
      index: 'M / 02',
      lines: {
        en: ['MEANING', 'OWNS TIME.'],
        cn: ['让意义', '拥有时间。'],
      },
    },
    {
      index: 'M / 03',
      lines: {
        en: ['SEVEN MINDS.', 'ONE COMPILER.'],
        cn: ['七个头脑。', '一个编译器。'],
      },
    },
  ] satisfies ExperienceManifesto[],
  team: {
    index: '07 / PEOPLE',
    title: { en: 'AVERAGE AGE: 20. BUILDING VIDEO AS A LANGUAGE.', cn: '平均 20 岁。把视频写成语言。' },
    body: {
      en: 'Seven people, from a 16-year-old high-school builder to multimodal researchers, infrastructure engineers, product designers and serial founders. No departmental relay race: language, product, content and distribution stay around the same source.',
      cn: '七个人，从 16 岁高中生，到多模态研究者、基础设施工程师、产品设计者与连续创业者。不按岗位接力：语言、产品、内容和分发，围着同一份源码一起构建。',
    },
  },
  footer: {
    index: '08 / NEXT',
    title: {
      en: 'THE NEXT CREATIVE MEDIUM WILL NOT BE DRAGGED. IT WILL BE COMPILED.',
      cn: '下一代创作媒介，不会被拖出来，而会被编译出来。',
    },
    source: { en: 'READ THE SOURCE', cn: '阅读源码' },
    contact: { en: 'BUILD WITH US', cn: '和我们一起构建' },
  },
} as const
