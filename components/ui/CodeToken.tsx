import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

/**
 * token 种类。与 lib/data/code-samples.ts（T1）的 `TokenKind` 结构一致，
 * 两边靠结构类型对接，互不 import，避免任务间文件耦合。
 */
export type TokenKind = 'kw' | 'str' | 'num' | 'fn' | 'punc' | 'com' | 'plain'

export interface CodeTokenData {
  k: TokenKind
  v: string
}

export interface CodeLineData {
  tokens: CodeTokenData[]
  /** 数据层预置的高亮标记（CodeBlock 的 highlightLines 可再叠加）。 */
  hl?: boolean
}

/** 支持的语言。svml / svs / svrun 都是 XML 家族，共用一套规则。 */
export type CodeLang = 'svml' | 'svs' | 'svrun' | 'xml' | 'json' | 'bash' | 'text'

/**
 * token → globals.css 的 .tok-* 类。
 * 颜色取自 BRAND.md §4 官方语法色表（light / dark 两套，由 CSS 变量切换）：
 *   kw   → tag        紫 #8800e2 / #c792ea
 *   fn   → attr       青 #006e69 / #00fff2
 *   str  → string     #616700 / #eeff00
 *   num  → expression 橙 #ab3f00 / #ff7e34
 *   com  → line-number #7d7dac / #8686867c
 * 注意 tag **用紫不用粉**：粉距 crimson 仅 12.7 CIE76，会与语义标记混成一色；
 * 紫距离 95。改色前先算色差。
 */
export const TOKEN_CLASS: Record<TokenKind, string> = {
  kw: 'tok-kw',
  str: 'tok-str',
  num: 'tok-num',
  fn: 'tok-fn',
  punc: 'tok-punc',
  com: 'tok-com',
  plain: '',
}

/** 语义嵌套深度：1 → attr 青，2 → expression 橙（BRAND.md §4）。 */
export type SemanticDepth = 0 | 1 | 2

export interface CodeTokenProps {
  k?: TokenKind
  /** token 文本。空串会被渲染为零宽内容，调用方无需过滤。 */
  v: string
  className?: string
}

/* ── 语义分组键（供 SemanticCode 的交互层做 DOM 分组）────────────── */

const HOOK_RE = /^@(\/?)([A-Za-z_][\w-]*)!?$/
const EXPR_RE = /^\{([^}]*)\}$/

export interface SemanticKey {
  /** 分组键，如 `hook:problem` / `expr:story.selection`。同键的 token 属于同一语义。 */
  key: string
  /** 锚点标记的开合角色；`{expr}` 这类无区间的引用为 undefined。 */
  role?: 'open' | 'close'
}

/**
 * token → 语义分组键。**纯函数、确定性**，SSR 与 CSR 输出一致。
 *
 * 只认产品自己的两种语义记号（BRAND.md §4 的语义高亮系统）：
 *   `@hook` / `@/hook` → 锚点区间的开与合
 *   `{story.problem}`  → 表达式引用
 * 其余 token 一律返回 null —— 语法着色与语义高亮是两套系统，不要混。
 */
export function semanticKeyOf(k: TokenKind, v: string): SemanticKey | null {
  if (k !== 'fn') return null
  const hook = HOOK_RE.exec(v)
  if (hook) return { key: `hook:${hook[2]}`, role: hook[1] ? 'close' : 'open' }
  const expr = EXPR_RE.exec(v)
  if (expr) return { key: `expr:${expr[1].trim()}` }
  return null
}

/**
 * 单个 token span 工厂。
 * 语义 token 额外带上 `data-sem` / `data-sem-role`——**不带任何样式副作用**，
 * 只是给 `SemanticCode` 的交互层留下抓手；不套 SemanticCode 时它们完全惰性。
 */
export function CodeToken({ k = 'plain', v, className }: CodeTokenProps) {
  const sem = semanticKeyOf(k, v)
  const cls = cn(TOKEN_CLASS[k], className)
  if (!cls && !sem) return <>{v}</>
  return (
    <span className={cls || undefined} data-sem={sem?.key} data-sem-role={sem?.role}>
      {v}
    </span>
  )
}

/** 渲染一整行 token（key 用下标，行内容在一次渲染中稳定）。 */
export function CodeTokens({
  tokens,
  className,
}: {
  tokens: readonly CodeTokenData[]
  className?: string
}): ReactNode {
  return (
    <span className={className}>
      {tokens.map((t, i) => (
        <CodeToken key={i} k={t.k} v={t.v} />
      ))}
    </span>
  )
}

/* ═══════════════ §4 语义高亮系统（官方视觉语言，勿另造）═══════════════ */

/**
 * 范围标记（`@photoshop` 这类）：crimson 字 + 700 + crimson-soft 底
 * + `inset 0 0 0 1px crimson` 描边。视觉在 globals.css 的 `.syn-marker`。
 */
export function SynMarker({
  children,
  depth = 0,
  className,
}: {
  children: ReactNode
  depth?: SemanticDepth
  className?: string
}) {
  return (
    <span className={cn('syn-marker', className)} data-depth={depth || undefined}>
      {children}
    </span>
  )
}

/**
 * 可交互语义词：hover / focus 时 crimson-soft 底 + 1px crimson 环；
 * `active` 时 crimson 实底 + paper 字 + 1.5px 环。
 * depth 1 / 2 分别切到 attr 青与 expression 橙。
 */
export function SemanticToken({
  children,
  active = false,
  depth = 0,
  interactive = true,
  className,
  ...rest
}: {
  children: ReactNode
  active?: boolean
  depth?: SemanticDepth
  /** false → 纯展示，不进 tab 序列。 */
  interactive?: boolean
  className?: string
} & Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'className'>) {
  return (
    <span
      {...rest}
      className={cn('semantic-token', active && 'semantic-active', className)}
      data-depth={depth || undefined}
      data-active={active || undefined}
      {...(interactive ? { tabIndex: 0, role: 'button' } : {})}
    >
      {children}
    </span>
  )
}

/* ═══════════════════ 内置分词器（零外部依赖）═══════════════════ */

const XML_LIKE = new Set<CodeLang>(['svml', 'svs', 'svrun', 'xml'])

/** 把连续 token 里相邻的同类合并，减少 DOM 节点。 */
function push(out: CodeTokenData[], k: TokenKind, v: string): void {
  if (!v) return
  const last = out[out.length - 1]
  if (last && last.k === k) last.v += v
  else out.push({ k, v })
}

/**
 * SVML / XML 单行分词。
 * 覆盖：`<?svml … ?>` 处理指令、`<!-- -->` 注释、标签名、属性名、
 * 字符串、`{expr}` 表达式引用、`@hook … @/hook` 锚点标记、数字、标点。
 *
 * 注意：这是一行一行的**近似**着色器（不跨行维护状态），
 * 跨行注释请在数据层（T1）预切 token，或整块传 `code` 走 tokenizeCode。
 */
function tokenizeXmlLine(line: string, inComment: boolean): {
  tokens: CodeTokenData[]
  inComment: boolean
} {
  const out: CodeTokenData[] = []
  let i = 0
  let comment = inComment

  while (i < line.length) {
    if (comment) {
      const end = line.indexOf('-->', i)
      if (end === -1) {
        push(out, 'com', line.slice(i))
        return { tokens: out, inComment: true }
      }
      push(out, 'com', line.slice(i, end + 3))
      i = end + 3
      comment = false
      continue
    }

    if (line.startsWith('<!--', i)) {
      comment = true
      push(out, 'com', '<!--')
      i += 4
      continue
    }

    // 处理指令 <?svml … ?>
    if (line.startsWith('<?', i) || line.startsWith('?>', i)) {
      push(out, 'kw', line.slice(i, i + 2))
      i += 2
      continue
    }

    // 标签开合
    if (line[i] === '<') {
      const m = /^<\/?[A-Za-z_][\w.:-]*/.exec(line.slice(i))
      if (m) {
        push(out, 'punc', m[0].startsWith('</') ? '</' : '<')
        push(out, 'kw', m[0].replace(/^<\/?/, ''))
        i += m[0].length
        continue
      }
      push(out, 'punc', '<')
      i += 1
      continue
    }

    if (line.startsWith('/>', i)) {
      push(out, 'punc', '/>')
      i += 2
      continue
    }

    if (line[i] === '>') {
      push(out, 'punc', '>')
      i += 1
      continue
    }

    // 字符串
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i]
      let j = i + 1
      while (j < line.length && line[j] !== quote) j += 1
      push(out, 'str', line.slice(i, Math.min(j + 1, line.length)))
      i = j + 1
      continue
    }

    // {expr} 引用（SVML 的 within={vertical} / {story.selection.problem}）
    if (line[i] === '{') {
      const end = line.indexOf('}', i)
      const stop = end === -1 ? line.length : end + 1
      push(out, 'fn', line.slice(i, stop))
      i = stop
      continue
    }

    // @hook / @/hook 锚点标记
    if (line[i] === '@') {
      const m = /^@\/?[A-Za-z_][\w-]*!?/.exec(line.slice(i))
      if (m) {
        push(out, 'fn', m[0])
        i += m[0].length
        continue
      }
    }

    // 属性名（紧跟 = 的标识符）
    const attr = /^[A-Za-z_][\w.:-]*(?=\s*=)/.exec(line.slice(i))
    if (attr) {
      push(out, 'fn', attr[0])
      i += attr[0].length
      continue
    }

    // 数字（含 41ms / 100% / 1.5s）
    const num = /^-?\d+(\.\d+)?(%|ms|s|px|fps)?/.exec(line.slice(i))
    if (num && /^[-\d]/.test(line[i])) {
      push(out, 'num', num[0])
      i += num[0].length
      continue
    }

    if ('=/:,;()[]|&'.includes(line[i])) {
      push(out, 'punc', line[i])
      i += 1
      continue
    }

    push(out, 'plain', line[i])
    i += 1
  }

  return { tokens: out, inComment: comment }
}

const JSON_KEY = /^"(?:[^"\\]|\\.)*"(?=\s*:)/
const JSON_STR = /^"(?:[^"\\]|\\.)*"/
const JSON_NUM = /^-?\d+(\.\d+)?([eE][+-]?\d+)?/
const JSON_LIT = /^(true|false|null)\b/

function tokenizeJsonLine(line: string): CodeTokenData[] {
  const out: CodeTokenData[] = []
  let i = 0
  while (i < line.length) {
    const rest = line.slice(i)
    const key = JSON_KEY.exec(rest)
    if (key) {
      push(out, 'fn', key[0])
      i += key[0].length
      continue
    }
    const str = JSON_STR.exec(rest)
    if (str) {
      push(out, 'str', str[0])
      i += str[0].length
      continue
    }
    const lit = JSON_LIT.exec(rest)
    if (lit) {
      push(out, 'kw', lit[0])
      i += lit[0].length
      continue
    }
    const num = JSON_NUM.exec(rest)
    if (num) {
      push(out, 'num', num[0])
      i += num[0].length
      continue
    }
    if ('{}[]:,'.includes(line[i])) {
      push(out, 'punc', line[i])
      i += 1
      continue
    }
    push(out, 'plain', line[i])
    i += 1
  }
  return out
}

function tokenizeBashLine(line: string): CodeTokenData[] {
  const trimmed = line.trimStart()
  if (trimmed.startsWith('#')) return [{ k: 'com', v: line }]

  const out: CodeTokenData[] = []
  let rest = line
  // 提示符
  const prompt = /^(\s*[$>]\s)/.exec(rest)
  if (prompt) {
    push(out, 'punc', prompt[0])
    rest = rest.slice(prompt[0].length)
  }
  // 命令名
  const cmd = /^[\w./-]+/.exec(rest)
  if (cmd) {
    push(out, 'kw', cmd[0])
    rest = rest.slice(cmd[0].length)
  }
  for (const part of rest.split(/(\s+)/)) {
    if (!part) continue
    if (/^\s+$/.test(part)) push(out, 'plain', part)
    else if (part.startsWith('--') || part.startsWith('-')) push(out, 'fn', part)
    else if (/^-?\d/.test(part)) push(out, 'num', part)
    else if (/^["']/.test(part)) push(out, 'str', part)
    else push(out, 'plain', part)
  }
  return out
}

/** 单行分词（不维护跨行状态；跨行注释请用 tokenizeCode）。 */
export function tokenizeLine(line: string, lang: CodeLang = 'svml'): CodeTokenData[] {
  if (lang === 'text') return [{ k: 'plain', v: line }]
  if (lang === 'json') return tokenizeJsonLine(line)
  if (lang === 'bash') return tokenizeBashLine(line)
  return tokenizeXmlLine(line, false).tokens
}

/**
 * 整块源码 → 逐行 token。XML 家族会跨行维护 `<!-- -->` 注释状态。
 * 纯函数、确定性输出，服务端渲染安全（无 hydration 抖动）。
 */
export function tokenizeCode(code: string, lang: CodeLang = 'svml'): CodeLineData[] {
  const rawLines = code.replace(/\r\n?/g, '\n').split('\n')
  if (!XML_LIKE.has(lang)) {
    return rawLines.map((line) => ({ tokens: tokenizeLine(line, lang) }))
  }
  let inComment = false
  return rawLines.map((line) => {
    const res = tokenizeXmlLine(line, inComment)
    inComment = res.inComment
    return { tokens: res.tokens }
  })
}

/** token 行 → 纯文本（复制按钮 / aria-label 用）。 */
export function linesToText(lines: readonly CodeLineData[]): string {
  return lines.map((l) => l.tokens.map((t) => t.v).join('')).join('\n')
}

export default CodeToken
