/**
 * 双语分词（蓝图 §3.4）。
 *
 * 词级高亮段（S2 WhatIsNarratage / S5 HookAnchors）需要把文案切成 span。
 * 优先在**构建期**切好并落盘为字面量（`lib/data/narrative.ts` / `hook-demo.ts`），
 * 运行时零成本、零 hydration 抖动、零 CLS；数据层给的是整句字符串时，
 * 本模块的 `toWords()` 兜底做运行时切分——切分是纯函数且服务端/客户端结果一致
 * （同一份 Intl.Segmenter 规则 + 同一份降级路径），因此 SSR 与 hydrate 不会分叉。
 *
 * 切分规则：
 * - 英文：按空白切词，词间渲染真实空格。
 * - 中文：**不能按空格切**（整句会变成一个词，逐词点亮退化成整句闪一下）。
 *   用 `Intl.Segmenter('zh', { granularity: 'word' })` 切成词；
 *   环境缺失（老浏览器 / 精简 ICU 的 Node）时降级为逐字切分——
 *   中文逐字点亮依然成立，只是锚点密度更高。词间不插空格。
 */

import type { Locale } from '@/lib/data/types'

// 词单元类型的唯一来源是 lib/data/narrative.ts（type-only import，运行时无依赖）。
export type { WordToken } from '@/lib/data/narrative'
import type { WordToken } from '@/lib/data/narrative'

const SEGMENTER_LOCALE: Record<Locale, string> = {
  en: 'en',
  cn: 'zh',
}

interface IntlSegmenterLike {
  segment(input: string): Iterable<{ segment: string; isWordLike?: boolean }>
}

type SegmenterCtor = new (
  locale: string,
  options: { granularity: 'word' | 'grapheme' | 'sentence' },
) => IntlSegmenterLike

/** Segmenter 实例按语言缓存：构造成本不低，且切分是纯函数，可安全复用。 */
const segmenterCache = new Map<Locale, IntlSegmenterLike | null>()

function getSegmenter(locale: Locale): IntlSegmenterLike | null {
  const hit = segmenterCache.get(locale)
  if (hit !== undefined) return hit

  const ctor = (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter
  let made: IntlSegmenterLike | null = null
  if (typeof ctor === 'function') {
    try {
      made = new ctor(SEGMENTER_LOCALE[locale], { granularity: 'word' })
    } catch {
      made = null
    }
  }
  segmenterCache.set(locale, made)
  return made
}

/**
 * 无 Intl.Segmenter 时的中文降级：CJK 逐字，拉丁/数字连续段整体保留
 * （"B-roll"、"SVML" 不会被拆成单字母），标点各自成词。
 */
const CJK = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3040-\u30FF]/u
const LATIN_RUN = /[A-Za-z0-9][A-Za-z0-9'’\-_.@/]*/y

function fallbackSegment(source: string): string[] {
  const out: string[] = []
  let i = 0
  while (i < source.length) {
    const ch = source[i]
    if (ch.trim().length === 0) {
      i += 1
      continue
    }
    if (!CJK.test(ch)) {
      LATIN_RUN.lastIndex = i
      const run = LATIN_RUN.exec(source)
      if (run && run.index === i && run[0].length > 0) {
        out.push(run[0])
        i += run[0].length
        continue
      }
    }
    out.push(ch)
    i += 1
  }
  return out
}

/**
 * 中文按词切分是否只切出了一个单元 —— 出现这种情况说明 Segmenter 没有真正
 * 起作用（例如 ICU 数据被裁剪），退回逐字切分，避免「整句当一个词」。
 */
function degenerate(tokens: string[], source: string): boolean {
  return tokens.length <= 1 && Array.from(source).length > 2
}

/** 把一行文本切成词数组（不含纯空白单元）。 */
export function segmentWords(text: string, locale: Locale): string[] {
  const source = text.trim()
  if (source.length === 0) return []

  if (locale === 'en') {
    return source.split(/\s+/).filter(Boolean)
  }

  const segmenter = getSegmenter(locale)
  if (!segmenter) return fallbackSegment(source)

  const out: string[] = []
  for (const part of segmenter.segment(source)) {
    const piece = part.segment
    if (piece.trim().length === 0) continue
    out.push(piece)
  }
  if (degenerate(out, source)) return fallbackSegment(source)
  return out
}

/**
 * 该语言的词之间是否需要渲染空格。
 * 英文 true（词间必须有真实空格，可选中、可复制）；中文 false（插空格会毁排版）。
 */
export function usesWordSpacing(locale: Locale): boolean {
  return locale === 'en'
}

/**
 * 组件侧统一入口：数据层已经切好词就直接用（保持 span 下标语义），
 * 只给了整句字符串时才在此处切分。两条路径都返回 `string[]`。
 */
export function toWords(
  value: string | readonly string[],
  locale: Locale,
): string[] {
  if (typeof value === 'string') return segmentWords(value, locale)
  return value as string[]
}

/** 把词数组还原成可读原文（供 aria-label / 屏幕阅读器使用）。 */
export function joinWords(words: readonly string[], locale: Locale): string {
  return words.join(usesWordSpacing(locale) ? ' ' : '')
}

/**
 * 切词并按 anchorWords 标注锚点。
 * 匹配时忽略大小写与首尾标点，因此 `timeline.` 也能命中 `timeline`。
 */
export function tokenize(
  text: string,
  locale: Locale,
  anchorWords: readonly string[] = [],
): WordToken[] {
  const anchors = new Set(anchorWords.map(normalizeWord))
  return segmentWords(text, locale).map((t) => ({
    t,
    anchor: anchors.has(normalizeWord(t)),
  }))
}

/** 归一化一个词用于锚点匹配：小写 + 去掉首尾标点。 */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/[^\p{L}\p{N}]+$/u, '')
}

/** 词数统计（S2 stagger 步长 = 0.9 / count）。 */
export function countWords(text: string, locale: Locale): number {
  return segmentWords(text, locale).length
}
