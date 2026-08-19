/**
 * S9 · Write → Generate → Align → Render，S10 · Durable Build。蓝图 §3.10。
 * 四步流程与包/服务映射取自 README「How it works」+ docs/guide/packages.md；
 * 持久化构建四步与事实取自 docs/quickstart/run.md「Build workflow」。
 */

import type { L10n, L10nList } from './types'

export interface PipelineStep {
  n: 1 | 2 | 3 | 4
  key: 'write' | 'generate' | 'align' | 'render'
  title: L10n
  body: L10n
  packages: string[]
  services?: string[]
}

export const pipelineIntro: { eyebrow: string; title: L10n } = {
  eyebrow: 'SEC/09',
  title: { en: 'Four steps from words to MP4.', cn: '从文字到 MP4，四步。' },
}

export const pipeline: PipelineStep[] = [
  {
    n: 1,
    key: 'write',
    title: { en: 'Write', cn: '写' },
    body: {
      en: 'SVML describes who speaks, what they say, and where B-roll and effects go. No timecodes.',
      cn: 'SVML 写清楚谁在说、说什么、B-roll 和特效落在哪里。没有时间码。',
    },
    packages: ['markup', 'script', 'text', 'svs', 'estimate'],
  },
  {
    n: 2,
    key: 'generate',
    title: { en: 'Generate', cn: '生成' },
    body: {
      en: 'Seedance, MiniMax H3 and GPT Image 2 produce every shot from prompts and references.',
      cn: 'Seedance、MiniMax H3、GPT Image 2 依据 prompt 和参考图生成每一个镜头。',
    },
    packages: ['seedance', 'minimax-h3', 'gpt-image', 'nano-banana', 'mimo-tts', 'speech-spine'],
    services: ['provider-kie', 'provider-xiaomi-mimo', 'provider-google-vertex'],
  },
  {
    n: 3,
    key: 'align',
    title: { en: 'Align', cn: '对齐' },
    body: {
      en: 'WhisperX pins every spoken word to an exact time. B-roll and effects follow words, not seconds.',
      cn: 'WhisperX 把每一个说出口的词钉到确切时间。B-roll 和特效跟着词走，不跟着秒走。',
    },
    packages: ['whisperx', 'speech-alignment', 'semantic-map', 'temporal', 'caption'],
    services: ['provider-whisperx-local', 'services/whisperx'],
  },
  {
    n: 4,
    key: 'render',
    title: { en: 'Render', cn: '渲染' },
    body: {
      en: 'HyperFrames composites all tracks frame by frame into MP4.',
      cn: 'HyperFrames 把所有轨道逐帧合成为 MP4。',
    },
    packages: ['film', 'composition', 'hyperframes', 'render-hyperframes', 'media-pipeline'],
    services: ['provider-hyperframes-local', 'provider-media-local', 'services/media-lambda'],
  },
]

// ── S10 · 持久化构建 ────────────────────────────────────────
export interface DurableStep {
  n: 1 | 2 | 3 | 4
  key: 'plan' | 'build' | 'dispatch' | 'execute'
  title: L10n
  body: L10n
  command?: string
}

export const durableIntro: { eyebrow: string; title: L10n; lead: L10n } = {
  eyebrow: 'SEC/09',
  title: { en: 'See the bill before you spend.', cn: '花钱前先看账单。' },
  lead: {
    en: 'AI generation is slow, costly and non-deterministic. Narratage does not execute immediately — it compiles the requested work into a durable plan.',
    cn: 'AI 生成慢、贵、不确定。Narratage 不立即执行，而是把所需工作编译成一份持久化计划。',
  },
}

export const durableSteps: DurableStep[] = [
  {
    n: 1,
    key: 'plan',
    title: { en: 'Plan', cn: '计划' },
    body: {
      en: 'narratage plan freezes a complete execution plan. Every model invocation, which provider handles it, and the expected artifact type are all reviewable before anything runs.',
      cn: 'narratage plan 冻结一份完整的执行计划。每一次模型调用、由哪个 provider 承担、预期产物类型，全部可以在执行前审查。',
    },
    command: 'narratage plan build.svrun',
  },
  {
    n: 2,
    key: 'build',
    title: { en: 'Build', cn: '构建' },
    body: {
      en: 'narratage build submits a durable Build and returns a fresh Build id immediately. The work continues in a background Worker.',
      cn: 'narratage build 提交一次持久化 Build，立刻返回一个全新的 Build id，构建在后台 Worker 进程里继续跑。',
    },
    command: 'narratage build build.svrun --follow',
  },
  {
    n: 3,
    key: 'dispatch',
    title: { en: 'Dispatch', cn: '分发' },
    body: {
      en: 'The Build enters the durable dispatch queue. The Worker claims Builds in order and manages concurrency through CapacityReservation, so Builds share capacity without blocking each other.',
      cn: 'Build 进入持久化分发队列。Worker 按 claim 顺序消费，通过 CapacityReservation 管理并发容量，多个 Build 共享容量声明、互不阻塞。',
    },
    command: 'narratage queue',
  },
  {
    n: 4,
    key: 'execute',
    title: { en: 'Execute', cn: '执行' },
    body: {
      en: 'The Worker drives the BuildMachine. Each command goes to its Provider through the Executor, results land as BuildFacts, and state advances until every target’s dependency chain is complete.',
      cn: 'Worker 驱动 BuildMachine：每条命令经 Executor 发给对应 Provider，结果写成 BuildFact，状态一路推进到所有 target 的依赖链完成。',
    },
    command: 'narratage status <build-id> --watch',
  },
]

/** 侧栏事实（docs/quickstart/run.md 原文要点）。 */
export const durableFacts: L10nList = {
  en: [
    'Without --follow, build returns after durable submission. The detached Worker keeps going.',
    'Close the terminal and the Build continues; status --watch reattaches from any later terminal.',
    'Every invocation creates a fresh Build id, even when Author and Run Sources are unchanged.',
    'A Worker restart continues the same accepted Records and external task checkpoints.',
    'check and plan make no live Provider requests and need no API keys.',
    'doctor audits the whole Runtime Profile without starting a Worker or spending a cent.',
  ],
  cn: [
    '不加 --follow 时，build 在持久提交后就返回，脱离的 Worker 继续跑。',
    '终端关了构建照跑；status --watch 可以在任何后来的终端重新附着。',
    '每次调用都会得到一个全新的 Build id，哪怕 Author 与 Run Source 一个字没改。',
    'Worker 重启后继续沿用已接受的 Record 和同一批外部任务检查点。',
    'check 与 plan 不发起任何真实 Provider 请求，也不需要 API key。',
    'doctor 在不启动 Worker、不花一分钱的前提下审计整份运行时配置。',
  ],
}
