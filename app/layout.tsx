import type { Metadata, Viewport } from 'next'
import type { CSSProperties } from 'react'
import { cnFontStack, fontVariables } from './fonts'
import { Grain } from '@/components/ui/Grain'
import { LocaleProvider } from '@/hooks/useLocale'
import { pick } from '@/lib/i18n'
import { resolveLocale } from '@/lib/server/locale'
import type { L10n, Locale } from '@/lib/data/types'
import './globals.css'

const SITE_URL = 'https://narratage.hypit.ai'
const SITE_NAME = 'Narratage'

/**
 * 文档级文案（<title> / description / skip-link）。
 * 这些字符串没有归属的 section 数据文件，因此就近定义在 layout，
 * 但同样是双语 L10n，组件里不出现裸英文。
 */
const SITE_TAGLINE: L10n = {
  en: 'Humans edit video. Agents compile it.',
  cn: '人剪辑视频，Agent 编译视频。',
}
const SITE_DESCRIPTION: L10n = {
  en: 'A source-first video programming language and system for AI agents. No timeline — videos are written, not dragged.',
  cn: '面向 AI Agent 的视频编程语言与系统。没有时间轴——视频是写出来的，不是拖出来的。',
}
const SKIP_TO_CONTENT: L10n = { en: 'Skip to content', cn: '跳到主内容' }

const KEYWORDS: Record<Locale, string[]> = {
  en: [
    'Narratage',
    'SVML',
    'video programming language',
    'AI agents',
    'video compiler',
    'agentic video',
  ],
  cn: [
    'Narratage',
    'SVML',
    '视频编程语言',
    'AI Agent',
    '视频编译器',
    '智能体视频',
  ],
}

/** HTML `lang` 与 OpenGraph `locale` 的取值表。 */
const HTML_LANG: Record<Locale, string> = { en: 'en', cn: 'zh-CN' }
const OG_LOCALE: Record<Locale, string> = { en: 'en_US', cn: 'zh_CN' }

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale()
  const tagline = pick(SITE_TAGLINE, locale)
  const description = pick(SITE_DESCRIPTION, locale)
  const title = `${SITE_NAME} — ${tagline}`

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s — ${SITE_NAME}`,
    },
    description,
    applicationName: SITE_NAME,
    keywords: KEYWORDS[locale],
    alternates: {
      canonical: '/',
      // 同一 URL 通过 cookie / Accept-Language 协商双语内容，
      // 因此 en 与 zh-CN 指向同一地址，x-default 落英文。
      languages: {
        en: '/',
        'zh-CN': '/',
        'x-default': '/',
      },
    },
    icons: {
      icon: [{ url: '/logo-mark.svg', type: 'image/svg+xml' }],
      shortcut: ['/favicon.ico'],
    },
    openGraph: {
      type: 'website',
      url: SITE_URL,
      siteName: SITE_NAME,
      title,
      description,
      locale: OG_LOCALE[locale],
      alternateLocale: [OG_LOCALE[locale === 'cn' ? 'en' : 'cn']],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: { index: true, follow: true },
  }
}

export const viewport: Viewport = {
  // BRAND.md §6 第 2 条：默认 light（纸），dark 跟随系统。
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f0e8' },
    { media: '(prefers-color-scheme: dark)', color: '#131211' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const locale = await resolveLocale()

  return (
    <html
      lang={HTML_LANG[locale]}
      className={`${fontVariables} antialiased`}
      style={{ '--font-cn': cnFontStack } as CSSProperties}
      suppressHydrationWarning
    >
      <body className="bg-bg-0 text-text-0 text-body min-h-dvh">
        <a className="skip-link" href="#main">
          {pick(SKIP_TO_CONTENT, locale)}
        </a>
        {/*
          纸纹是全站唯一的质感来源（BRAND.md §3.2），因此挂在 layout 而不是首页：
          子页 /team /manifesto 必须同纸。fixed / z-45 / pointer-events:none。
          SmoothScroll / CanvasHost / Nav / Footer / HudFrame 属于长滚动首页的装配，
          由 app/page.tsx 自行挂载——子页走原生滚动，不需要 WebGL 与 Lenis。
        */}
        <Grain />
        <LocaleProvider initialLocale={locale}>
          <div id="main" className="relative z-1">
            {children}
          </div>
        </LocaleProvider>
      </body>
    </html>
  )
}
