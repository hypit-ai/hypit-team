import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { pad } from '@/lib/utils/format'
import {
  CodeTokens,
  linesToText,
  tokenizeCode,
  type CodeLang,
  type CodeLineData,
} from './CodeToken'
import { ScrollEdgeStyle, X_SCROLL, Y_SCROLL } from './ScrollEdge'

export type { CodeLang, CodeLineData }

/** 行状态：clean 正常 / hl 高亮 / dirty 变脏（待重编译）/ dim 淡出。 */
export type CodeLineState = 'clean' | 'hl' | 'dirty' | 'dim'

export interface CodeBlockProps {
  /** 已分词的行（来自 lib/data/code-samples.ts）。与 `code` 二选一，优先级更高。 */
  lines?: readonly CodeLineData[]
  /** 原始源码；配合 `lang` 由内置分词器着色。 */
  code?: string
  lang?: CodeLang
  /** 文件名，显示在 figcaption 左侧（如 `main.svml`）。 */
  filename?: ReactNode
  /** 右侧 mono 元信息（如 `compiled 41ms`）。 */
  meta?: ReactNode
  /** 代码块下方说明。 */
  caption?: ReactNode
  showLineNumbers?: boolean
  /** 行号起始值（截断片段用）。 */
  startLine?: number
  /**
   * 受控高亮行（1 基，相对 startLine 之后的显示行号）。
   * T6 局部重编译镜头靠它 + `dirtyLines` 驱动。
   */
  highlightLines?: readonly number[]
  /** 受控「变脏」行 —— crimson 左轨 + crimson-soft 底（BRAND.md §4）。 */
  dirtyLines?: readonly number[]
  /** 受控淡出行（阶段 A 代码淡出）。 */
  dimLines?: readonly number[]
  /** 每行额外 data 属性名，供 GSAP 选择器使用，默认 `data-code-line`。 */
  lineAttr?: string
  /** 自动换行（默认 false → 横向滚动，body 不横滚）。 */
  wrap?: boolean
  /** 最大高度，超出纵向滚动（如 '22rem'）。与 `maxLines` 二选一，后者优先。 */
  maxHeight?: string
  /**
   * 最大可见**行数**，超出纵向滚动。
   * 与 `maxHeight` 的差别是它按 26px 行距 + 上下内边距精确换算，
   * 保证收尾**落在整行上**——任意 rem 值都会把某一行拦腰切断，看起来像渲染错误
   * 而不是「下面还有」。招牌镜头（S3）必须用这个。
   */
  maxLines?: number
  /** 无障碍标签；缺省时用 filename。 */
  ariaLabel?: string
  /** 紧凑排版（HUD 侧栏用）。 */
  dense?: boolean
  className?: string
  preClassName?: string
}

const STATE_CLASS: Record<CodeLineState, string> = {
  clean: '',
  hl: 'line-hl',
  dirty:
    'bg-crimson-soft shadow-[inset_2px_0_0_var(--color-crimson)]',
  dim: 'opacity-45',
}

function toSet(list?: readonly number[]): Set<number> | null {
  return list && list.length ? new Set(list) : null
}

/** 行距（px）。与 `<pre>` 的 `leading-[26px]` 是同一个数，BRAND.md §2「代码行」档位。 */
const CODE_LINE_HEIGHT = 26
/** `<pre>` 的上下内边距：dense = py-2(8px)，常规 = py-3(12px)。 */
const CODE_PAD_Y = { dense: 8, normal: 12 } as const

/**
 * 代码块（蓝图 §7 T2）。
 * - SVML / SVS / SVRUN / XML / JSON / BASH 语法高亮，零外部高亮依赖。
 * - 行号 + 横向滚动（`<pre tabIndex=0>` 保证键盘可滚动）。
 * - 截断语汇统一走 `ScrollEdge` 的遮罩渐隐 —— 从前这里用背景渐变画「纸边墨影」，
 *   而背景画在文字**背后**，字形本身仍旧被 overflow 在某个像素上齐刷刷切断，
 *   屏幕上读起来是「渲染坏了」。遮罩作用于内容，末列字形是真的淡出去的。
 * - 受控行状态：highlightLines / dirtyLines / dimLines —— T6 的局部重编译镜头依赖。
 *
 * 无 'use client'：本身不用 hooks，可作 RSC，也可被 client section 直接导入。
 */
export function CodeBlock({
  lines,
  code,
  lang = 'svml',
  filename,
  meta,
  caption,
  showLineNumbers = true,
  startLine = 1,
  highlightLines,
  dirtyLines,
  dimLines,
  lineAttr = 'data-code-line',
  wrap = false,
  maxHeight,
  maxLines,
  ariaLabel,
  dense = false,
  className,
  preClassName,
}: CodeBlockProps) {
  const resolved: readonly CodeLineData[] =
    lines ?? (code ? tokenizeCode(code, lang) : [])

  const hlSet = toSet(highlightLines)
  const dirtySet = toSet(dirtyLines)
  const dimSet = toSet(dimLines)
  const gutterWidth = String(startLine + resolved.length - 1).length

  /**
   * 行的 `opacity` 只有 `dim` 态会用到，所以**只在真的传了 `dimLines` 时**才把它
   * 放进 transition-property。
   *
   * 为什么要这么抠：GSAP 的逐行点亮（Hero `[data-hero-code-line]`）是每帧往
   * inline style 写 `opacity` 的。如果这里常驻一条 `transition: opacity 320ms`，
   * 浏览器会在每一帧重新起一段过渡去追 GSAP 刚写下的新目标值——两套引擎同时
   * 动同一个属性，渲染出来的值永远落在半路上，静止时看起来就是「淡到读不了」。
   * 背景色（dirty / hl）没有第二个写入方，保留过渡不会打架。
   */
  const transitionsOpacity = dimSet !== null

  const label =
    ariaLabel ?? (typeof filename === 'string' ? filename : undefined) ?? `${lang} source`

  // 行数换算优先：它保证裁切落在整行边界上，不会把第 N 行拦腰切断。
  const clampHeight =
    maxLines != null
      ? `${maxLines * CODE_LINE_HEIGHT + (dense ? CODE_PAD_Y.dense : CODE_PAD_Y.normal) * 2}px`
      : maxHeight

  return (
    <figure
      className={cn(
        'border-rule bg-paper-2 group/code relative isolate min-w-0 border',
        className,
      )}
      data-lang={lang}
    >
      <ScrollEdgeStyle />
      {filename || meta ? (
        <figcaption className="border-rule font-mono text-[11px] leading-none text-muted flex min-w-0 items-center justify-between gap-3 border-b px-3 py-2 tracking-[0.12em] uppercase">
          <span className="text-ink min-w-0 truncate">{filename}</span>
          {meta ? <span className="shrink-0">{meta}</span> : null}
        </figcaption>
      ) : null}

      <pre
        tabIndex={0}
        role="region"
        aria-label={label}
        style={clampHeight ? { maxHeight: clampHeight } : undefined}
        className={cn(
          'font-mono text-[14.5px] leading-[26px] text-code-text m-0 min-w-0 overflow-x-auto',
          // 截断语汇（ScrollEdge）：遮罩作用在字形上，最后一列真的淡出去。
          !wrap && X_SCROLL,
          clampHeight && 'overscroll-contain overflow-y-auto',
          // 纵向渐隐只给 `maxHeight`：那种裁切会把某一行拦腰切断，必须有语汇兜住。
          // `maxLines` 的裁切本来就落在整行边界上，那是**故意**的收尾，
          // 再蒙一道 26px 渐隐反而把最后一整行吃掉，等于推翻它自己的设计。
          clampHeight && maxLines == null && Y_SCROLL,
          dense ? 'py-2' : 'py-3',
          'focus-visible:outline-crimson',
          preClassName,
        )}
      >
        <code className="block min-w-max">
          {resolved.map((line, i) => {
            const n = startLine + i
            const state: CodeLineState = dirtySet?.has(n)
              ? 'dirty'
              : hlSet?.has(n) || line.hl
                ? 'hl'
                : dimSet?.has(n)
                  ? 'dim'
                  : 'clean'
            return (
              <span
                key={n}
                {...{ [lineAttr]: n }}
                data-state={state}
                className={cn(
                  'flex min-w-max gap-3 px-3',
                  transitionsOpacity
                    ? 'transition-[background-color,opacity]'
                    : 'transition-[background-color]',
                  'duration-[var(--dur-mid)] ease-[var(--ease-out-quart)]',
                  wrap && 'whitespace-pre-wrap',
                  STATE_CLASS[state],
                )}
              >
                {showLineNumbers ? (
                  <span
                    aria-hidden="true"
                    className="text-code-ln shrink-0 tabular-nums select-none"
                    style={{ width: `${gutterWidth}ch` }}
                  >
                    {pad(n, gutterWidth)}
                  </span>
                ) : null}
                <span className={cn('min-w-0', wrap ? 'whitespace-pre-wrap' : 'whitespace-pre')}>
                  {line.tokens.length ? <CodeTokens tokens={line.tokens} /> : ' '}
                </span>
              </span>
            )
          })}
        </code>
      </pre>

      {caption ? (
        <figcaption className="border-rule text-muted text-sm border-t px-3 py-2">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

/** 便捷：取代码块纯文本（供上层做复制 / OG 图）。 */
export function codeBlockText(props: Pick<CodeBlockProps, 'lines' | 'code' | 'lang'>): string {
  if (props.lines) return linesToText(props.lines)
  return props.code ?? ''
}

export default CodeBlock
