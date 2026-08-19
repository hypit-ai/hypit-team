/**
 * S17 · TEAM LOG（蓝图 §3.16）。
 * 日期与里程碑取自 hypit-ai/narratage 的真实提交历史（首次提交 2026-07-30，
 * 最新提交 2026-08-17），标题即当日 feat/docs 提交的语义摘要，不虚构日期。
 */

import type { L10n } from './types'

export interface LogEntry {
  date: string
  title: L10n
  body: L10n
  current?: boolean
}

export interface TimelineData {
  eyebrow: string
  title: L10n
  entries: LogEntry[]
  closing: { days: number; text: L10n }
}

export const timeline: TimelineData = {
  eyebrow: 'SEC/17',
  title: { en: 'Compile log', cn: '编译日志' },
  entries: [
    {
      date: '2026-07-30',
      title: { en: 'Initial commit · SVML Script Surface v1', cn: '第一次提交 · SVML Script Surface v1' },
      body: {
        en: 'The first spec lands the same day as the first commit: Segments, Role Cues, and a Script that reads nothing and is read by everything.',
        cn: '第一份规范和第一次提交同一天落地：Segment、Role Cue，以及一个「什么都不读、被所有人读」的 Script。',
      },
    },
    {
      date: '2026-07-31',
      title: { en: 'Deterministic SVML compiler prototype', cn: '确定性 SVML 编译器原型' },
      body: {
        en: 'The prototype compiles source into a graph and immediately gets rebaselined as v1.',
        cn: '原型把源码编译成图，当天就被 rebaseline 成 v1。',
      },
    },
    {
      date: '2026-08-01',
      title: { en: 'Script becomes authoritative for speech timing', cn: 'Script 成为语音时间的唯一权威' },
      body: {
        en: 'Timing stops belonging to the editor and starts belonging to the words.',
        cn: '时间不再属于剪辑台，开始属于词。',
      },
    },
    {
      date: '2026-08-03',
      title: { en: 'v2 core, Node driver, one-pass WhisperX alignment', cn: 'v2 核心、Node driver、单趟 WhisperX 对齐' },
      body: {
        en: 'Core and syntax split apart. Author frontends leave the Core for good, and script timing aligns from a single WhisperX pass.',
        cn: 'Core 与语法彻底分家：作者 Frontend 移出 Core，脚本时间由一趟 WhisperX 对齐得出。',
      },
    },
    {
      date: '2026-08-06',
      title: { en: 'Local media execution stack, author packages activated', cn: '本地媒体执行栈，作者包被激活' },
      body: {
        en: 'Compute facets, type validators, speech takes, alignment and caption lowering all lock into place on one day.',
        cn: 'compute facet、type validator、语音 take、对齐与字幕 lowering，同一天全部锁定。',
      },
    },
    {
      date: '2026-08-07',
      title: { en: 'The project is renamed Narratage', cn: '项目更名为 Narratage' },
      body: {
        en: 'narration + montage. A 1933 word for a 2026 compiler.',
        cn: 'narration + montage —— 1933 年造的词，2026 年的编译器。',
      },
    },
    {
      date: '2026-08-08',
      title: { en: 'Providers declare their own programs; AWS paths open', cn: 'Provider 自带程序声明，AWS 路径打通' },
      body: {
        en: 'Managed Programs auto-start, the S3 ArtifactStore gets streaming and retention, and media plus HyperFrames rendering run on Lambda.',
        cn: 'Managed Program 自动拉起，S3 ArtifactStore 拿到流式与保留策略，媒体与 HyperFrames 渲染跑上 Lambda。',
      },
    },
    {
      date: '2026-08-09',
      title: { en: 'Captions, tracks and the playground', cn: '字幕、轨道与 playground' },
      body: {
        en: 'Fine captions finish, exact fonts bind, shared track foundations land, and a Composition renders in the browser — with the timeline it never had.',
        cn: 'fine caption 完工、精确字体绑定、共享轨道基础落地，Composition 在浏览器里渲染出来 —— 带着它本来没有的那条时间线。',
      },
    },
    {
      date: '2026-08-10',
      title: { en: 'Model surfaces and provider-neutral TTS', cn: '模型作者面与 provider 中立的 TTS' },
      body: {
        en: 'Author surfaces for the generation models, data-only Seedance kits, and MiMo TTS that no longer names a provider.',
        cn: '生成模型的作者 Surface、纯数据的 Seedance kit，以及不再点名 provider 的 MiMo TTS。',
      },
    },
    {
      date: '2026-08-15',
      title: { en: 'Runtime execution becomes observable', cn: '运行时执行变得可观察' },
      body: {
        en: 'status --watch stops being a guess: durable phases and operation counts stream out of the Worker.',
        cn: 'status --watch 不再靠猜：持久阶段与 operation 计数从 Worker 直接流出来。',
      },
    },
    {
      date: '2026-08-17',
      title: { en: 'Runtime state and scheduling simplified', cn: '运行时状态与调度收敛' },
      body: {
        en: 'Concurrent builds admitted to compatible workers; the local runtime becomes one implementation instead of three.',
        cn: '并发 build 被接纳到兼容的 Worker；本地运行时从三套实现收敛成一套。',
      },
      current: true,
    },
  ],
  closing: {
    days: 18,
    text: { en: 'days, first commit to today.', cn: '天，从第一个 commit 到今天。' },
  },
}
