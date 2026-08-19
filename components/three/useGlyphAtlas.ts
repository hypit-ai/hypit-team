'use client'

/**
 * 字形图集 + 词边界表（蓝图 §5.5）。
 *
 * - glyph atlas：full 档 4096×512 / lite 档 2048×256，OffscreenCanvas 用等宽字把
 *   **真实 SVML 源码**画成纹理，shader 取 `.r` 通道。视觉主体是文本本身，不是抽象几何（§9.3）。
 *   分辨率是可读性的下限：原先 2048×256 分 10 行 → 每行只有 25px 高、字号 17px，
 *   投到屏幕上必糊。现在 full 档每行 64px、字号 ~42px，并开 mipmap + 各向异性过滤，
 *   斜着看也不会糊成一团。
 * - 词边界表：256×1 DataTexture，`R = 词起点(0..1)`、`G = 词长(0..1)`、`B = 重编译标记`。
 *   逐纹素存「覆盖该位置的那个词」，shader 直接按 uv.x 采样即可画锚点。
 *
 * 生成放在 `requestIdleCallback` 里，绝不阻塞首屏；卸载时 dispose。
 * 文案由调用方从 `lib/data/*` 传入，本文件不含任何硬编码内容。
 */

import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'

/** full 档图集尺寸（必须是 2 的幂：WebGL1 下 RepeatWrapping + mipmap 的硬要求）。 */
export const ATLAS_WIDTH = 4096
export const ATLAS_HEIGHT = 512
/** lite 档图集尺寸——显存预算减到 1/4。 */
export const ATLAS_WIDTH_LITE = 2048
export const ATLAS_HEIGHT_LITE = 256
export const WORD_TABLE_SIZE = 256
/** 行数。行越少 → 每行像素越高 → 字越清楚。8 行配 512 高 = 每行 64px。 */
const ATLAS_ROWS = 8

export interface GlyphAtlasOptions {
  /** 要画进图集的源码行。空数组 → shader 走程序化字符网格兜底。 */
  lines?: readonly string[]
  /** 被标记为「已重编译」的词下标（S6 用）。 */
  dirtyWordIndices?: readonly number[]
  /** 关掉生成（例如 lite 档想省内存时）。 */
  enabled?: boolean
  /** 图集分辨率档位。lite 用一半边长。 */
  resolution?: 'full' | 'lite'
  /** 上传到 GPU 的各向异性上限（由 renderer.capabilities 决定，调用方传入）。 */
  anisotropy?: number
}

export interface GlyphAtlasResult {
  glyph: THREE.Texture | null
  words: THREE.DataTexture | null
  ready: boolean
}

interface WordSlot {
  start: number
  length: number
}

function readMonoFont(): string {
  if (typeof window === 'undefined') return 'ui-monospace, monospace'
  const v = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()
  return v.length > 0 ? v : 'ui-monospace, monospace'
}

function idle(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const w = window as Window & {
    requestIdleCallback?: (cb: IdleRequestCallback, o?: IdleRequestOptions) => number
    cancelIdleCallback?: (h: number) => void
  }
  if (w.requestIdleCallback) {
    const h = w.requestIdleCallback(() => cb(), { timeout: 1200 })
    return () => w.cancelIdleCallback?.(h)
  }
  const t = window.setTimeout(cb, 240)
  return () => window.clearTimeout(t)
}

function makeCanvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas | null {
  if (typeof window === 'undefined') return null
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h)
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/** 把源码行画成图集。返回 null 表示当前环境不支持。 */
function drawAtlas(
  lines: readonly string[],
  width: number,
  height: number,
  anisotropy: number,
): THREE.Texture | null {
  const canvas = makeCanvas(width, height)
  if (!canvas) return null
  const ctx = canvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null
  if (!ctx) return null

  const rowH = height / ATLAS_ROWS
  // 背景必须是**不透明黑**、字是白：shader 取 .r 当字形覆盖率。
  // 不能用透明背景——canvas 上传时是非预乘的，抗锯齿边缘会是「r=1 + 低 alpha」，
  // .r 读出来全是 1，笔画边缘直接糊成实心块。黑底白字才让 .r ≡ 覆盖率，
  // mipmap 的平均也才有意义。
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.font = `500 ${Math.round(rowH * 0.62)}px ${readMonoFont()}`

  const margin = Math.round(rowH * 0.25)
  for (let r = 0; r < ATLAS_ROWS; r++) {
    const text = lines[r % lines.length] ?? ''
    if (!text) continue
    // 每行轻微横向错位，避免图集在 ribbon 上重复时出现明显接缝
    const offset = ((r * 37) % 13) * (rowH * 0.22)
    ctx.fillText(text, margin + offset, rowH * (r + 0.5))
  }

  const texture = new THREE.CanvasTexture(canvas as HTMLCanvasElement)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  // mipmap + 各向异性：编译带是斜着投影的，没有这两样字一定糊。
  // 前提是 fragment shader 里**不能**再对 uv 做 fract()——那会让偏导在接缝处
  // 爆表、直接选到最低一级 mip，反而更糊（已在 ribbon.frag 里去掉）。
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = Math.max(1, anisotropy)
  texture.needsUpdate = true
  return texture
}

/** 按字符数把源码切成词槽，均匀铺满 0..1。 */
function layoutWords(lines: readonly string[]): WordSlot[] {
  const source = lines[0] ?? ''
  const raw = source.split(/(\s+)/).filter((s) => s.trim().length > 0)
  const tokens = raw.length > 0 ? raw : Array.from({ length: 18 }, () => 'token')
  const total = tokens.reduce((n, t) => n + t.length + 1, 0)
  const slots: WordSlot[] = []
  let cursor = 0
  for (const t of tokens) {
    const len = t.length / total
    slots.push({ start: cursor, length: len })
    cursor += (t.length + 1) / total
  }
  return slots
}

function buildWordTable(
  slots: WordSlot[],
  dirtyWordIndices: readonly number[],
): THREE.DataTexture {
  const data = new Uint8Array(WORD_TABLE_SIZE * 4)
  const dirty = new Set(dirtyWordIndices)
  for (let i = 0; i < WORD_TABLE_SIZE; i++) {
    const x = (i + 0.5) / WORD_TABLE_SIZE
    let hit = -1
    for (let s = 0; s < slots.length; s++) {
      const slot = slots[s]
      if (x >= slot.start && x <= slot.start + slot.length) {
        hit = s
        break
      }
    }
    const o = i * 4
    if (hit < 0) {
      data[o] = 0
      data[o + 1] = 0
      data[o + 2] = 0
      data[o + 3] = 255
      continue
    }
    const slot = slots[hit]
    data[o] = Math.round(Math.min(1, slot.start) * 255)
    data[o + 1] = Math.round(Math.min(1, slot.length) * 255)
    data[o + 2] = dirty.has(hit) ? 255 : 0
    data[o + 3] = 255
  }
  const tex = new THREE.DataTexture(data, WORD_TABLE_SIZE, 1, THREE.RGBAFormat)
  tex.minFilter = THREE.NearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.generateMipmaps = false
  tex.needsUpdate = true
  return tex
}

export function useGlyphAtlas({
  lines = [],
  dirtyWordIndices = [],
  enabled = true,
  resolution = 'full',
  anisotropy = 8,
}: GlyphAtlasOptions = {}): GlyphAtlasResult {
  const [result, setResult] = useState<GlyphAtlasResult>({
    glyph: null,
    words: null,
    ready: false,
  })
  // lines 是外部传进来的数组，用内容签名做依赖，避免每次渲染重建纹理
  // 分隔符必须写成转义 '\u0000' 而不是直接写一个裸 NUL 字节：
  // 裸 NUL 会让 grep / ripgrep 把整个文件当成二进制而整体跳过，
  // 全仓排查（禁用色值 / 硬编码文案）会悄悄漏掉这个文件。
  const signature = useMemo(
    () => `${lines.join('\u0000')}::${dirtyWordIndices.join(',')}`,
    [lines, dirtyWordIndices],
  )

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return
    let disposed = false
    let created: GlyphAtlasResult | null = null

    const cancel = idle(() => {
      if (disposed) return
      const build = () => {
        if (disposed) return
        const slots = layoutWords(lines)
        const words = buildWordTable(slots, dirtyWordIndices)
        const width = resolution === 'lite' ? ATLAS_WIDTH_LITE : ATLAS_WIDTH
        const height = resolution === 'lite' ? ATLAS_HEIGHT_LITE : ATLAS_HEIGHT
        const glyph =
          lines.length > 0 ? drawAtlas(lines, width, height, anisotropy) : null
        created = { glyph, words, ready: true }
        setResult(created)
      }
      // 中文/等宽 webfont 未就绪时先等一等，避免画出 fallback 字形
      if (!document.fonts || document.fonts.status === 'loaded') build()
      else document.fonts.ready.then(build).catch(build)
    })

    return () => {
      disposed = true
      cancel()
      created?.glyph?.dispose()
      created?.words?.dispose()
    }
    // lines / dirtyWordIndices 走 signature 内容签名（数组引用每帧都变）；
    // resolution 与 anisotropy 必须显式列出——tier 会在 fps 采样后由 full 降到
    // lite，漏掉它图集就永远停在 4096×512，降档等于没降。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, enabled, resolution, anisotropy])

  return result
}
