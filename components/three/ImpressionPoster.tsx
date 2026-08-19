'use client'

/**
 * THE IMPRESSION 的静态兜底（CREATIVE §5.2 的 `static` 档）。
 *
 * `prefers-reduced-motion` / 无 WebGL / three chunk 加载中 → **不挂 Canvas**，
 * 改用两张 2D 画好的半调版（字形态 / 画面态）做一次 `.22s` crossfade，
 * 由 IntersectionObserver 触发一次，之后彻底静止：没有 rAF、没有 WebGL 上下文。
 *
 * 两张图用的是与 shader 同一套 `halftone.ts` 数学，所以它不是「另一个设计」，
 * 而是同一张版的第一帧和最后一帧。颜色同样来自 CSS 变量，主题切换会重画。
 */

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { framePattern, halftoneParams, hash21 } from './halftone'
import { useInkTheme, type InkTheme } from './useInkTheme'

/** 静态版把网点放大一档：2D 画布画不起 6px 网点，也没必要。 */
const POSTER_PITCH_SCALE = 1.6
const GLYPH_ROWS = 8
/** 采样倍率：先画 4× 再块平均，避免直接画微缩字号糊成噪声。 */
const SUPERSAMPLE = 4

function css(rgb: readonly [number, number, number]): string {
  const to = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255)
  return `rgb(${to(rgb[0])}, ${to(rgb[1])}, ${to(rgb[2])})`
}

function monoFont(): string {
  if (typeof window === 'undefined') return 'ui-monospace, monospace'
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-mono')
    .trim()
  return v.length > 0 ? v : 'ui-monospace, monospace'
}

/** 把源码行画成「每格一个灰度」的字形场。 */
function glyphField(cols: number, rows: number, lines: readonly string[]): Float32Array {
  const field = new Float32Array(cols * rows)
  if (typeof document === 'undefined' || lines.length === 0) return field

  const tw = cols * SUPERSAMPLE
  const th = rows * SUPERSAMPLE
  const tmp = document.createElement('canvas')
  tmp.width = tw
  tmp.height = th
  const ctx = tmp.getContext('2d', { willReadFrequently: true })
  if (!ctx) return field

  const rowH = th / GLYPH_ROWS
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, tw, th)
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.font = `500 ${Math.max(4, Math.round(rowH * 0.62))}px ${monoFont()}`
  for (let r = 0; r < GLYPH_ROWS; r++) {
    const text = lines[r % lines.length] ?? ''
    if (!text) continue
    ctx.fillText(text, rowH * 0.3 + ((r * 37) % 13) * (rowH * 0.18), rowH * (r + 0.5))
  }

  const data = ctx.getImageData(0, 0, tw, th).data
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let sum = 0
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        const row = (y * SUPERSAMPLE + sy) * tw
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          sum += data[(row + x * SUPERSAMPLE + sx) * 4]
        }
      }
      field[y * cols + x] = sum / (255 * SUPERSAMPLE * SUPERSAMPLE)
    }
  }
  return field
}

function drawPoster(
  canvas: HTMLCanvasElement,
  mode: 'glyph' | 'frame',
  theme: InkTheme,
  lines: readonly string[],
): void {
  const rect = canvas.getBoundingClientRect()
  const w = Math.max(1, Math.round(rect.width))
  const h = Math.max(1, Math.round(rect.height))
  const dpr = Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const { dotPitch, dotScale, seed } = halftoneParams('static')
  const pitch = dotPitch * POSTER_PITCH_SCALE
  const cols = Math.ceil(w / pitch)
  const rows = Math.ceil(h / pitch)
  const field = mode === 'glyph' ? glyphField(cols, rows, lines) : null

  const ink = css(theme.ink)
  const crimson = css(theme.crimson)
  ctx.globalAlpha = theme.opacity

  for (let iy = 0; iy < rows; iy++) {
    for (let ix = 0; ix < cols; ix++) {
      const cx = ((ix + 0.5) * pitch) / w
      const cyTop = ((iy + 0.5) * pitch) / h
      const v =
        mode === 'glyph'
          ? (field?.[iy * cols + ix] ?? 0)
          : framePattern(cx, 1 - cyTop)
      const r = Math.sqrt(Math.min(1, Math.max(0, v))) * 0.5 * dotScale * pitch
      if (r < 0.25) continue
      ctx.fillStyle =
        hash21(ix * 1.7 + seed + 13, iy * 1.7 + seed + 13) >= 0.962 ? crimson : ink
      ctx.beginPath()
      ctx.arc((ix + 0.5) * pitch, (iy + 0.5) * pitch, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
}

export interface ImpressionPosterProps {
  /** 与 WebGL 场景同源的源码行。 */
  sourceLines?: readonly string[]
  className?: string
}

export function ImpressionPoster({ sourceLines = [], className }: ImpressionPosterProps) {
  const glyphRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<HTMLCanvasElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const [flipped, setFlipped] = useState(false)
  const theme = useInkTheme()

  // 画两张版：挂载时一次 + 主题变化 + resize（debounce 150ms）。之后完全静止。
  useEffect(() => {
    if (typeof window === 'undefined') return
    let timer = 0
    const paint = () => {
      if (glyphRef.current) drawPoster(glyphRef.current, 'glyph', theme, sourceLines)
      if (frameRef.current) drawPoster(frameRef.current, 'frame', theme, sourceLines)
    }
    paint()
    const onResize = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(paint, 150)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', onResize)
    }
  }, [theme, sourceLines])

  // 进入视口时翻一次面，只翻一次
  useEffect(() => {
    const el = hostRef.current
    if (!el || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setFlipped(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setFlipped(true)
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0', className)}
    >
      <canvas
        ref={glyphRef}
        className="absolute inset-0 h-full w-full"
        style={{ opacity: flipped ? 0 : 1, transition: 'opacity .22s linear' }}
      />
      <canvas
        ref={frameRef}
        className="absolute inset-0 h-full w-full"
        style={{ opacity: flipped ? 1 : 0, transition: 'opacity .22s linear' }}
      />
    </div>
  )
}

export default ImpressionPoster
