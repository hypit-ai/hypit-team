'use client'

import { useLocale } from '@/hooks/useLocale'
import type { L10n, Locale } from '@/lib/data/types'
import { cn } from '@/lib/utils/cn'

/**
 * 控件标识符（等同 `SEC/` `BUILD` 这类 HUD 记号），不是可翻译文案。
 * 需要改词时由调用方通过 props 覆盖，组件内不做文案分支。
 */
export const LOCALE_SWITCH_LABEL = 'LANG'

/** 方括号内 / 兜底显示用的语言码。 */
export const LOCALE_CODE: Record<Locale, string> = { en: 'EN', cn: 'CN' }

/**
 * 选项文字用**母语自称**（endonym）：英文选项永远写 `EN`，中文选项永远写 `中文`。
 * 这是国际惯例——语言切换器不随当前界面语言翻译，否则不懂当前语言的人反而找不到出口。
 * 因此它们是标识符而非文案，不进数据层。
 */
export const LOCALE_ENDONYM: Record<Locale, string> = { en: 'EN', cn: '中文' }

/** 无障碍说明（唯一的双语文案，无归属 section 数据文件，故就近定义并可由 props 覆盖）。 */
const A11Y_GROUP: L10n = { en: 'Language', cn: '语言' }
const A11Y_OPTION: Record<Locale, L10n> = {
  en: { en: 'Switch to English', cn: '切换到英文' },
  cn: { en: 'Switch to Chinese', cn: '切换到中文' },
}

const ORDER: readonly Locale[] = ['en', 'cn']

export interface LocaleSwitchProps {
  /** 前缀标识符，默认 `LANG`。传 null 隐藏（导航栏空间紧张时用）。 */
  label?: string | null
  /** 无障碍分组名，由调用方覆盖时优先。 */
  'aria-label'?: string
  className?: string
}

/**
 * 语言切换（D10：默认英文站 + 中文可切）。
 *
 * 形态语言（BRAND.md §3）：零圆角、1px rule 描边、无阴影、mono 小字 uppercase；
 * hover / 当前项走 crimson，段与段之间用 1px 竖线分隔。
 *
 * 行为：两态显式选择（不是盲切），点当前项不做任何事；写 cookie 持久化，
 * 由 `useLocale` 的 useSyncExternalStore 广播，全站同秒生效、无 hydration 抖动。
 *
 * 可访问性：原生 `<button>`（Tab 可达、Enter/Space 可激活），
 * `role="group"` + `aria-label` 说明用途，当前项 `aria-pressed`；
 * 每个按钮 `min-h-11 min-w-11`（≥44px 命中区），焦点态由 globals.css 的 :focus-visible 统一给。
 */
export function LocaleSwitch({
  label = LOCALE_SWITCH_LABEL,
  'aria-label': ariaLabel,
  className,
}: LocaleSwitchProps) {
  const { locale, setLocale, t } = useLocale()

  return (
    <div
      role="group"
      aria-label={ariaLabel ?? t(A11Y_GROUP)}
      className={cn('inline-flex items-center gap-2', className)}
    >
      {label ? (
        <span
          aria-hidden="true"
          className="text-text-2 font-mono text-[length:var(--text-eyebrow)] tracking-[0.16em] uppercase"
        >
          {label}
        </span>
      ) : null}

      <div className="border-line relative inline-flex items-stretch rounded-none border">
        {/*
          当前项指示：一条 1px crimson 底线在两态之间平移（.24s / --ease-out-quart）。
          CREATIVE.md §6「语言切换」要的是「旧字让位、新字接管」的位移感，
          用一条线表达比给字做 clip 更克制，也不会在窄屏里抖动。
        */}
        <span
          aria-hidden="true"
          style={{
            width: `${100 / ORDER.length}%`,
            transform: `translateX(${ORDER.indexOf(locale) * 100}%)`,
          }}
          className="bg-crimson pointer-events-none absolute bottom-0 left-0 h-px transition-transform duration-[var(--dur-base)] ease-[var(--ease-out-quart)] motion-reduce:transition-none"
        />
        {ORDER.map((option, i) => {
          const current = option === locale
          return (
            <button
              key={option}
              type="button"
              lang={option === 'cn' ? 'zh-CN' : 'en'}
              aria-pressed={current}
              aria-label={t(A11Y_OPTION[option])}
              onClick={() => setLocale(option)}
              className={cn(
                'inline-flex min-h-11 min-w-11 items-center justify-center rounded-none px-3',
                'font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] whitespace-nowrap uppercase',
                'transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
                'hover:text-carbide',
                i > 0 ? 'border-line border-l' : null,
                current ? 'text-carbide' : 'text-text-1',
              )}
            >
              {LOCALE_ENDONYM[option]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default LocaleSwitch
