/**
 * S7 + S8 · 文件职责 / 七层包架构 / 五种 facet / 三条依赖铁律 / 候选协议。
 * 蓝图 §3.9。
 *
 * 包名、层级、facet 表、依赖规则逐字取自 docs/guide/packages.md 与 README「Architecture」表；
 * 文件职责表取自 README「Project files」。禁止出现 "DUCK 协议"（§8 红线 1 / D3）。
 */

import type { L10n } from './types'
import type { CodeSampleId } from './code-samples'

// ── S7 · 四个文件 ───────────────────────────────────────────
export interface FileRole {
  ext: '.svml' | '.svs' | '.svrun' | 'runtime.json'
  decides: L10n
  alias: L10n
}

export const graphsIntro: { eyebrow: string; title: L10n; lead: L10n } = {
  eyebrow: 'MOVEMENT III — BUILD',
  title: {
    en: 'Authoring and running are two different files.',
    cn: '创作和运行，是两个不同的文件。',
  },
  lead: {
    en: 'The .svml says what the video is. The .svrun says what to build this time. Canvas editors conflate the two and make you carry runtime semantics while you are still authoring.',
    cn: '.svml 说「这条视频是什么」，.svrun 说「这次要构建什么」。画布编辑器把两者混为一谈，让你在表达创作意图的同时被迫承担运行语义。',
  },
}

export const fileRoles: FileRole[] = [
  {
    ext: '.svml',
    decides: {
      en: 'What video to make, including the script, generated media and tracks',
      cn: '要做什么视频：脚本、生成的素材、所有轨道',
    },
    alias: { en: 'Author Graph', cn: '作者图' },
  },
  {
    ext: '.svs',
    decides: {
      en: 'Reusable creative choices such as prompts, styles and layout',
      cn: '可复用的创作选择：prompt、样式、布局',
    },
    alias: { en: 'Recipe sheet', cn: '配方表' },
  },
  {
    ext: '.svrun',
    decides: {
      en: 'What to build this time, including targets and prior results to reuse',
      cn: '这次要构建什么：target 与要复用的历史结果',
    },
    alias: { en: 'Run Graph', cn: '运行图' },
  },
  {
    ext: 'runtime.json',
    decides: {
      en: 'How and where to run, including providers, credentials and storage',
      cn: '在哪里、用什么跑：provider、凭据、存储',
    },
    alias: { en: 'Runtime Profile', cn: '运行时配置' },
  },
]

export const partialExecution: L10n = {
  en: 'Every .svrun is a partial execution of the .svml. Even targeting final.video is just a selection — it happens to select the terminus, so the runtime traces back through everything upstream.',
  cn: '每一次 .svrun 都是 .svml 的一次局部执行。即使 target 指向 final.video，那也只是一次选取，只不过恰好选中依赖链终点，于是回溯触发了全部上游节点。',
}

// ── S7 · Candidate 协议（严禁称为 "DUCK"）───────────────────
export interface CandidateProtocol {
  title: L10n
  body: L10n
  /** 仅作类比修辞，不得写成协议名（D3）。 */
  duckAnalogy: L10n
  codeSampleId: Extract<CodeSampleId, 'svrun-candidate'>
  cli: string[]
}

export const candidateProtocol: CandidateProtocol = {
  title: { en: 'Candidate protocol · Satisfaction edges', cn: 'Candidate 候选协议 · Satisfaction 边' },
  body: {
    en: 'Every computation node raises a Need at runtime, declaring the Capability and Type it wants. Any artifact — a fresh generation, a placeholder, a reused historical Record, a degraded output — can fill that Need as long as it structurally matches. Core never asks where a Candidate came from; it only verifies the protocol. There is no pinned-result state and no fidelity label.',
    cn: '每个计算节点在运行时产生一个 Need，声明它要什么 Capability、什么 Type。任何产物 —— 真实生成的结果、占位输出、复用的历史 Record、降级产物 —— 只要结构匹配就能作为 Candidate 填充它。Core 不关心候选从哪来，只验证协议是否满足：没有「固定结果」状态，也没有保真度标签。',
  },
  duckAnalogy: {
    en: 'Alex Martelli put it on comp.lang.python in 2000: “if it walks like a duck and it quacks like a duck.” Suitability is what a thing exhibits, not what it declares.',
    cn: '2000 年 Alex Martelli 在 comp.lang.python 上说过：“if it walks like a duck and it quacks like a duck”。能不能用，看它实际展现的结构，不看它声明的类型。',
  },
  codeSampleId: 'svrun-candidate',
  cli: ['narratage history hook-take.video', 'narratage history --source ./main.svml'],
}

export const buildIdentityNote: L10n = {
  en: 'Every build invocation receives a fresh Build id. Source identity never reclaims an earlier Build — a later Run reuses an accepted result only by naming that historical Build id.',
  cn: '每一次 build 都会拿到一个全新的 Build id。源码身份永远不会「认领」上一次构建 —— 想复用，只能在 Run Source 里点名那个历史 Build id。',
}

// ── S8 · 七层包架构 ─────────────────────────────────────────
export interface PackageLayer {
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7
  code: string
  name: string
  owns: L10n
  packages: string[]
}

export const architectureIntro: { eyebrow: string; title: L10n; lead: L10n } = {
  eyebrow: 'SEC/08',
  title: { en: 'Even the language is a plugin.', cn: '连这门语言本身也是一个插件。' },
  lead: {
    en: 'Speech, captions, generation, alignment, compositing, rendering — every capability is a package. So is the SVML syntax itself, and so is every runtime adapter. Installing a package adds capability without a Core release.',
    cn: '语音、字幕、生成、对齐、合成、渲染 —— 每一种能力都是一个包。SVML 语法本身是包，运行时适配器也是包。装一个包就多一种能力，不需要重新发布 Core。',
  },
}

export const layers: PackageLayer[] = [
  {
    level: 1,
    code: 'L1',
    name: 'Narratage Core',
    owns: {
      en: 'Plan compilation and the Build state machine. Domain neutral: it knows nothing about source syntax, files, networks, models or video.',
      cn: '计划编译与 Build 状态机。领域无关：不认识源码语法、文件、网络、模型，也不认识视频。',
    },
    packages: ['protocol', 'core'],
  },
  {
    level: 2,
    code: 'L2',
    name: 'Compiler',
    owns: {
      en: 'Source discovery, Frontends, imports, graph elaboration and the reference Node Host. A source selects its own Frontend in its mandatory header.',
      cn: 'Source 发现、Frontend、导入、图展开与参考 Node Host。每份源码在强制头部里选择自己的 Frontend，没有中央解析器。',
    },
    packages: [
      'source',
      'elaborator',
      'run',
      'validation',
      'host',
      'workspace',
      'compiler-node',
      'workspace-fs-node',
      'package-loader-node',
      'markup',
      'svs',
      'run-markup',
      'compiler-markup-node',
    ],
  },
  {
    level: 3,
    code: 'L3',
    name: 'Foundations',
    owns: {
      en: 'Reusable values and deterministic building blocks. They support video authoring but never decide a film’s creative structure or call an external service.',
      cn: '可复用的值与确定性基础件。它们支撑视频创作，但不决定成片的创作结构，也不调用任何外部服务。',
    },
    packages: [
      'artifact',
      'component-kit',
      'text',
      'media',
      'temporal',
      'spatial',
      'visual-ir',
      'fonts-open',
      'media-pipeline',
      'media-execution',
      'transport-aws-lambda',
    ],
  },
  {
    level: 4,
    code: 'L4',
    name: 'Video authoring',
    owns: {
      en: 'The packages that give SVML its video vocabulary: narrative, exact model requests, speech, captions, peer Tracks, Film and render declarations.',
      cn: '给 SVML 视频词汇的那一层：叙事、精确模型请求、语音、字幕、平级 Track、Film 与渲染声明。它们依赖共享契约，从不依赖某个 Provider 部署。',
    },
    packages: [
      'narrative',
      'script',
      'program-space',
      'generation',
      'model-kit',
      'seedance',
      'seedance-kits',
      'minimax-h3',
      'gemini-omni',
      'grok-imagine',
      'gpt-image',
      'nano-banana',
      'seedream',
      'mimo-tts',
      'estimate',
      'speech',
      'speech-basis',
      'speech-evidence',
      'semantic-map',
      'speech-alignment',
      'speech-spine',
      'whisperx',
      'caption',
      'caption-gemini',
      'caption-fine',
      'media-track',
      'typography-track',
      'audio-track',
      'deck-track',
      'ranking',
      'screen-overlay',
      'comment-sticker',
      'film',
      'composition',
      'hyperframes',
      'render-hyperframes',
      'image-transform',
      'image-compose',
      'raster',
      'background-removal',
    ],
  },
  {
    level: 5,
    code: 'L5',
    name: 'Providers',
    owns: {
      en: 'Privileged external capabilities. Each Provider registers an EndpointPackage declaring which Capabilities it fulfils; local ones manage process lifecycles as Managed Programs.',
      cn: '有特权的外部能力。每个 Provider 通过 endpoint-kit 注册 EndpointPackage，声明自己能满足哪些 Capability；本地 Provider 用 Managed Program 机制自动管理进程生命周期。',
    },
    packages: [
      'provider-kie',
      'provider-google-vertex',
      'provider-xiaomi-mimo',
      'provider-whisperx-local',
      'provider-media-local',
      'provider-media-aws-lambda',
      'provider-hyperframes-local',
      'provider-hyperframes-aws-lambda',
      'provider-image-opencv-local',
    ],
  },
  {
    level: 6,
    code: 'L6',
    name: 'Runtime',
    owns: {
      en: 'Domain-neutral execution ports plus replaceable deployment implementations: queues, stores, credentials and process lifecycle. They never define author syntax.',
      cn: '领域无关的执行端口，加上可替换的部署实现：队列、存储、凭据、进程生命周期。它们从不定义作者语法。',
    },
    packages: [
      'runtime',
      'endpoint-kit',
      'driver-node',
      'runtime-kit',
      'runtime-host-node',
      'runtime-local',
      'store-sqlite',
      'artifact-store-fs',
      'artifact-store-s3',
      'credential-store-env',
      'credential-store-keychain',
    ],
  },
  {
    level: 7,
    code: 'L7',
    name: 'Applications',
    owns: {
      en: 'User-facing ways to author and operate Narratage. Neither CLI package transitively depends on any Provider.',
      cn: '用户直接使用的界面。两个 CLI 包都不会传递依赖任何 Provider 包。',
    },
    packages: ['cli', 'video-cli'],
  },
]

// ── 五种 facet ──────────────────────────────────────────────
export interface Facet {
  name: 'static' | 'author' | 'compute' | 'endpoint' | 'infrastructure'
  abi: L10n
  authority: L10n
  chosenBy: L10n
}

export const facets: Facet[] = [
  {
    name: 'static',
    abi: { en: 'Manifest and identity', cn: '清单与身份' },
    authority: { en: 'none', cn: '无' },
    chosenBy: { en: 'always available after loading', cn: '加载后始终可用' },
  },
  {
    name: 'author',
    abi: { en: 'Frontend, Surface, Graph Fragment', cn: 'Frontend、Surface、Graph Fragment' },
    authority: { en: 'author vocabulary only', cn: '仅作者词汇' },
    chosenBy: { en: 'source <import> through the compiler Host', cn: '源码 <import>，经编译器 Host' },
  },
  {
    name: 'compute',
    abi: { en: 'deterministic Producer, Type Validator', cn: '确定性 Producer、Type Validator' },
    authority: { en: 'pure computation', cn: '纯计算' },
    chosenBy: { en: 'compiler Host', cn: '编译器 Host' },
  },
  {
    name: 'endpoint',
    abi: { en: 'privileged external capability', cn: '有特权的外部能力' },
    authority: { en: 'network, filesystem, process, credentials', cn: '网络、文件系统、进程、凭据' },
    chosenBy: { en: 'Runtime Profile', cn: '运行时配置' },
  },
  {
    name: 'infrastructure',
    abi: { en: 'Scheduler, Worker and Store implementation', cn: 'Scheduler、Worker、Store 实现' },
    authority: { en: 'persistence, scheduling', cn: '持久化、调度' },
    chosenBy: { en: 'Runtime Profile', cn: '运行时配置' },
  },
]

export const securityQuote: L10n = {
  en: 'A source <import> activates only author facets. It never grants network, filesystem, process, credential or queue authority.',
  cn: '源码 <import> 只激活 author facet，永远不会授予网络、文件系统、进程、凭据或队列权限。',
}

// ── 三条依赖铁律 ────────────────────────────────────────────
export interface Discipline {
  id: string
  title: L10n
  body: L10n
}

export const disciplines: Discipline[] = [
  {
    id: 'acyclic',
    title: { en: 'Acyclic production graph', cn: '生产图无环' },
    body: {
      en: 'No dependency cycle among any @narratage/* packages.',
      cn: '任意 @narratage/* 包之间不存在依赖环。',
    },
  },
  {
    id: 'core-neutral',
    title: { en: 'Domain-neutral Core closure', cn: 'Core 闭包领域中立' },
    body: {
      en: 'Layer 1 contains only protocol and core; core depends only on protocol. Compiler and Runtime may also be domain neutral, but they stay outside Core.',
      cn: 'L1 只有 protocol 和 core，core 只依赖 protocol。Compiler 与 Runtime 也可以领域中立，但它们留在 Core 之外。',
    },
  },
  {
    id: 'cli-independence',
    title: { en: 'CLI independence', cn: 'CLI 独立' },
    body: {
      en: 'Neither cli nor video-cli transitively depends on a Provider, and the video CLI depends on no author-level video package either. Author packages are activated through Source imports, not compile-time CLI dependencies.',
      cn: 'cli 与 video-cli 都不传递依赖任何 Provider；video-cli 也不依赖任何作者级视频包。作者包由源码 import 激活，不是 CLI 的编译期依赖。',
    },
  },
]

export const coreQuote: L10n = {
  en: 'The Core is small and domain-neutral: it knows nothing about video. Installing a package adds capability without requiring a Core release.',
  cn: 'Core 很小，而且领域中立：它不认识视频。装一个包就多一种能力，不需要重新发布 Core。',
}
