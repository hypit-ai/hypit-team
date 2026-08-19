/**
 * S11 · MODELS & PROVIDERS（蓝图 §3.12）。
 *
 * 9 个 Provider 包与模型 slug 逐字取自仓库：
 *   packages/provider-*                       （9 个）
 *   packages/seedance/src/surface.ts          seedance-2 / -fast / -mini / 2.5
 *   packages/provider-kie/src/mapping.ts      gpt-image-2 · nano-banana-2 / -pro ·
 *                                             grok-imagine-video · minimax-h3 ·
 *                                             seedream-5-lite · gemini-omni-video
 *   packages/mimo-tts/src                     mimo-v2.5-tts / -voiceclone / -voicedesign
 *   packages/caption-gemini/src/types.ts      gemini-2.5-flash · gemini-3.1-pro-preview
 * 环境变量取自 docs/quickstart/run.md「Configure selected credentials」。
 */

import type { L10n } from './types'

export interface ProviderPkg {
  pkg: string
  covers: L10n
}

export interface ModelEntry {
  /** SVML 里 import 的作者包。 */
  authorModule: string
  models: string[]
  slug: string
  vendor: string
}

export interface ModelsData {
  eyebrow: string
  title: L10n
  byokNote: L10n
  providers: ProviderPkg[]
  models: ModelEntry[]
  vendors: string[]
  envVars: string[]
  thirdPartyRuntime: string[]
  authorNote: L10n
  quotes: { swap: L10n }
}

export const models: ModelsData = {
  eyebrow: 'SEC/10',
  title: {
    en: 'Nine providers ship with it, and the .svml names none of them.',
    cn: '随包附带九家 provider，而 .svml 一个都不提。',
  },
  byokNote: {
    en: 'Bring your own key. The .svml picks a model; it never picks a provider. Who actually runs it is resolved at runtime from the Endpoint instances you configured.',
    cn: '自带 key。.svml 只指定模型，从不指定 provider。到底谁来跑，由运行时根据你配置的 Endpoint 实例解析。',
  },
  providers: [
    {
      pkg: '@narratage/provider-kie',
      covers: { en: 'KIE generation plus background removal', cn: 'KIE 生成能力，外加背景去除' },
    },
    {
      pkg: '@narratage/provider-google-vertex',
      covers: { en: 'Vertex Gemini caption planning', cn: 'Vertex 上的 Gemini 字幕规划' },
    },
    {
      pkg: '@narratage/provider-xiaomi-mimo',
      covers: { en: 'Official Xiaomi MiMo TTS API', cn: '小米 MiMo TTS 官方 API' },
    },
    {
      pkg: '@narratage/provider-whisperx-local',
      covers: { en: 'Local WhisperX service', cn: '本地 WhisperX 服务' },
    },
    {
      pkg: '@narratage/provider-media-local',
      covers: { en: 'Local ffprobe / ffmpeg', cn: '本地 ffprobe / ffmpeg' },
    },
    {
      pkg: '@narratage/provider-media-aws-lambda',
      covers: { en: 'Synchronous AWS media execution', cn: '同步的 AWS 媒体执行' },
    },
    {
      pkg: '@narratage/provider-hyperframes-local',
      covers: { en: 'Local Chrome rendering', cn: '本地 Chrome 渲染' },
    },
    {
      pkg: '@narratage/provider-hyperframes-aws-lambda',
      covers: { en: 'Asynchronous distributed rendering', cn: '异步分布式渲染' },
    },
    {
      pkg: '@narratage/provider-image-opencv-local',
      covers: { en: 'Local OpenCV Raster execution', cn: '本地 OpenCV 栅格执行' },
    },
  ],
  models: [
    {
      authorModule: '@narratage/seedance',
      models: ['seedance-2', 'seedance-2-fast', 'seedance-2-mini', 'seedance-2.5'],
      slug: 'seedance',
      vendor: 'ByteDance',
    },
    {
      authorModule: '@narratage/seedream',
      models: ['seedream-5-lite'],
      slug: 'seedream',
      vendor: 'ByteDance',
    },
    {
      authorModule: '@narratage/minimax-h3',
      models: ['minimax-h3'],
      slug: 'minimax-h3',
      vendor: 'MiniMax',
    },
    {
      authorModule: '@narratage/gemini-omni',
      models: ['gemini-omni-video'],
      slug: 'gemini-omni',
      vendor: 'Google',
    },
    {
      authorModule: '@narratage/caption-gemini',
      models: ['gemini-2.5-flash', 'gemini-3.1-pro-preview'],
      slug: 'caption-gemini',
      vendor: 'Google',
    },
    {
      authorModule: '@narratage/grok-imagine',
      models: ['grok-imagine-video', 'grok-imagine-video-1.5-preview'],
      slug: 'grok-imagine',
      vendor: 'xAI',
    },
    {
      authorModule: '@narratage/gpt-image',
      models: ['gpt-image-2-text-to-image', 'gpt-image-2-image-to-image'],
      slug: 'gpt-image',
      vendor: 'OpenAI',
    },
    {
      authorModule: '@narratage/nano-banana',
      models: ['nano-banana-2', 'nano-banana-pro'],
      slug: 'nano-banana',
      vendor: 'Nano Banana',
    },
    {
      authorModule: '@narratage/mimo-tts',
      models: ['mimo-v2.5-tts', 'mimo-v2.5-tts-voiceclone', 'mimo-v2.5-tts-voicedesign'],
      slug: 'mimo-tts',
      vendor: 'Xiaomi',
    },
    {
      authorModule: '@narratage/whisperx',
      models: ['whisperx alignment'],
      slug: 'whisperx',
      vendor: 'Open source · local',
    },
  ],
  vendors: ['ByteDance', 'MiniMax', 'Google', 'xAI', 'OpenAI', 'Nano Banana', 'Xiaomi', 'Open source · local'],
  envVars: [
    'KIE_API_KEY',
    'GOOGLE_CLOUD_PROJECT',
    'GOOGLE_APPLICATION_CREDENTIALS_JSON',
    'MIMO_API_KEY',
  ],
  thirdPartyRuntime: ['FFmpeg', 'HyperFrames', 'WhisperX', 'Fontsource'],
  authorNote: {
    en: 'model="mini" selects Seedance 2 Mini. Whether KIE cloud, Google Vertex or a local GPU runs it is outside the .svml’s jurisdiction entirely.',
    cn: 'model="mini" 选的是 Seedance 2 Mini。到底由 KIE 云端、Google Vertex 还是本地 GPU 来跑，完全不在 .svml 的管辖范围内。',
  },
  quotes: {
    swap: { en: 'Same format. Swap the model.', cn: '同一份格式，随手换模型。' },
  },
}
