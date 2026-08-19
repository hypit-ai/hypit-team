'use client'

/**
 * 把「是否还在 Hero（S1）里」换算成 ribbon 的可见度闸门。
 *
 * 背景（实测缺陷）：固定 Canvas 原先在全站 18 个 section 上持续渲染，滚到 SEC/16
 * 团队区时一条深色斜带压在成员卡片上，把成员照片糊掉一半。根因不是 z-index，
 * 而是**它压根不该出现在 Hero 以外的地方**——编译带是 S1 的主体视觉，
 * 不是全站背景。
 *
 * 规则（以 Hero 底边到视口底的距离为准）：
 *   底边还在视口底以下（含 pin 期间）→ fade = 1
 *   底边上行穿过视口下半程          → fade smoothstep 降到 0
 *   Hero 完全滚出                    → fade = 0 → CSS opacity 0 + visibility hidden
 *                                       + frameloop 'never'（停渲染省电）
 *
 * 为什么用 `getBoundingClientRect` 而不是 ScrollTrigger 的 progress：
 * Hero 桌面端 pin 了 120vh，pin 期间 ScrollTrigger 会把它设成 `position: fixed`，
 * 此时 rect 天然就是「贴在视口上不动」——正是我们要的语义，不需要再去反推
 * pinSpacing 之后的边界，也不会因为 pin 的实现细节（spacer/transform）而算错。
 *
 * 帧循环复用全站唯一的 `gsap.ticker`（Lenis → ticker → ScrollTrigger.update），
 * 不额外开 rAF；且只在滚动位置真的变化时才读一次 rect，不做无谓的布局查询。
 */

import { useEffect } from 'react'
import { gsap, registerGsap } from './gsap'
import { setRibbonFade } from '@/components/three/ribbonFade'

/**
 * 淡出行程：Hero 底边从「贴住视口底（或 Hero 自身高度，取小）」上行到该位置的
 * 45% 处时已完全消失。用 Hero 自身高度兜底，是为了让不足一屏高的 Hero
 * 在 pin 期间仍然拿到 fade = 1，而不是一上来就被打折。
 */
const FADE_END_RATIO = 0.45

export interface HeroFadeOptions {
  /** Hero 根元素的选择器。 */
  selector?: string
  /** 关掉（例如根本没挂 Canvas 时）。 */
  enabled?: boolean
  /** fade 变化时的回调——CanvasHost 用它同步 CSS opacity 与 frameloop。 */
  onChange?: (fade: number) => void
}

export function useHeroFade({
  selector = '#hero',
  enabled = true,
  onChange,
}: HeroFadeOptions = {}): void {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    registerGsap()

    const hero = document.querySelector<HTMLElement>(selector)
    // 没有 Hero 的页面（子页）不该出现编译带
    if (!hero) {
      setRibbonFade(0)
      onChange?.(0)
      return
    }

    let last = -1
    let lastScroll = Number.NaN
    let lastHeight = 0

    const emit = (fade: number) => {
      if (Math.abs(fade - last) < 0.002) return
      last = fade
      setRibbonFade(fade)
      onChange?.(fade)
    }

    const measure = () => {
      const vh = window.innerHeight || 1
      const rect = hero.getBoundingClientRect()
      const bottom = rect.bottom / vh
      const start = Math.min(1, Math.max(0.2, rect.height / vh))
      const end = start * FADE_END_RATIO
      const raw = (bottom - end) / Math.max(0.0001, start - end)
      const k = raw < 0 ? 0 : raw > 1 ? 1 : raw
      // smoothstep：线性淡出在收尾处会有肉眼可见的台阶
      emit(k * k * (3 - 2 * k))
    }

    const tick = () => {
      const y = window.scrollY
      const h = window.innerHeight
      if (y === lastScroll && h === lastHeight) return
      lastScroll = y
      lastHeight = h
      measure()
    }

    measure()
    gsap.ticker.add(tick)
    window.addEventListener('resize', measure, { passive: true })

    return () => {
      gsap.ticker.remove(tick)
      window.removeEventListener('resize', measure)
      setRibbonFade(0)
      onChange?.(0)
    }
    // onChange 由调用方用 useCallback 稳定；只在 selector/enabled 变化时重建
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector, enabled])
}

export default useHeroFade
