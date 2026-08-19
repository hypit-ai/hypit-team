import {
  Bricolage_Grotesque,
  JetBrains_Mono,
  Manrope,
} from 'next/font/google'

/**
 * 技术标注与源码保持等宽；正文不再全部伪装成代码。
 */
export const monoLatin = JetBrains_Mono({
  variable: '--font-mono-latin',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
  fallback: [
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'monospace',
  ],
})

/**
 * Bricolage Grotesque 的不规则宽度和收口更像一套被“编译”过的品牌字形，
 * 用在短宣言、人物姓名和大型数字；它不承担长段阅读。
 */
export const displayLatin = Bricolage_Grotesque({
  variable: '--font-display-latin',
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600', '700', '800'],
  fallback: ['Arial', 'sans-serif'],
})

/**
 * Manrope 提供更松、更安静的正文节奏；仅加载 Latin，中文继续使用系统 CJK。
 */
export const bodyLatin = Manrope({
  variable: '--font-body-latin',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  fallback: ['Arial', 'sans-serif'],
})

/** 兼容旧组件里的 sans 语义。 */
export const sansLatin = bodyLatin

/**
 * 中文回退栈（BRAND.md §2）。必须排在 Latin mono **之后**——
 * 没有 mono 字体覆盖汉字，若把 CJK 排前面会把中文拉成 Latin 字宽。
 * 不加载 webfont，走系统字体。
 */
export const cnFontStack =
  '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", sans-serif'

/** 挂到 <html> 上的 className 集合。 */
export const fontVariables = `${monoLatin.variable} ${displayLatin.variable} ${bodyLatin.variable}`
