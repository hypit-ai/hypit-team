'use client'

/**
 * 三档降级判定（蓝图 §5.4）。**只降不升。**
 *
 *   full   DPR ≤2（桌面）/ ≤1.5（移动）· 256 段 · RT 512² · 每 4 帧一次 · 开词锚点
 *   lite   DPR ≤1.25 · 96 段  · RT 256² · 每 8 帧一次 · 关词锚点 · uBandWidth .12
 *   static 不挂 Canvas，渲染 <RibbonPoster/> + CSS 扫描线
 *
 * 判定条件：
 *   prefers-reduced-motion            → static（硬性）
 *   无 WebGL / WebGL 上下文创建失败    → static
 *   hardwareConcurrency < 4           → lite
 *   deviceMemory < 4                  → lite
 *   connection.saveData               → lite
 *   首 90 帧均值 fps < 45              → 降一档
 *
 * 手动切换（验收用，三档都要能跑）：
 *   ?tier=lite  /  localStorage['narratage:tier'] = 'static'  /  window.__setTier('full')
 */

import { useEffect } from 'react'
import { useCompileStore, type Tier } from '@/lib/store/compile'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export type { Tier }

export const TIER_STORAGE_KEY = 'narratage:tier'

/** 每档的渲染参数。Scene / Ribbon / FrameTarget 都从这里取，不各自写魔法数。 */
export interface TierProfile {
  /** devicePixelRatio 上限。移动端另有 1.5 的硬上限（见 `dprCap`）。 */
  maxDpr: number
  /** ribbon 沿长度方向的分段数。 */
  segments: number
  /** 离屏 frame RT 边长。 */
  rtSize: number
  /** RT 每 N 帧渲一次。 */
  rtInterval: number
  /** 是否渲染 InstancedMesh 词锚点。 */
  wordAnchors: boolean
  /** 编译带半宽默认值。 */
  bandWidth: number
  /** 块化收敛的 blockN 上限。 */
  maxBlockN: number
}

export const TIER_PROFILES: Record<Exclude<Tier, 'static'>, TierProfile> = {
  full: {
    // 编译带上要读出源码，DPR 是可读性的第一约束：桌面放到 2，
    // 移动端仍由 dprCap() 硬压到 1.5（发热/带宽）。
    maxDpr: 2,
    segments: 256,
    rtSize: 512,
    rtInterval: 4,
    wordAnchors: true,
    bandWidth: 0.42,
    maxBlockN: 220,
  },
  lite: {
    maxDpr: 1.25,
    segments: 96,
    rtSize: 256,
    rtInterval: 8,
    wordAnchors: false,
    bandWidth: 0.30,
    maxBlockN: 96,
  },
}

export function tierProfile(tier: Tier): TierProfile {
  return tier === 'lite' ? TIER_PROFILES.lite : TIER_PROFILES.full
}

/** 实际使用的 DPR 上限：移动端（coarse pointer）硬上限 1.5。 */
export function dprCap(tier: Tier): number {
  const base = tierProfile(tier).maxDpr
  if (typeof window === 'undefined') return base
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  return coarse ? Math.min(base, 1.5) : base
}

function isTier(v: unknown): v is Tier {
  return v === 'full' || v === 'lite' || v === 'static'
}

/** 读取手动覆盖（URL > localStorage）。SSR 返回 null。 */
export function readTierOverride(): Tier | null {
  if (typeof window === 'undefined') return null
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('tier')
    if (isTier(fromUrl)) return fromUrl
    const stored = window.localStorage.getItem(TIER_STORAGE_KEY)
    if (isTier(stored)) return stored
  } catch {
    /* 隐私模式下 localStorage 会抛错，忽略即可 */
  }
  return null
}

/** 手动设档并持久化。传 null 清除覆盖，恢复自动探测。 */
export function setTierOverride(tier: Tier | null): void {
  useCompileStore.getState().setTierOverride(tier)

  // 解锁时必须把档位交还给自动探测。store 的 proposeTier 是「只降不升」的，
  // 若只清 tierLocked、把 tier 留在 'static'，就再也升不回来了：
  // Nav 的 MOTION[OFF]→[ON] 会显示已开启，而 tier 仍是 static、WebGL 永不复活。
  if (tier === null) {
    useCompileStore.setState({ tier: 'full' })
    const reduced =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
    useCompileStore.getState().proposeTier(detectStaticTier(reduced))
  }

  if (typeof window === 'undefined') return
  try {
    if (tier) window.localStorage.setItem(TIER_STORAGE_KEY, tier)
    else window.localStorage.removeItem(TIER_STORAGE_KEY)
  } catch {
    /* noop */
  }
}

function hasWebGL(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      canvas.getContext('experimental-webgl')
    if (!gl) return false
    const lose = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context')
    lose?.loseContext()
    return true
  } catch {
    return false
  }
}

interface NavigatorCaps {
  hardwareConcurrency?: number
  deviceMemory?: number
  connection?: { saveData?: boolean }
}

/** 静态能力探测（不含 fps）。 */
export function detectStaticTier(reduced: boolean): Tier {
  if (typeof window === 'undefined') return 'full'
  if (reduced) return 'static'
  if (!hasWebGL()) return 'static'

  const nav = navigator as Navigator & NavigatorCaps
  const cores = nav.hardwareConcurrency ?? 8
  const memory = nav.deviceMemory ?? 8
  if (cores < 4 || memory < 4 || nav.connection?.saveData) return 'lite'
  return 'full'
}

const FPS_SAMPLE_FRAMES = 90
const FPS_FLOOR = 45

/** 采样首 90 帧均值 fps，低于 45 时回调（只回调一次）。 */
function sampleFps(onSlow: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  let frames = 0
  let start = 0
  let raf = 0
  let cancelled = false

  const step = (t: number) => {
    if (cancelled) return
    if (start === 0) start = t
    frames++
    if (frames >= FPS_SAMPLE_FRAMES) {
      const elapsed = (t - start) / 1000
      const fps = elapsed > 0 ? frames / elapsed : 60
      if (fps < FPS_FLOOR) onSlow()
      return
    }
    raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)

  return () => {
    cancelled = true
    cancelAnimationFrame(raf)
  }
}

/**
 * 订阅当前 tier，并在首次挂载时跑一次探测。
 * 任何组件都能调用（幂等），但通常只有 `CanvasHost` 需要。
 */
export function useTier(): Tier {
  const tier = useCompileStore((s) => s.tier)
  const reduced = useReducedMotion()

  useEffect(() => {
    const store = useCompileStore.getState()

    const override = readTierOverride()
    if (override) {
      store.setTierOverride(override)
    } else {
      store.setTierOverride(null)
      store.proposeTier(detectStaticTier(reduced))
    }

    // 调试入口：三档手动切换（验收项）。
    const w = window as Window & { __setTier?: (t: Tier | null) => void }
    w.__setTier = setTierOverride

    if (reduced || useCompileStore.getState().tier === 'static') return () => {
      delete w.__setTier
    }

    const stop = sampleFps(() => {
      const s = useCompileStore.getState()
      s.proposeTier(s.tier === 'full' ? 'lite' : 'static')
    })

    return () => {
      stop()
      delete w.__setTier
    }
  }, [reduced])

  // reduced-motion 是硬性条件，即便 store 还没更新也要立刻反映。
  return reduced ? 'static' : tier
}
