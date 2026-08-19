/**
 * S3 · SOURCE, NOT STATE 的文案数据（蓝图 §1 S3）。
 *
 * 蓝图 §3 没有为 S3 单列数据文件（T1 清单里也没有），但组件内禁止硬编码文案，
 * 因此 T5 在这里补一个只服务 S3 的数据文件，字段风格与 T1 其它文件一致。
 * 代码样例仍然复用 `code-samples.ts` 的 `full-pipeline`。
 *
 * 内容红线（§8）：
 * - 不出现任何未经实测的帧数/时长/锚点数字 —— 这三项恰恰是「编译产物」，
 *   源码文件里一个都不存，所以 HUD 只打标签不打数字。
 * - `final` 来自 full-pipeline 原文 `<render:Video id="final" …/>`。
 */

import type { L10n } from './types'

export interface FlowStage {
  id: 'source' | 'compiler' | 'output'
  /** mono 标签：真实扩展名 / 真实 CLI 命令。 */
  label: string
  note: L10n
}

export interface OutputArtifact {
  /** 产物文件名：render:Video 的 id + 容器格式。 */
  filename: string
  /** mono 状态标签。 */
  tags: string[]
  note: L10n
}

export interface SourceStateBlock {
  eyebrow: string
  title: L10n
  lead: L10n
  /** 左栏代码样例（codeSamples 的 key）。 */
  codeSampleId: 'full-pipeline'
  flow: FlowStage[]
  output: OutputArtifact
  /** HUD 三行读数的标签（值由编译器决定，源码里不存）。 */
  hudLabels: string[]
  hudNote: L10n
  quote: L10n
}

export const sourceNotState: SourceStateBlock = {
  eyebrow: 'SEC/03',
  title: {
    en: 'SVML stores the method of production.',
    cn: 'SVML 保存的是生产方法。',
  },
  lead: {
    en: 'The MP4 is only what fell out of it. An editor project file stores the state of a timeline: which clip sits at which second, in one vendor’s binary. A .svml file stores how the video is produced — imports, script, generation, alignment, tracks, render. Delete the MP4 and compile again, and the video comes back. Delete the .svml and nothing can reproduce it.',
    cn: 'MP4 只是它掉出来的东西。剪辑工程文件保存的是时间线的状态：哪个素材躺在第几秒，装在某一家厂商的私有格式里。.svml 保存的是这支视频怎么被生产出来 —— 导入、脚本、生成、对齐、轨道、渲染。删掉 MP4 再编译一次，视频还会回来；删掉 .svml，没有任何东西能把它复现。',
  },
  codeSampleId: 'full-pipeline',
  flow: [
    {
      id: 'source',
      label: '.svml',
      note: {
        en: 'Author graph — what you wrote, versioned in git like any other source file.',
        cn: 'Author Graph —— 你写下的东西，像任何源码一样进 git。',
      },
    },
    {
      id: 'compiler',
      label: 'narratage build',
      note: {
        en: 'Plan, dispatch, execute. You only pay after you confirm.',
        cn: 'Plan、Dispatch、Execute。确认了才真正花钱。',
      },
    },
    {
      id: 'output',
      label: '.mp4',
      note: {
        en: 'Artifact — disposable, regenerable, never the thing you edit.',
        cn: '产物 —— 可丢弃、可重生成，永远不是你编辑的那个东西。',
      },
    },
  ],
  output: {
    filename: 'final.mp4',
    tags: ['OUTPUT', 'DISPOSABLE'],
    note: {
      en: 'Nothing downstream depends on this file. It is the last step, not the project.',
      cn: '没有任何下游依赖这个文件。它是最后一步，不是这个项目本身。',
    },
  },
  hudLabels: ['frames', 'duration', 'anchors'],
  hudNote: {
    en: 'Frames, duration and anchors are compiler output. The source file never stores a single one of them.',
    cn: '帧数、时长、锚点都是编译产物，源码文件里一个都不存。',
  },
  quote: {
    en: 'Source, not state. This file is the video.',
    cn: '源码，不是编辑状态。这个文件就是视频本身。',
  },
}
