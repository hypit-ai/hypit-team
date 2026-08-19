import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound as copy } from '@/lib/data/not-found'
import { pick } from '@/lib/i18n'
import { resolveLocale } from '@/lib/server/locale'

/**
 * 404。RSC —— 语言在服务端解析（cookie → Accept-Language → en），
 * 因此 `<title>` 与正文永远同一种语言。文案全部来自 `lib/data/not-found.ts`，
 * 页面里出现的字符只有代码记号（`error` `<route>` `//`）。
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale()
  return {
    title: pick(copy.metaTitle, locale),
    description: pick(copy.title, locale),
    robots: { index: false, follow: false },
  }
}

export default async function NotFound() {
  const locale = await resolveLocale()
  const t = <T,>(value: { en: T; cn: T }) => pick(value, locale)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-(--container-prose) flex-col justify-center gap-block px-6 py-section">
      <p className="text-eyebrow font-mono text-text-2 uppercase">{copy.eyebrow}</p>

      <h1 className="text-h1 text-text-0">{t(copy.title)}</h1>

      <div className="border-line border-t pt-6">
        <pre className="text-mono text-text-1 overflow-x-auto font-mono">
          <code>
            <span className="tok-com">{t(copy.error.comment)}</span>
            {'\n'}
            <span className="tok-kw">{copy.error.keyword}</span>
            <span className="tok-punc">: </span>
            {t(copy.error.message)}
            <span className="tok-str">{copy.error.token}</span>
            {'\n'}
            <span className="tok-com">{t(copy.error.hint)}</span>
          </code>
        </pre>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="border-crimson text-crimson hover:bg-crimson hover:text-on-crimson text-mono inline-flex min-h-11 items-center border px-5 font-mono uppercase tracking-[0.16em] transition-colors duration-(--dur-base)"
        >
          {t(copy.backLabel)}
        </Link>
      </div>

      <hr className="rule-ruler" />
    </main>
  )
}
