'use client'

/**
 * S0 · 常驻导航（蓝图 §1 S0 / §7 T4）。
 *
 * 形态是**报头**，不是居中导航条（P1-4）：字标 + 版本号 + 五个乐章目录全部靠左
 * 顶格排在同一行，像一份刊物的刊头；居中 inline 链接那套默认款已经取消。
 *
 * - 左：logo mark + 字标 + `v0.0.1`（品牌资产取自仓库 logo-mark.svg 的字形，改用
 *   currentColor 描边，避免引入第三种强调色 —— §4.1 强调色只允许 carbide / fuse）。
 * - 紧随其后：mono 目录条，当前 section 下方 1px carbide 下划线。下划线只写
 *   `transform`（translateX + scaleX，末端 3px 刻度按 `--u-inv` 反向缩放补偿），
 *   不再逐帧动 `width`（P0-8）。
 * - 导航条高度恒定：报头不会自己缩起来，滚动只换底色（此前的 `transition-[height]`
 *   是一条逐帧 layout 动画，已删）。
 * - 右：GitHub（star 数为 null 时按 D9 隐藏徽标）、Discord、LANG、SET[+]、CTA。
 * - 横向预算（P0-1）：报头宽 max-w-shell = 1280px，减 px-12×2 只剩 1184px，
 *   而「字标+版本 · 五个乐章 · DISCORD · LANG · THEME · MOTION · CTA」全展开要
 *   ≈1440px，此前 `ml-auto` 那组被直接推出容器、CTA 被 overflow-x:clip 切掉半截。
 *   现在的取舍：① 目录条全展开的断点从 lg 抬到 xl（lg 一档整条报头走抽屉）；
 *   ② THEME / MOTION 是设置不是导航，收进 SET[+] 次级抽屉；③ 版本号与 LANG
 *   前缀只在 2xl 出现；④ 右栏 gap-3→gap-2、乐章 px-3→px-2。
 *   xl(1184px 可用) 实占约 1000px，2xl 约 1110px，三档均有余量。
 * - 滚动超过 80vh：背景 transparent → 实心 `bg-paper` + 底部 1px rule。
 *   （不用 backdrop-blur 半透明：BRAND.md §9.2 禁玻璃拟态，且纸底上模糊层会
 *   把 np-grain 的颗粒糊成一条脏带，实心纸色反而更「报头」。）
 * - 移动端：锚点收进全屏抽屉（h-dvh，从右推入 .32s），每项 min-h-11。
 *
 * 所有文案来自 `lib/data/nav.ts` / `lib/data/links.ts`。
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
} from 'react'
import { subscribeScroll } from '@/components/scroll/scrollBus'
import { cn } from '@/lib/utils/cn'
import { pad } from '@/lib/utils/format'
import { nav } from '@/lib/data/nav'
import { linkById } from '@/lib/data/links'
import { Button } from './Button'
import { MonoTag } from './MonoTag'
import { LocaleSwitch } from './LocaleSwitch'
import { useLocale } from '@/hooks/useLocale'
import { useActiveSection } from '@/components/scroll/activeSection'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useCompileStore } from '@/lib/store/compile'
import { setTierOverride } from '@/components/three/useTier'
import { scrollToTarget } from '@/components/scroll/SmoothScroll'

/** 导航条高度（px），锚点跳转偏移与抽屉顶部内距都用它。恒定，不随滚动变化。 */
export const NAV_HEIGHT = 64
export const NAV_HEIGHT_LG = 74

/** MOTION 开关的控件标识符（M2 方括号状态字符，非可翻译文案）。 */
const MOTION_LABEL = 'MOTION'
const MOTION_STATE = { on: 'ON', off: 'OFF' } as const
/** 主题开关的控件标识符（CREATIVE §6）。同样是 HUD 记号，不是文案。 */
const THEME_LABEL = 'THEME'
const THEME_STATE = { light: 'LIGHT', dark: 'DARK' } as const
const THEME_STORAGE_KEY = 'nt-theme'
type ThemeName = keyof typeof THEME_STATE
/** 移动端抽屉按钮的 ASCII 记号。 */
const MENU_GLYPH = { open: '≡', close: '×' } as const
/**
 * 次级工具菜单的控件标识符（与 THEME / MOTION / LANG 同类：HUD 记号，不是文案）。
 * THEME / MOTION 是**设置**不是**导航**，报头一行放不下五个乐章 + 两个开关 + CTA
 * （max-w-shell = 1280px，全展开约需 1440px），所以把它们收进 `SET[+]` 抽屉。
 */
const UTIL_LABEL = 'SET'
const UTIL_STATE = { open: '−', closed: '+' } as const

const githubLink = linkById(nav.ctaLinkId)
const discordLink = linkById('discord')

/* ────────────────────────────────────────────────────────────── */

/** 品牌 mark：仓库 logo-mark 的字形，方形 2px 圆角 + currentColor。 */
function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cn('size-7 shrink-0', className)}
    >
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.45"
      />
      <path
        d="M9 10.5C9 8.567 10.567 7 12.5 7H23V11H13V14H19.5C21.433 14 23 15.567 23 17.5V21.5C23 23.433 21.433 25 19.5 25H9V21H19V18H12.5C10.567 18 9 16.433 9 14.5V10.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * MOTION[ON] / MOTION[OFF]。
 * OFF 时把渲染档位锁到 `static`（不挂 Canvas，走 CSS 静态兜底），
 * 并在 <html> 上写 `data-motion="off"` 供样式层进一步降级。
 * 系统级 `prefers-reduced-motion` 为真时强制 OFF 且不可开启。
 */
function MotionToggle({ className }: { className?: string }) {
  const systemReduced = useReducedMotion()
  const tier = useCompileStore((s) => s.tier)
  const locked = useCompileStore((s) => s.tierLocked)
  const off = systemReduced || (locked && tier === 'static')

  useEffect(() => {
    document.documentElement.dataset.motion = off ? 'off' : 'on'
  }, [off])

  const toggle = useCallback(() => {
    if (systemReduced) return
    setTierOverride(off ? null : 'static')
  }, [off, systemReduced])

  return (
    <MonoTag
      label={MOTION_LABEL}
      value={off ? MOTION_STATE.off : MOTION_STATE.on}
      onClick={systemReduced ? undefined : toggle}
      tone={off ? 'muted' : 'default'}
      aria-label={`${MOTION_LABEL}: ${off ? MOTION_STATE.off : MOTION_STATE.on}`}
      className={className}
    />
  )
}

/* ── 主题：模块级外部 store（与 useLocale 同样的 useSyncExternalStore 模式）──
 * 不在 effect 里 setState，因此不会级联渲染；SSR 快照恒为 null，hydrate 无抖动。 */
let themeCache: ThemeName | null = null
const themeListeners = new Set<() => void>()

function readTheme(): ThemeName | null {
  if (typeof window === 'undefined') return null
  if (themeCache) return themeCache
  let stored: string | null = null
  try {
    stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  } catch {
    stored = null
  }
  themeCache =
    stored === 'light' || stored === 'dark'
      ? stored
      : window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
  return themeCache
}

/** SSR 快照：服务端不知道系统偏好，恒为 null（UI 显示 `—`）。 */
function readServerTheme(): ThemeName | null {
  return null
}

function subscribeTheme(onChange: () => void): () => void {
  themeListeners.add(onChange)
  return () => {
    themeListeners.delete(onChange)
  }
}

function writeTheme(next: ThemeName): void {
  themeCache = next
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    /* 隐私模式下写不进去也不影响当前会话 */
  }
  for (const listener of themeListeners) listener()
}

/**
 * THEME[LIGHT] / THEME[DARK]（BRAND.md §1：两套主题都必须实现，默认跟随系统）。
 *
 * 挂载后**总是**把解析结果写进 `<html data-theme>`：globals.css 的
 * `prefers-color-scheme` 分支只重定义了 4 个色 token，而 `[data-theme="dark"]`
 * 分支才是完整色板；显式写入可以让系统深色用户也拿到完整的一套。
 * 首帧 value 为 `—`（服务端与客户端一致），避免 hydration 抖动。
 */
function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, readServerTheme)

  useEffect(() => {
    if (!theme) return
    const el = document.documentElement
    el.dataset.theme = theme
    el.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggle = useCallback(() => {
    writeTheme(readTheme() === 'dark' ? 'light' : 'dark')
  }, [])

  const value = theme ? THEME_STATE[theme] : '—'

  return (
    <MonoTag
      label={THEME_LABEL}
      value={value}
      onClick={toggle}
      tone="muted"
      aria-label={`${THEME_LABEL}: ${value}`}
      className={className}
    />
  )
}

/**
 * `SET[+]` / `SET[−]`：桌面报头的次级工具抽屉，装 THEME 与 MOTION 两个开关。
 *
 * 报头一行的横向预算是 max-w-shell（1280px）减两侧 px-12，装不下「字标 + 五个乐章
 * + DISCORD + LANG + THEME + MOTION + CTA」；THEME / MOTION 不是导航项，收进这里。
 * 形态仍是品牌语汇：mono / 全大写 / 方括号状态 / 零圆角 / 1px rule 边。
 *
 * 可访问性：原生 button + `aria-expanded` / `aria-controls`；面板关闭时用 `hidden`
 * 属性移出 tab 序；Esc 关闭并把焦点送回按钮；点击面板外或焦点离开即关闭。
 * 按钮与每个菜单项都是 min-h-11（≥44px 命中区）。
 */
function UtilityMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const outside = (target: EventTarget | null) =>
      !(target instanceof Node) || !rootRef.current?.contains(target)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    const onPointerDown = (e: PointerEvent) => {
      if (outside(e.target)) setOpen(false)
    }
    const onFocusIn = (e: FocusEvent) => {
      if (outside(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="nav-utils"
        className={cn(
          'font-mono text-[length:var(--text-eyebrow)] leading-none',
          'inline-flex min-h-11 items-center gap-[0.15em] px-1',
          'tracking-[0.16em] whitespace-nowrap uppercase',
          'transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
          'hover:text-carbide active:translate-y-px',
          open ? 'text-text-0' : 'text-text-2',
        )}
      >
        <span>{UTIL_LABEL}</span>
        <span>
          <span aria-hidden="true">[</span>
          <span className="inline-block w-[1ch] text-center">
            {open ? UTIL_STATE.open : UTIL_STATE.closed}
          </span>
          <span aria-hidden="true">]</span>
        </span>
      </button>

      <div
        id="nav-utils"
        hidden={!open}
        className="bg-paper border-rule absolute top-full right-0 z-10 flex min-w-[12rem] flex-col rounded-none border"
      >
        {/* 内距落在外层：MonoTag 自己的 `px-1` 在 twMerge 里排在 className 之后，
            这里再传 px-* 会被它盖掉。命中区高度仍由 MonoTag 的 min-h-11 保证。 */}
        <div className="flex px-4">
          <ThemeToggle className="flex w-full justify-between gap-3" />
        </div>
        <div className="border-rule flex border-t px-4">
          <MotionToggle className="flex w-full justify-between gap-3" />
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */

export interface NavProps {
  className?: string
}

/**
 * 报头目录条高亮 —— 「现在读到哪个乐章」。
 *
 * 从前这里挂的是 `useSectionActive(五个锚点 id)`：自建一个 IntersectionObserver，
 * 只观察 5 个 section，判定带外就保留上一次结果。17 段里有 12 段不在这 5 个之内，
 * 于是 S08–S10 期间高亮卡在 BUILD，滚到**页脚**（页脚根本不是 section）更是永远
 * 停在最后一次命中的那个乐章上 —— OBSERVED D3 看到的 `03 BUILD` 就是这么来的。
 *
 * 现在改成从全站唯一的 `activeSection` 观察者（盯着全部 17 段）读出当前段号，
 * 再折算成乐章：`at ≥ item.fromSec` 的最后一项。于是
 *  - S08/S09/S10 仍然是 BUILD —— 这次是**推出来的**，不是漏判留下的；
 *  - 页脚拿不到段号时退回最后一次已知段号（17 = 尾声），高亮落在 PEOPLE；
 *  - Hero（01）在第一个乐章之前，谁都不亮 —— 下划线 opacity 0，这是诚实的。
 * 顺带把站内第二个 IntersectionObserver 删掉了（`hooks/useSectionActive` 已移除）。
 */
function useActiveMovement(): string | null {
  // heldSec 而不是 sec：页脚不是 section，判定带在那里是空的，
  // 但读者显然已经读完了最后一个乐章。
  const { heldSec } = useActiveSection()
  if (heldSec === null) return null
  const current = Number.parseInt(heldSec, 10)
  if (Number.isNaN(current)) return null

  let id: string | null = null
  for (const item of nav.items) {
    if (current >= item.fromSec) id = item.id
  }
  return id
}

export function Nav({ className }: NavProps) {
  const { t } = useLocale()
  const active = useActiveMovement()

  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)

  const progressRef = useRef<HTMLSpanElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const itemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())
  const closeRef = useRef<HTMLButtonElement>(null)
  const [underline, setUnderline] = useState<{ x: number; w: number } | null>(null)

  /*
   * 滚动响应（CREATIVE §6）：
   *  - 离开首屏顶部即收起：透明 → 实底纸色 + 底部 1px rule，导航条同时压低。
   *    （不用 backdrop-blur：BRAND §6.6 禁玻璃拟态，纸底上模糊层会把 np-grain
   *     的颗粒糊成一条脏带。）
   *  - 底部一条 crimson 发丝线以 scaleX 表示全文档编译进度。它直写 style，
   *    不进 React state —— 滚动期间只触发 transform 合成，不产生 layout / paint。
   */
  useEffect(() => {
    /*
     * 数据来自 scrollBus —— 全站**唯一**的滚动源。此前这里自建了一份
     * `addEventListener('scroll')` + rAF + `scrollHeight` 量高，功能没错，
     * 但绕开了「一个 body ScrollTrigger」的设计，而且 pin 住的 section
     * 会让 `scrollHeight` 推出的进度与页面真实进度对不上。
     */
    let lastSolid: boolean | null = null
    return subscribeScroll((s) => {
      const solid = s.y > 24
      // 只在真的翻转时 setState —— 滚动期间不产生多余渲染。
      if (solid !== lastSolid) {
        lastSolid = solid
        setSolid(solid)
      }
      const bar = progressRef.current
      if (bar) bar.style.transform = `scaleX(${s.progress})`
    })
  }, [])

  /* 下划线位置：跟随激活项，容器尺寸变化时重算 */
  useLayoutEffect(() => {
    const list = listRef.current
    const measure = () => {
      const el = active ? itemRefs.current.get(active) : undefined
      if (!el || !list) {
        setUnderline(null)
        return
      }
      setUnderline({ x: el.offsetLeft, w: el.offsetWidth })
    }
    measure()
    if (!list || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(list)
    return () => ro.disconnect()
  }, [active])

  /* 抽屉：Esc 关闭 + 锁滚动 + 焦点落到关闭按钮 */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    /* 抽屉只存在于 <xl；窗口被拉宽到桌面档时它会被 `xl:hidden` 藏掉，
       此时若不复位 open，body 的滚动锁会留在页面上而没有任何出口。 */
    const desktop = window.matchMedia('(min-width: 80rem)')
    const syncViewport = () => {
      if (desktop.matches) setOpen(false)
    }
    syncViewport()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    desktop.addEventListener('change', syncViewport)
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      desktop.removeEventListener('change', syncViewport)
    }
  }, [open])

  const go = useCallback((href: string) => {
    scrollToTarget(href, { offset: -NAV_HEIGHT })
    if (typeof history !== 'undefined') history.replaceState(null, '', href)
  }, [])

  const onAnchor = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, href: string) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
      e.preventDefault()
      setOpen(false)
      go(href)
    },
    [go],
  )

  const setItemRef = useCallback(
    (id: string) => (el: HTMLAnchorElement | null) => {
      if (el) itemRefs.current.set(id, el)
      else itemRefs.current.delete(id)
    },
    [],
  )

  return (
    <>
      <header
        id="nav"
        data-section="nav"
        className={cn(
          'fixed inset-x-0 top-0 z-50 w-full',
          'transition-[background-color,border-color]',
          'duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
          solid
            ? 'bg-paper border-rule border-b'
            : 'border-b border-transparent bg-transparent',
          className,
        )}
      >
        <nav
          aria-label={nav.brand.name}
          className={cn(
            'mx-auto flex w-full max-w-shell items-center gap-4 px-5 sm:px-8 lg:px-12',
            // 报头高度恒定（BRAND §3：导航 74px）。滚动只换底色，不动 layout。
            'h-16 lg:h-[74px]',
          )}
        >
          {/* 左：品牌 */}
          <a
            href="#hero"
            onClick={(e) => onAnchor(e, '#hero')}
            className="text-text-0 hover:text-carbide flex min-h-11 shrink-0 items-center gap-2.5 transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)]"
          >
            <BrandMark />
            <span className="font-mono text-eyebrow leading-none tracking-[0.16em] uppercase">
              {nav.brand.wordmark}
            </span>
            {/* 版本号在报头最窄的那一档（xl，容器 1280 − px-12×2 = 1184px）让位给
                乐章目录；2xl 起横向预算够了再放回来。 */}
            <span className="text-text-2 font-mono text-eyebrow leading-none tracking-[0.16em] hidden sm:inline xl:hidden 2xl:inline">
              {nav.brand.version}
            </span>
          </a>

          {/* 目录条：紧贴字标左置（报头的第二栏），前面一道 1px 竖切分隔。
              五个乐章全展开约 430px，连同字标与右栏在 lg(1024) 下必然溢出，
              断点抬到 xl(1280)；lg 一档整条报头走抽屉。 */}
          <ul
            ref={listRef}
            className="border-rule relative hidden items-center gap-1 border-l pl-4 xl:flex"
          >
            {nav.items.map((item, i) => (
              <li key={item.id}>
                <a
                  ref={setItemRef(item.id)}
                  href={item.href}
                  onClick={(e) => onAnchor(e, item.href)}
                  aria-current={active === item.id ? 'true' : undefined}
                  className={cn(
                    'font-mono text-eyebrow leading-none tracking-[0.16em] whitespace-nowrap uppercase',
                    // px-3 → px-2：收紧到刚好还能读出「条目」的间隔（命中区仍 ≥44px 高）
                    'flex min-h-11 items-center gap-2 px-2',
                    // 按下 1px（P2-4：全站 :active 规则数曾经是 0 —— 一个讲「仪器」
                    // 的站点，按下去没有回馈是自相矛盾）
                    'active:translate-y-px',
                    'transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
                    active === item.id ? 'text-text-0' : 'text-text-1 hover:text-text-0',
                  )}
                >
                  {/* 章节序号：校样上的台号，激活时转 crimson */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'text-[length:var(--text-micro)] tabular-nums',
                      'transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
                      active === item.id ? 'text-crimson' : 'text-muted',
                    )}
                  >
                    {pad(i + 1, 2)}
                  </span>
                  {t(item.label)}
                </a>
              </li>
            ))}
            {/*
              当前 section 的下划线：1px crimson + 两端 3px 刻度（np-rule 语汇）。
              本体宽 1px，靠 scaleX 拉到目标宽度 —— 全程只写 transform / opacity。
              两端刻度用 `--u-inv`（= 1/scaleX）反向缩放，保证始终是 1px 竖笔。
            */}
            <span
              aria-hidden="true"
              className={cn(
                'bg-crimson pointer-events-none absolute bottom-1.5 left-0 h-px w-px origin-left',
                'transition-[transform,opacity] duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
                'before:bg-crimson before:absolute before:top-[-3px] before:left-0 before:block before:h-[3px] before:w-px before:origin-left before:content-[""]',
                'before:[transform:scaleX(var(--u-inv,1))]',
                'after:bg-crimson after:absolute after:top-[-3px] after:right-0 after:block after:h-[3px] after:w-px after:origin-right after:content-[""]',
                'after:[transform:scaleX(var(--u-inv,1))]',
                underline ? 'opacity-100' : 'opacity-0',
              )}
              style={
                {
                  transform: `translateX(${underline?.x ?? 0}px) scaleX(${underline?.w ?? 1})`,
                  '--u-inv': 1 / (underline?.w || 1),
                } as CSSProperties
              }
            />
          </ul>

          {/* 右：外链与开关（桌面）。
              gap-3 → gap-2；THEME / MOTION 收进 SET 抽屉；LANG 前缀只在 2xl 出现。
              这样最窄的桌面档（xl，可用 1184px）实测占用约 1000px，不再溢出。 */}
          <div className="ml-auto hidden shrink-0 items-center gap-2 xl:flex">
            {nav.githubStars && githubLink?.url ? (
              <MonoTag label={githubLink.label} value={nav.githubStars} />
            ) : null}
            {discordLink?.url ? (
              <MonoTag
                label={discordLink.label}
                href={discordLink.url}
                external
                aria-label={discordLink.label}
              />
            ) : null}
            <LocaleSwitch className="[&>span:first-child]:hidden 2xl:[&>span:first-child]:inline" />
            <UtilityMenu />
            {githubLink?.url ? (
              <Button href={githubLink.url} external variant="secondary" size="sm">
                {t(nav.ctaLabel)}
              </Button>
            ) : null}
          </div>

          {/* 右：抽屉开关（移动端） */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="nav-drawer"
            aria-label={nav.brand.name}
            className="text-text-1 hover:text-carbide ml-auto flex size-11 items-center justify-center font-mono text-lg leading-none transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)] active:translate-y-px xl:hidden"
          >
            <span aria-hidden="true">{MENU_GLYPH.open}</span>
          </button>
        </nav>

        {/* 编译进度发丝线：全文档滚动进度，只写 transform */}
        <span
          ref={progressRef}
          aria-hidden="true"
          className={cn(
            'bg-crimson pointer-events-none absolute inset-x-0 bottom-[-1px] block h-px origin-left',
            'transition-opacity duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
            solid ? 'opacity-100' : 'opacity-0',
          )}
          style={{ transform: 'scaleX(0)' }}
        />
      </header>

      {/* 移动端全屏抽屉：从右推入 320ms */}
      <div
        id="nav-drawer"
        aria-hidden={!open}
        inert={!open}
        className={cn(
          'bg-bg-0 fixed inset-0 z-[60] flex h-dvh w-full flex-col xl:hidden',
          'transition-transform duration-[var(--dur-mid)] ease-[var(--ease-out-quart)]',
          open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
        )}
      >
        <div className="border-line flex h-14 shrink-0 items-center gap-3 border-b px-5">
          <span className="text-text-0 font-mono text-eyebrow tracking-[0.16em] uppercase">
            {nav.brand.wordmark}
          </span>
          <span className="text-text-2 font-mono text-eyebrow tracking-[0.16em]">
            {nav.brand.version}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label={MENU_GLYPH.close}
            className="text-text-1 hover:text-carbide ml-auto flex size-11 items-center justify-center font-mono text-xl leading-none"
          >
            <span aria-hidden="true">{MENU_GLYPH.close}</span>
          </button>
        </div>

        <ul className="flex flex-col overflow-y-auto px-5 py-4">
          {nav.items.map((item, i) => (
            <li key={item.id} className="border-line border-b last:border-b-0">
              <a
                href={item.href}
                onClick={(e) => onAnchor(e, item.href)}
                aria-current={active === item.id ? 'true' : undefined}
                className={cn(
                  'flex min-h-14 items-center gap-3 font-mono text-eyebrow tracking-[0.16em] whitespace-nowrap uppercase',
                  'active:translate-y-px',
                  active === item.id ? 'text-text-0' : 'text-text-1',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'text-[length:var(--text-micro)] tabular-nums',
                    active === item.id ? 'text-crimson' : 'text-muted',
                  )}
                >
                  {pad(i + 1, 2)}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'inline-block h-px w-6 shrink-0',
                    active === item.id ? 'bg-crimson' : 'bg-line-strong',
                  )}
                />
                {t(item.label)}
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-col gap-4 px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-wrap items-center gap-4">
            <LocaleSwitch />
            <ThemeToggle />
            <MotionToggle />
            {discordLink?.url ? (
              <MonoTag
                label={discordLink.label}
                href={discordLink.url}
                external
                aria-label={discordLink.label}
              />
            ) : null}
          </div>
          {githubLink?.url ? (
            <Button href={githubLink.url} external variant="secondary" size="md" fullWidth>
              {t(nav.ctaLabel)}
            </Button>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default Nav
