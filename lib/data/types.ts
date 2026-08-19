/**
 * 公共基元类型（蓝图 §3.0）。
 * 所有 lib/data/* 的数据文件都从这里取双语基元；组件层禁止硬编码文案。
 */

/** 站点语言。默认英文站 + 中文可切（D10）。 */
export type Locale = 'en' | 'cn'

/** 双语文本。首版可只渲染 en，但两个字段都必须写。 */
export interface L10n {
  en: string
  cn: string
}

/** 双语文本列表（段落组 / 要点组）。两侧长度应一致。 */
export interface L10nList {
  en: string[]
  cn: string[]
}

/** 任意值的双语容器（供数据层需要非字符串双语时使用）。 */
export interface Localized<T> {
  en: T
  cn: T
}

/** 外链引用。url 为 null 时 UI 层必须自动隐藏，禁止渲染死链（D9）。 */
export interface LinkRef {
  id: string
  label: string
  url: string | null
  external?: boolean
  note?: string
}
