/**
 * 语言基元：常量与纯函数，**不带 'use client'**。
 *
 * 这些东西服务端组件（app/layout.tsx 的 RootLayout、generateMetadata）和客户端
 * 组件都要用。放在 hooks/useLocale.ts 里会被 'use client' 标记成客户端模块，
 * 服务端再调用 pick() 就会抛
 * "Attempted to call pick() from the server but pick is on the client"。
 * 所以基元留在这里，hooks/useLocale.ts 只负责 React 上下文并 re-export。
 */

import type { Locale, Localized } from '@/lib/data/types'

export const LOCALE_COOKIE = 'narratage_locale'

/** D10：默认英文站。 */
export const DEFAULT_LOCALE: Locale = 'en'

/** 从双语容器里取当前语言的值。纯函数，服务端可直接调用。 */
export function pick<T>(value: Localized<T>, locale: Locale): T {
  return locale === 'cn' ? value.cn : value.en
}

/** 把任意输入收敛成合法 Locale，非法值回落到默认语言。 */
export function normalizeLocale(value: string | undefined | null): Locale {
  return value === 'cn' || value === 'en' ? value : DEFAULT_LOCALE
}

/** <html lang> 用的 BCP 47 标签。 */
export function htmlLang(locale: Locale): string {
  return locale === 'cn' ? 'zh-CN' : 'en'
}
