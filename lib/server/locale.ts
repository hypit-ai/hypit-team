import { cookies, headers } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE } from '@/lib/i18n'
import type { Locale } from '@/lib/data/types'

/**
 * 服务端解析当前语言：cookie 优先，其次 Accept-Language 协商，最后回落默认英文。
 *
 * 原本这段逻辑只长在 `app/layout.tsx` 里，于是 `/team` `/manifesto` `not-found`
 * 三处的 `metadata` 直接取 `.en`，中文用户拿到的 `<title>` / `description` 永远是英文
 * ——页面正文是中文、meta 是英文，分享出去和搜索结果里都不成立。
 * 抽到这里给全站四个入口共用。
 *
 * 代价：读 cookie / header 会把调用方标记为动态渲染。本站全是滚动叙事，无 ISR 需求。
 */
export async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const stored = cookieStore.get(LOCALE_COOKIE)?.value
  if (stored === 'en' || stored === 'cn') return stored

  const accept = (await headers()).get('accept-language')
  if (accept && /(^|[,\s])zh\b/i.test(accept)) return 'cn'
  return DEFAULT_LOCALE
}
