/**
 * 代码样例（蓝图 §3.8）。
 *
 * 全部逐字取自真实仓库 hypit-ai/narratage，只做行级裁剪，不改写语义：
 *   hero-svml       ← examples/talking-film-broll-preview/main.svml
 *   full-pipeline   ← examples/talking-film-broll-preview/main.svml（完整版）
 *   script-syntax   ← docs/quickstart/script.md「Combination example」
 *   svrun-candidate ← docs/quickstart/run.md「Reusing results」+ examples/*.svrun
 *   runtime-profile ← examples/talking-film-live/narratage.runtime.json
 *   svs-recipe      ← examples/bootstrap/studio.svs
 *
 * token 着色在数据层完成，页面不引入任何语法高亮依赖。
 */

import type { L10n } from './types'

export type TokenKind = 'kw' | 'str' | 'num' | 'fn' | 'punc' | 'com' | 'plain'

export interface CodeToken {
  k: TokenKind
  v: string
}

export interface CodeLine {
  tokens: CodeToken[]
  /** 高亮行（line-hl）。用于指出「改一个词只重编一段」等重点。 */
  hl?: boolean
}

export type CodeSampleId =
  | 'hero-svml'
  | 'full-pipeline'
  | 'script-syntax'
  | 'svrun-candidate'
  | 'runtime-profile'
  | 'svs-recipe'

export interface CodeSample {
  id: CodeSampleId
  filename: string
  meta?: string
  lang: 'svml' | 'svrun' | 'json' | 'bash'
  lines: CodeLine[]
  caption?: L10n
}

// ── token 速记 ────────────────────────────────────────────────
const p = (v: string): CodeToken => ({ k: 'plain', v })
const kw = (v: string): CodeToken => ({ k: 'kw', v })
const str = (v: string): CodeToken => ({ k: 'str', v })
const num = (v: string): CodeToken => ({ k: 'num', v })
const fn = (v: string): CodeToken => ({ k: 'fn', v })
const pc = (v: string): CodeToken => ({ k: 'punc', v })
const com = (v: string): CodeToken => ({ k: 'com', v })

const L = (tokens: CodeToken[], hl?: boolean): CodeLine => (hl ? { tokens, hl } : { tokens })
const BLANK: CodeLine = { tokens: [] }

/** `<tag attr="v" attr={ref}>` 的常用组合。 */
const tag = (name: string): CodeToken[] => [pc('<'), kw(name)]
const closeTag = (name: string): CodeToken[] => [pc('</'), kw(name), pc('>')]
const attr = (name: string, value: string): CodeToken[] => [
  p(' '),
  fn(name),
  pc('='),
  str(`"${value}"`),
]
const refAttr = (name: string, value: string): CodeToken[] => [
  p(' '),
  fn(name),
  pc('='),
  pc('{'),
  num(value),
  pc('}'),
]

/*
 * ── hero-svml（S1 右下折叠片段，同时是 S7 对开页左页与 WebGL 飘带的字形源）──
 *
 * **行宽预算**：这份片段最窄的落点是 S7 对开页的半栏 —— 1280 版心减 px-12×2
 * 得 1184，二等分 592，再减面板 px-6×2 与 `<pre>` px-3×2 得 520px，
 * 扣掉行号槽（2ch）与 gap-3 后约剩 56 个 14.5px 等宽字符。
 * 因此**每一行都压在 52 列以内**（留 4 列余量）：宁可把一个标签拆成两行
 * ——XML 本来就这么排——也不要让读者在半个字符上撞见截断。
 * 改这份样例时请一并核对最长行，别再让它「为整幅宽度写、往半幅里塞」。
 */
const heroSvml: CodeSample = {
  id: 'hero-svml',
  filename: 'main.svml',
  meta: 'compiled',
  lang: 'svml',
  lines: [
    // 首屏主视觉：16 行，1440×900 下完整可见，不进内嵌滚动。
    // 精简自完整样例——删掉 speech / film 两条 import 与 film:Film 行，
    // 保住 @claim / @proof 语义标记（产品内核的可视化）与 seedance 组件调用。
    L([pc('<?'), kw('svml'), ...attr('using', '@narratage/markup@1'), pc('?>')]),
    BLANK,
    L([...tag('svml'), pc('>')]),
    L([p('  '), ...tag('import'), ...attr('from', '@narratage/script@1'), pc('/>')]),
    L([p('  '), ...tag('import'), ...attr('as', 'seedance')]),
    L([p('    '), ...attr('from', '@narratage/seedance@1').slice(1), pc('/>')]),
    BLANK,
    L([p('  '), ...tag('script'), ...attr('id', 'story'), pc('>')]),
    L([p('    '), ...tag('opening'), pc('>'), pc('<'), fn('HOST'), pc('>')]),
    L([p('      '), p('A '), num('@claim'), p(' shallow preview reads the')], true),
    L([p('      source directly'), num('@/claim'), p(', so the '), num('@proof')], true),
    L([p('      timeline you scrub is the SVML itself'), num('@/proof'), p('.')], true),
    L([p('    '), ...closeTag('opening')]),
    L([p('  '), ...closeTag('script')]),
    BLANK,
    L([p('  '), ...tag('seedance:TextVideo'), ...attr('id', 'take'), ...refAttr('prompt', 'direction').slice(1), pc('/>')]),
    L([...closeTag('svml')]),
  ],
  caption: {
    en: 'Source, not state. This file is the video.',
    cn: '源码，不是编辑状态。这个文件就是视频本身。',
  },
}

// ── full-pipeline（S3 左栏完整版）────────────────────────────
const fullPipeline: CodeSample = {
  id: 'full-pipeline',
  filename: 'main.svml',
  meta: 'author graph',
  lang: 'svml',
  lines: [
    L([pc('<?'), kw('svml'), ...attr('using', '@narratage/markup@1'), pc('?>')]),
    BLANK,
    L([...tag('svml'), pc('>')]),
    L([p('  '), ...tag('import'), ...attr('from', '@narratage/script@1'), pc('/>')]),
    L([p('  '), ...tag('import'), ...attr('as', 'wording'), ...attr('from', '@narratage/text@1'), pc('/>')]),
    L([p('  '), ...tag('import'), ...attr('as', 'seedance'), ...attr('from', '@narratage/seedance@1'), pc('/>')]),
    L([p('  '), ...tag('import'), ...attr('as', 'speech'), ...attr('from', '@narratage/speech-spine@1'), pc('/>')]),
    L([p('  '), ...tag('import'), ...attr('as', 'whisperx'), ...attr('from', '@narratage/whisperx@1'), pc('/>')]),
    L([p('  '), ...tag('import'), ...attr('as', 'media-track'), ...attr('from', '@narratage/media-track@1'), pc('/>')]),
    L([p('  '), ...tag('import'), ...attr('as', 'space'), ...attr('from', '@narratage/spatial@1'), pc('/>')]),
    L([p('  '), ...tag('import'), ...attr('as', 'film'), ...attr('from', '@narratage/film@1'), pc('/>')]),
    L([p('  '), ...tag('import'), ...attr('as', 'render'), ...attr('from', '@narratage/render-hyperframes@1'), pc('/>')]),
    L([p('  '), ...tag('import'), ...attr('as', 'studio'), ...attr('source', './studio.svs'), pc('/>')]),
    BLANK,
    L([p('  '), ...tag('script'), ...attr('id', 'story'), pc('>')]),
    L([p('    '), ...tag('opening'), pc('>'), pc('<'), fn('HOST'), pc('>')]),
    L([p('      A '), num('@claim'), p(' shallow preview reads the source directly'), num('@/claim'), p(', so the')]),
    L([p('      '), num('@proof'), p(' timeline you scrub is the SVML itself'), num('@/proof'), p(', not a rendered file.')]),
    L([p('    '), ...closeTag('opening')]),
    L([p('  '), ...closeTag('script')]),
    BLANK,
    L([p('  '), ...tag('space:Canvas'), ...attr('id', 'vertical'), ...attr('width', '1080'), ...attr('height', '1920'), pc('/>')]),
    L([
      p('  '),
      ...tag('seedance:TextVideo'),
      ...attr('id', 'take'),
      ...attr('model', 'mini'),
      ...refAttr('prompt', 'direction'),
      ...attr('duration', '10'),
      pc('/>'),
    ]),
    BLANK,
    L([p('  '), ...tag('speech:Spine'), ...attr('id', 'speech'), ...attr('frame-rate', '30'), pc('>')]),
    L([
      p('    '),
      ...tag('speech:Take'),
      ...refAttr('video', 'take.video'),
      ...refAttr('segment', 'story.segment.opening'),
      pc('/>'),
    ]),
    L([p('  '), ...closeTag('speech:Spine')]),
    L([
      p('  '),
      ...tag('whisperx:Alignment'),
      ...refAttr('narrative', 'story'),
      ...refAttr('audio', 'speech.audio'),
      pc('/>'),
    ]),
    BLANK,
    L([p('  '), com('<!-- B-roll follows the Selection, not a timecode. -->')]),
    L([
      p('  '),
      ...tag('media-track:Track'),
      ...attr('id', 'broll'),
      ...refAttr('map', 'timing.map'),
      ...refAttr('canvas', 'vertical'),
      pc('>'),
    ]),
    L(
      [
        p('    '),
        ...tag('media-track:Item'),
        ...refAttr('video', 'motion-a.video'),
        ...refAttr('during', 'story.selection.claim'),
        pc('/>'),
      ],
      true,
    ),
    L([p('  '), ...closeTag('media-track:Track')]),
    BLANK,
    L([p('  '), ...tag('film:Film'), ...attr('id', 'main'), ...refAttr('canvas', 'vertical'), ...refAttr('space', 'speech.space'), pc('>')]),
    L([p('    '), ...tag('film:Track'), ...refAttr('source', 'speech.visual'), pc('/>')]),
    L([p('    '), ...tag('film:Track'), ...refAttr('source', 'speech.audioTrack'), pc('/>')]),
    L([p('    '), ...tag('film:Track'), ...refAttr('source', 'broll.visual'), pc('/>')]),
    L([p('  '), ...closeTag('film:Film')]),
    L([p('  '), ...tag('render:Video'), ...attr('id', 'final'), ...refAttr('composition', 'main.composition'), pc('/>')]),
    L([...closeTag('svml')]),
  ],
  caption: {
    en: 'One file: imports, script, generation, alignment, tracks, render.',
    cn: '一个文件装下：导入、脚本、生成、对齐、轨道、渲染。',
  },
}

// ── script-syntax（S4 展开示例，docs 原文）─────────────────
const scriptSyntax: CodeSample = {
  id: 'script-syntax',
  filename: 'script.svml',
  meta: 'four constructs',
  lang: 'svml',
  lines: [
    L([...tag('script'), ...attr('id', 'story'), pc('>')]),
    L([p('  '), num('@whole')]),
    L([p('  '), ...tag('hook'), pc('>')]),
    L([p('    '), pc('<'), fn('HOST'), pc('>'), p(' '), num('@problem'), p(' Girls, you need to hear this. Never let anyone')]),
    L([p('           take credit for your work. '), num('@/problem')]),
    L([p('  '), ...closeTag('hook')]),
    BLANK,
    L([p('  '), ...tag('meeting'), pc('>')]),
    L([p('    '), pc('<'), fn('HOST'), pc('>'), p(' '), num('@solution'), p(' I started sending '), pc('<'), str('BCC'), pc(' | '), str('B C C'), pc('>'), p(' recaps after')]),
    L([p('           every meeting: timestamps, decisions, who said what. '), num('@ranking!')]),
    L([p('           After the first recap, everything changed. '), num('@/solution')]),
    L([p('  '), ...closeTag('meeting')]),
    BLANK,
    L([p('  '), ...tag('evidence'), pc('>')]),
    L([p('    '), pc('<'), fn('HOST'), pc('>'), p(' That gave me '), num('@emphasis'), p(' the courage I was missing '), num('@/emphasis'), p('.')]),
    L([p('  '), ...closeTag('evidence')]),
    L([p('  '), num('@/whole~')]),
    L([...closeTag('script')]),
  ],
  caption: {
    en: 'Three Segments, three Role Cues, one Dual Text, four Selections, one Moment.',
    cn: '三个 Segment、三个 Role Cue、一个 Dual Text、四个 Selection、一个 Moment。',
  },
}

// ── svrun-candidate（S7 Candidate 协议）──────────────────────
const svrunCandidate: CodeSample = {
  id: 'svrun-candidate',
  filename: 'reuse.svrun',
  meta: 'run graph',
  lang: 'svrun',
  lines: [
    L([pc('<?'), kw('svml'), ...attr('using', '@narratage/run-markup@1'), pc('?>')]),
    BLANK,
    L([...tag('svrun'), ...attr('version', '1'), pc('>')]),
    L([p('  '), ...tag('author'), ...attr('source', './main.svml'), pc('/>')]),
    L([p('  '), ...tag('target'), ...attr('output', 'final.video'), pc('/>')]),
    BLANK,
    L([p('  '), com('<!-- A Record becomes a zero-input Candidate. -->')]),
    L([p('  '), ...tag('build-record'), ...attr('id', 'hook-video')], true),
    // build id 与依赖图里的 `bld_01234567…` 节点是同一个记号：省略号是校样上的
    // 缩排，不是假数据 —— 完整 UUID 有 40 列，一个人也读不完。
    L([p('    '), ...attr('build', 'bld_01234567…').slice(1)], true),
    L([p('    '), ...attr('output', 'hook-take.video').slice(1), pc('/>')], true),
    L([p('  '), ...tag('satisfy'), ...attr('output', 'hook-take.video')], true),
    L([p('    '), ...attr('candidate', 'hook-video').slice(1), pc('/>')], true),
    BLANK,
    L([p('  '), com('<!-- Local bytes work the same way. -->')]),
    L([p('  '), ...tag('file'), ...attr('id', 'accepted-presenter')]),
    L([p('    '), ...attr('type', '@narratage/artifact@1#BlobArtifact').slice(1)]),
    L([p('    '), ...attr('from', './assets/presenter.png').slice(1)]),
    L([p('    '), ...attr('media-type', 'image/png').slice(1), pc('/>')]),
    L([p('  '), ...tag('satisfy'), ...attr('output', 'presenter.image')]),
    L([p('    '), ...attr('candidate', 'accepted-presenter').slice(1), pc('/>')]),
    L([...closeTag('svrun')]),
  ],
  caption: {
    en: 'A Candidate satisfies a Need when its structure matches. Core never asks where it came from.',
    cn: '只要结构匹配，任何产物都能作为 Candidate 满足一个 Need。Core 不问它从哪来。',
  },
}

// ── runtime-profile（S7 第四个文件）─────────────────────────
const runtimeProfile: CodeSample = {
  id: 'runtime-profile',
  filename: 'narratage.runtime.json',
  meta: 'where and how to run',
  lang: 'json',
  lines: [
    L([pc('{')]),
    L([p('  '), fn('"format"'), pc(': '), str('"narratage.runtime-profile@1"'), pc(',')]),
    L([p('  '), fn('"runtime"'), pc(': {')]),
    L([p('    '), fn('"use"'), pc(': '), str('"@narratage/runtime-local"'), pc(',')]),
    L([p('    '), fn('"config"'), pc(': {')]),
    L([p('      '), fn('"artifacts"'), pc(': { '), fn('"use"'), pc(': '), str('"@narratage/artifact-store-fs"'), pc(' },')]),
    L([p('      '), fn('"credentials"'), pc(': {')]),
    L([p('        '), fn('"environment"'), pc(': { '), fn('"use"'), pc(': '), str('"@narratage/credential-store-env"'), pc(' }')]),
    L([p('      '), pc('},')]),
    L([p('      '), fn('"endpoints"'), pc(': {')]),
    L([p('        '), fn('"kie.talking-film"'), pc(': {')], true),
    L([p('          '), fn('"use"'), pc(': '), str('"@narratage/provider-kie"'), pc(',')], true),
    L([p('          '), fn('"config"'), pc(': { '), fn('"apiKey"'), pc(': { '), fn('"store"'), pc(': '), str('"env"'), pc(', '), fn('"key"'), pc(': '), str('"KIE_API_KEY"'), pc(' } }')], true),
    L([p('        '), pc('},')]),
    L([p('        '), fn('"whisperx.talking-film"'), pc(': { '), fn('"use"'), pc(': '), str('"@narratage/provider-whisperx-local"'), pc(' },')]),
    L([p('        '), fn('"hyperframes.talking-film"'), pc(': { '), fn('"use"'), pc(': '), str('"@narratage/provider-hyperframes-local"'), pc(' }')]),
    L([p('      '), pc('}')]),
    L([p('    '), pc('}')]),
    L([p('  '), pc('}')]),
    L([pc('}')]),
  ],
  caption: {
    en: 'Same source. Local GPU today, S3 and Lambda tomorrow.',
    cn: '同一份源码：今天本地 GPU，明天 S3 加 Lambda。',
  },
}

// ── svs-recipe（可复用创作选择）─────────────────────────────
const svsRecipe: CodeSample = {
  id: 'svs-recipe',
  filename: 'studio.svs',
  meta: 'reusable creative choices',
  lang: 'svml',
  lines: [
    L([pc('<?'), kw('svml'), ...attr('using', '@narratage/svs@1'), pc('?>')]),
    BLANK,
    L([...tag('sheet'), ...attr('version', '1'), ...attr('id', 'studio'), pc('>')]),
    L([p('  '), fn('caption.host'), p(' '), pc('{')]),
    L([p('    '), fn('fill'), pc(': '), str('#FFFFFF'), pc(';')]),
    L([p('    '), fn('size'), pc(': '), num('72'), pc(';')]),
    L([p('  '), pc('}')]),
    L([...closeTag('sheet')]),
  ],
  caption: {
    en: 'Styles live in a sheet, imported by any .svml that wants them.',
    cn: '样式写在 sheet 里，任何 .svml 想用就 import。',
  },
}

export const codeSamples: Record<CodeSampleId, CodeSample> = {
  'hero-svml': heroSvml,
  'full-pipeline': fullPipeline,
  'script-syntax': scriptSyntax,
  'svrun-candidate': svrunCandidate,
  'runtime-profile': runtimeProfile,
  'svs-recipe': svsRecipe,
}

export function codeSampleById(id: CodeSampleId): CodeSample {
  return codeSamples[id]
}
