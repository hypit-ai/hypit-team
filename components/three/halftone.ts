'use client'

/**
 * 半调网点版的**参数与数学**——WebGL 与静态兜底（ImpressionPoster）共用同一套，
 * 保证 reduced-motion 用户看到的不是另一个设计，而是同一张版的静态帧。
 *
 * 这里的 `hash21` / `framePattern` 是 `impression.frag.glsl.ts` 里同名函数的
 * TS 镜像；改一处必须改另一处（两边都只有十来行，刻意不做抽象）。
 */

import type { Tier } from './useTier'

export interface HalftoneParams {
  /** 网点间距（CSS 逻辑像素）。 */
  dotPitch: number
  /** 网点直径系数，恒 < 1：最密处也留白。 */
  dotScale: number
  /** 相位种子。构建期常量——**不是时间**。 */
  seed: number
}

const DESKTOP_PITCH = 6
const MOBILE_PITCH = 11
const SEED = 17.42

/** 依 tier + 指针类型给出网点参数（CREATIVE §5.2 降级矩阵）。 */
export function halftoneParams(tier: Tier): HalftoneParams {
  const coarse =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(pointer: coarse)').matches ||
      (window.innerWidth || 1024) < 768)
  const contrast =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(prefers-contrast: more)').matches ?? false)

  return {
    dotPitch: coarse || tier === 'lite' ? MOBILE_PITCH : DESKTOP_PITCH,
    dotScale: contrast ? 1.05 : 0.92,
    seed: SEED,
  }
}

/** 移动端画布短边上限（逻辑像素）。超过则按比例缩小渲染分辨率。 */
export const MOBILE_MIN_SIDE_CAP = 640

export function hash21(x: number, y: number): number {
  const qx = fract(x * 123.34)
  const qy = fract(y * 456.21)
  // dot(q, q + 45.32)
  const s = qx * (qx + 45.32) + qy * (qy + 45.32)
  return fract((qx + s) * (qy + s))
}

function fract(v: number): number {
  return v - Math.floor(v)
}

function blob(px: number, py: number, cx: number, cy: number, rx: number, ry: number): number {
  const dx = (px - cx) / rx
  const dy = (py - cy) / ry
  return 1 - smoothstep(0.8, 1, dx * dx + dy * dy)
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** 画面态灰阶：人像剪影 + 帧格线 + 两侧齿孔。与 GLSL 版一一对应。 */
export function framePattern(x: number, y: number): number {
  let v = 0.08 + 0.13 * (1 - y)
  v += 0.6 * blob(x, y, 0.5, 0.585, 0.115, 0.15)
  v += 0.52 * blob(x, y, 0.5, 0.15, 0.3, 0.215)
  v += 0.78 * ((Math.abs(y - 0.955) < 0.01 ? 1 : 0) + (Math.abs(y - 0.045) < 0.01 ? 1 : 0))
  const edge = (x < 0.038 ? 1 : 0) + (x > 0.962 ? 1 : 0)
  const holes = fract(y * 14) < 0.5 ? 1 : 0
  v += 0.72 * edge * holes
  return Math.min(1, Math.max(0, v))
}
