'use client'

/**
 * S3「翻面」的**唯一**驱动通道（CREATIVE §5.1：整个场景没有 uTime）。
 *
 * 铁律：滚动驱动的量绝不进 React state。S3 的 ScrollTrigger.onUpdate 里直接调
 * `setImpressionProgress(self.progress)`，本模块把值推给已挂载的 WebGL 场景，
 * 场景写 uniform 并 `invalidate()` 请求**一帧**——没有常驻 rAF 循环。
 *
 * 这是给 S3 section 的公开契约，与 `lib/store/compile` 无关（旧 store 的
 * ribbon 字段保持原样不动，本模块不改它的任何签名）。
 *
 *   import { setImpressionProgress } from '@/components/three/impressionProgress'
 *   // ScrollTrigger: { scrub: .6, onUpdate: (self) => setImpressionProgress(self.progress) }
 */

type Listener = (value: number) => void

let current = 0
const listeners = new Set<Listener>()

/** 当前进度 0..1。 */
export function impressionProgress(): number {
  return current
}

/** 写进度 0..1（越界自动 clamp）。零分配，可在 onUpdate 里每帧调用。 */
export function setImpressionProgress(value: number): void {
  const v = value < 0 ? 0 : value > 1 ? 1 : value
  if (v === current) return
  current = v
  for (const fn of listeners) fn(v)
}

/** 订阅进度变化。返回退订函数。 */
export function subscribeImpressionProgress(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
