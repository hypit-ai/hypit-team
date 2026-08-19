'use client'

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { L10n, L10nList, Locale, Localized } from '@/lib/data/types'
import { DEFAULT_LOCALE, LOCALE_COOKIE, pick } from '@/lib/i18n'

/*
 * 基元定义在 lib/i18n.ts（无 'use client'），这里只 re-export 保持既有导入路径可用。
 * 服务端组件请直接从 '@/lib/i18n' 导入，不要从本文件导入——本文件是客户端模块。
 */
export { DEFAULT_LOCALE, LOCALE_COOKIE, pick } from '@/lib/i18n'

export interface LocaleContextValue {
  locale: Locale
  setLocale: (next: Locale) => void
  toggle: () => void
  /** t(l10n) → string；t(l10nList) → string[] */
  t: {
    (value: L10n): string
    (value: L10nList): string[]
    <T>(value: Localized<T>): T
  }
}

/* ── cookie 作为外部 store：useSyncExternalStore 订阅，避免 effect 里 setState ── */

const listeners = new Set<() => void>()
let cached: Locale | null = null
/**
 * 服务端注入的语言（cookie 缺失时的客户端回落值）。
 * 有它，首访中文用户（Accept-Language 协商出 cn）在 hydrate 后不会被拉回英文。
 */
let injected: Locale = DEFAULT_LOCALE

function readCookieLocale(): Locale | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE}=(en|cn)`),
  )
  return match ? (match[1] as Locale) : null
}

function writeCookieLocale(locale: Locale): void {
  if (typeof document === 'undefined') return
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`
}

function subscribeLocale(onChange: () => void): () => void {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

function getClientLocale(): Locale {
  if (cached === null) cached = readCookieLocale() ?? injected
  return cached
}

/**
 * 记录服务端已渲染的语言。必须在首次读取快照之前调用（Provider 渲染最开头），
 * 只影响「cookie 尚不存在」这一种情况，已有 cookie 时永远以 cookie 为准。
 */
function adoptServerLocale(initial: Locale): void {
  injected = initial
}

/** 写入 cookie 并通知所有订阅者。可在 React 之外调用。 */
export function setStoredLocale(next: Locale): void {
  if (cached === next) return
  cached = next
  writeCookieLocale(next)
  for (const listener of listeners) listener()
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export interface LocaleProviderProps {
  children: ReactNode
  /** SSR / hydration 期使用的语言，默认 en（D10：默认英文站）。 */
  initialLocale?: Locale
}

/**
 * 语言上下文。SSR 输出 `initialLocale`，hydrate 完成后由 cookie 快照校正，
 * 因此不会产生 hydration mismatch。切换时同步 <html lang>。
 */
export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: LocaleProviderProps) {
  // 渲染最开头写入，保证下一行的 getClientLocale() 首次求值时已拿到服务端语言。
  adoptServerLocale(initialLocale)

  const getServerLocale = useCallback(() => initialLocale, [initialLocale])
  const locale = useSyncExternalStore(
    subscribeLocale,
    getClientLocale,
    getServerLocale,
  )

  useEffect(() => {
    document.documentElement.lang = locale === 'cn' ? 'zh-CN' : 'en'
    // 首访由 Accept-Language 协商出的语言写回 cookie，之后的访问走 cookie 分支，
    // 用户显式切换过就不会再被浏览器语言覆盖。
    if (readCookieLocale() === null) writeCookieLocale(locale)
  }, [locale])

  const value = useMemo<LocaleContextValue>(() => {
    const t = (<T,>(v: Localized<T>): T =>
      pick(v, locale)) as LocaleContextValue['t']
    return {
      locale,
      setLocale: setStoredLocale,
      toggle: () => setStoredLocale(locale === 'en' ? 'cn' : 'en'),
      t,
    }
  }, [locale])

  return createElement(LocaleContext.Provider, { value }, children)
}

/** 读取当前语言。未包裹 Provider 时安全降级为默认英文，不抛错。 */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  const fallback = useMemo<LocaleContextValue>(() => {
    const t = (<T,>(v: Localized<T>): T =>
      pick(v, DEFAULT_LOCALE)) as LocaleContextValue['t']
    return {
      locale: DEFAULT_LOCALE,
      setLocale: setStoredLocale,
      toggle: () => {},
      t,
    }
  }, [])
  return ctx ?? fallback
}
