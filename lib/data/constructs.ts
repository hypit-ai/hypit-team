/**
 * S4 · Script 的四条语法（蓝图 §3.5）。
 *
 * 语法与正式名逐字取自仓库：README「Four constructs」表 +
 * docs/quickstart/script.md（Segment / Role Cue / Dual Text / Selection · Moment）。
 * 注意：示例里的 <hook> 只是一个普通 Segment 名，不是关键字（§8 红线 3）。
 */

import type { L10n } from './types'

export interface Construct {
  id: 'segment' | 'speaker' | 'split' | 'hook'
  index: string
  name: string
  /** 规范文档里的正式名，小字标注（D4）。 */
  formalName?: string
  /** 一行真实语法。 */
  syntax: string
  /** 一句痛点说明 —— 每条语法都来自真实的视频生产痛点，不是语言设计理论。 */
  painPoint: L10n
  expanded: { code: string; note: L10n }
}

export const constructsIntro: { eyebrow: string; title: L10n; sub: L10n } = {
  eyebrow: 'SEC/04',
  title: {
    en: 'The entire authoring surface is four constructs wide.',
    cn: '整个作者面，只有四个构造那么宽。',
  },
  sub: {
    en: 'None of them came from language design theory. Each one came from a production job that hurt.',
    cn: '没有一条来自语言设计理论，每一条都来自一次真实的生产痛点。',
  },
}

export const constructs: Construct[] = [
  {
    id: 'segment',
    index: '0x01',
    name: 'Segment',
    syntax: '<intro>…</intro>',
    painPoint: {
      en: 'Models cap out at 30 seconds — it was 15 not long ago — and the longer the take, the more a re-roll costs. Segments are generated, inspected, approved and retried one at a time.',
      cn: '模型生成有时长上限（曾经 15 秒，如今 30 秒），而片段越长，重生成的代价越高。Segment 让每一段单独生成、检查、确认、重试。',
    },
    expanded: {
      code: [
        '<script id="story">',
        '  <intro>',
        '    A compiler reads this file and returns a finished video.',
        '  </intro>',
        '  <demo>',
        '    Write your story, describe your intent, and the compiler assembles the film.',
        '  </demo>',
        '  <cta>',
        '    No timeline. No drag-and-drop. Just words in, video out.',
        '  </cta>',
        '</script>',
      ].join('\n'),
      note: {
        en: 'Lock intro when it is good; redo only demo when it is not. Duration is estimated per Segment, so pacing never races or crawls.',
        cn: 'intro 满意就锁定，demo 不满意只重做 demo。每段单独做时长预估，语速不会忽快忽慢。',
      },
    },
  },
  {
    id: 'speaker',
    index: '0x02',
    name: 'Speaker',
    formalName: 'Role Cue',
    syntax: '<HOST> … <GUEST> …',
    painPoint: {
      en: 'Multi-person video is the least AI-slop format there is — and the model has to know who speaks each line to pick the right face and the right voice.',
      cn: '多人视频是最不像 AI slop 的品类（街采、播客、短剧）。模型必须知道每句话由谁说出，才能用对人物形象和音色。',
    },
    expanded: {
      code: [
        '<hook>',
        '  <HOST>What tool do you use to make videos?',
        '  <GUEST>I write what I want to say, and the system',
        '    compiles it into a finished video.',
        '</hook>',
        '<reveal>',
        '  <HOST>Wait — you don’t touch a timeline?',
        '  <GUEST>No timeline. Narratage reads my script',
        '    and handles everything else.',
        '</reveal>',
      ].join('\n'),
      note: {
        en: 'A Role Cue has no close tag: a turn runs until the next cue or the end of the Segment. Captions style each role differently on their own.',
        cn: 'Role Cue 没有闭合标签，一段话持续到下一个 Cue 或段落结束。字幕系统据此自动区分角色样式。',
      },
    },
  },
  {
    id: 'split',
    index: '0x03',
    name: 'Split',
    formalName: 'Dual Text',
    syntax: '<$299 | two ninety-nine>',
    painPoint: {
      en: 'What the caption shows and what the model says are not the same string. Coined names get mispronounced; "9:30" has to be read as "nine thirty" to measure duration.',
      cn: '字幕显示的字和模型朗读的字经常不是一回事：自创产品名会读错，9:30 必须读成 nine thirty 才能准确测时长。',
    },
    expanded: {
      code: [
        '<intro>',
        '  This is <SVML | semantic video markup language>,',
        '    the open-source video compiler.',
        '  It costs <$0 | zero dollars> to get started.',
        '  Say <Narratage | nah-ruh-tahj> out loud once',
        '    and you have already read the manual.',
        '  And honestly? <no way | are you kidding me>.',
        '</intro>',
      ].join('\n'),
      note: {
        en: 'Left of the pipe is read; right of the pipe is heard. An empty left side is legal — < | um> is spoken and never captioned.',
        cn: '竖线左边是看的，右边是听的。左边可以为空：< | um> 只朗读、不显示。这是 N:M 映射，不是逐词替换。',
      },
    },
  },
  {
    id: 'hook',
    index: '0x04',
    name: 'Hook',
    formalName: 'Selection / Moment',
    syntax: '@product … @/product · @ranking!',
    painPoint: {
      en: 'You already know while writing that the effect belongs on that word — but you cannot know its timecode before generation, so you go hunting for it frame by frame afterwards.',
      cn: '写稿时你就知道特效该出现在哪个词上，但生成前没人知道那个词落在第几秒，只能事后在剪辑软件里逐帧找。这是被当成理所当然的巨大后置工序。',
    },
    expanded: {
      code: [
        '<demo>',
        '  <HOST> @a One @b two @/a three @/b.',
        '</demo>',
        '',
        '<ecosystem>',
        '  <HOST> @ranking! Image generation, video generation, captions',
        '         and B-roll all become reusable components.',
        '</ecosystem>',
      ].join('\n'),
      note: {
        en: 'Selections mark ranges, Moments mark points. They nest, they cross, and they compile into SelectionSet and MomentSet values — never into seconds.',
        cn: 'Selection 标范围，Moment 标时间点。可嵌套、可交叉闭合，编译成 SelectionSet / MomentSet，从不编译成秒。',
      },
    },
  },
]

export interface ProjectionRow {
  source: string
  caption: string
  speech: string
  dialogue: string
}

/** 文本投影表（docs/quickstart/script.md 原文示例）。 */
export const projectionTable: ProjectionRow[] = [
  {
    source: '<ALICE> What time is it?',
    caption: 'What time is it?',
    speech: 'What time is it?',
    dialogue: 'ALICE: What time is it?',
  },
  {
    source: '<BOB> It’s 8:30.',
    caption: 'It’s 8:30.',
    speech: 'It’s 8:30.',
    dialogue: 'BOB: It’s 8:30.',
  },
  {
    source: 'We call it <SVML | semantic video markup language>.',
    caption: 'We call it SVML.',
    speech: 'We call it semantic video markup language.',
    dialogue: 'We call it semantic video markup language.',
  },
]

export const projectionNote: L10n = {
  en: 'One Script, three projections. Captions read, speech is heard, dialogue drives the generation prompt.',
  cn: '一份 Script，三种投影：caption 给眼睛，speech 给模型朗读，dialogue 喂生成 prompt。',
}
