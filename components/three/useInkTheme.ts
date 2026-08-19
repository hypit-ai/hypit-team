'use client'

/**
 * 从 CSS 变量读取当前主题的墨色 / 绯红 / 纸色（BRAND §1、CREATIVE §5.0-5）。
 *
 * shader 里**禁止出现任何硬编码 RGB**：uInk / uCrimson 全部由这里供给，
 * 主题切换（class / data-theme / prefers-color-scheme）时同帧更新 uniform。
 *
 * 返回的颜色是 **sRGB 0..1 三元组**，不是 THREE.Color——
 * RawShaderMaterial 不走 three 的 colorspace 注入，输出直接写进 sRGB
 * 帧缓冲，因此必须用未经线性化的原值，否则墨色会整体发灰。
 */

import { useEffect, useState } from 'react'

export interface InkTheme {
  /** 墨色（正文色）。light 深 / dark 浅。 */
  ink: [number, number, number]
  /** 品牌绯红，唯一强调色。 */
  crimson: [number, number, number]
  /** 纸色，只用于判定明暗。 */
  paper: [number, number, number]
  dark: boolean
  /**
   * 半调层整体不透明度上限（CREATIVE §5.1「三重保险」之一）。
   * light 0.88 / dark 0.72——最密处也必须留白，永不糊成灰块。
   */
  opacity: number
}

const FALLBACK: InkTheme = {
  ink: [0.098, 0.094, 0.086], // #191816
  crimson: [0.627, 0.070, 0.251], // #a01240
  paper: [0.953, 0.941, 0.910], // #f3f0e8
  dark: false,
  opacity: 0.88,
}

const LIGHT_OPACITY = 0.88
const DARK_OPACITY = 0.72

/**
 * CSS 颜色 → sRGB 0..1。支持 `#rgb` / `#rrggbb` / `rgb()` / `rgba()`。
 * 解析失败返回 null，由调用方回落到 FALLBACK。
 */
export function parseCssColor(input: string): [number, number, number] | null {
  const v = input.trim()
  if (v.length === 0) return null

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v)
  if (hex) {
    const h = hex[1]
    const full =
      h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h
    const n = parseInt(full, 16)
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
  }

  const rgb = /^rgba?\(([^)]+)\)$/i.exec(v)
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter((s) => s.length > 0)
    if (parts.length < 3) return null
    const ch = parts.slice(0, 3).map((p) =>
      p.endsWith('%') ? parseFloat(p) / 100 : parseFloat(p) / 255,
    )
    if (ch.some((c) => Number.isNaN(c))) return null
    return [ch[0], ch[1], ch[2]]
  }

  return null
}

function readVar(
  style: CSSStyleDeclaration,
  name: string,
  fallback: [number, number, number],
): [number, number, number] {
  return parseCssColor(style.getPropertyValue(name)) ?? fallback
}

function readTheme(): InkTheme {
  if (typeof window === 'undefined' || typeof document === 'undefined') return FALLBACK
  const style = getComputedStyle(document.documentElement)
  const paper = readVar(style, '--color-paper', FALLBACK.paper)
  // 粗略相对亮度，只用来判明暗
  const dark = 0.299 * paper[0] + 0.587 * paper[1] + 0.114 * paper[2] < 0.5
  return {
    ink: readVar(style, '--color-ink', FALLBACK.ink),
    crimson: readVar(style, '--color-crimson', FALLBACK.crimson),
    paper,
    dark,
    opacity: dark ? DARK_OPACITY : LIGHT_OPACITY,
  }
}

function same(a: InkTheme, b: InkTheme): boolean {
  return (
    a.dark === b.dark &&
    a.ink[0] === b.ink[0] &&
    a.ink[1] === b.ink[1] &&
    a.ink[2] === b.ink[2] &&
    a.crimson[0] === b.crimson[0] &&
    a.crimson[1] === b.crimson[1] &&
    a.crimson[2] === b.crimson[2] &&
    a.paper[0] === b.paper[0]
  )
}

/**
 * 订阅当前主题色。变化频率极低（手动切换 / 系统切换），走 React 状态无压力。
 */
export function useInkTheme(): InkTheme {
  const [theme, setTheme] = useState<InkTheme>(FALLBACK)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () =>
      setTheme((prev) => {
        const next = readTheme()
        return same(prev, next) ? prev : next
      })

    sync()

    const mo = new MutationObserver(sync)
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style'],
    })
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    mq?.addEventListener('change', sync)

    return () => {
      mo.disconnect()
      mq?.removeEventListener('change', sync)
    }
  }, [])

  return theme
}
