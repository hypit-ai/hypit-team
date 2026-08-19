'use client'

/**
 * S3「翻面」的 WebGL 场景 —— 全站**唯一**一处 WebGL（CREATIVE §5.0-2）。
 *
 * 结构：1 个 mesh、1 次 draw call、0 个光源、0 个后处理、0 个 uTime。
 * `<Canvas>` 是 `position:absolute; inset:0`，只填满宿主给的那个格子，
 * 不是全屏 fixed 层——它在 DOM 上就不可能出现在别的 section。
 *
 * 工作模式 `frameloop='demand'`：没有常驻 requestAnimationFrame。
 * 只有 uProgress / 主题 / 尺寸 / 图集变化时才 `invalidate()` 请求一帧；
 * 宿主判定离开视口或标签页隐藏时切 `'never'`，连合成都不做。
 *
 * 可变 uniform 全部走 `impressionResources` 单例，不经过 React state / 依赖数组。
 */

import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import type { Tier } from './useTier'
import { dprCap } from './useTier'
import { useGlyphAtlas } from './useGlyphAtlas'
import { useInkTheme } from './useInkTheme'
import { halftoneParams, MOBILE_MIN_SIDE_CAP } from './halftone'
import { impressionGfx, impressionUniforms } from './impressionResources'
import { impressionProgress, subscribeImpressionProgress } from './impressionProgress'

/** 图集永远是 8:1（4096×512 / 2048×256），采样窗口按此比例取才不拉伸字形。 */
const ATLAS_ASPECT_INV = 1 / 8

export interface ImpressionSceneProps {
  tier: Tier
  /** 画进字形图集的真实源码行（来自 lib/data/code-samples）。 */
  sourceLines?: readonly string[]
  /** 宿主的可见性闸门：false 时 frameloop='never'。 */
  active: boolean
  className?: string
}

function ImpressionPlane({
  tier,
  sourceLines,
  active,
}: {
  tier: Tier
  sourceLines?: readonly string[]
  active: boolean
}) {
  const gl = useThree((s) => s.gl)
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const invalidate = useThree((s) => s.invalidate)
  const setDpr = useThree((s) => s.setDpr)

  const theme = useInkTheme()
  const anisotropy = gl.capabilities.getMaxAnisotropy()
  const atlas = useGlyphAtlas({
    lines: sourceLines,
    resolution: tier === 'full' ? 'full' : 'lite',
    anisotropy,
  })
  const glyph = atlas.glyph

  // 字形图集 → uniform
  useEffect(() => {
    const u = impressionUniforms()
    u.uAtlas.value = glyph
    u.uHasAtlas.value = glyph ? 1 : 0
    impressionGfx().material.needsUpdate = true
    invalidate()
  }, [glyph, invalidate])

  // 主题 → uniform（切主题同帧更新；shader 内零硬编码色）
  useEffect(() => {
    const u = impressionUniforms()
    u.uInk.value.set(theme.ink[0], theme.ink[1], theme.ink[2])
    u.uCrimson.value.set(theme.crimson[0], theme.crimson[1], theme.crimson[2])
    u.uOpacity.value = theme.opacity
    invalidate()
  }, [theme, invalidate])

  // 尺寸 / DPR / 网点参数
  useEffect(() => {
    const w = Math.max(1, width)
    const h = Math.max(1, height)
    const params = halftoneParams(tier)

    // 移动端：DPR ≤1.5（dprCap 已含），且渲染分辨率的短边 ≤640 逻辑像素
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
    let dpr = Math.min(window.devicePixelRatio || 1, dprCap(tier))
    if (coarse) dpr = Math.min(dpr, MOBILE_MIN_SIDE_CAP / Math.min(w, h))
    dpr = Math.max(0.6, dpr)
    setDpr(dpr)

    const u = impressionUniforms()
    u.uResolution.value.set(w, h)
    u.uDotPitch.value = params.dotPitch
    u.uDotScale.value = params.dotScale
    u.uSeed.value = params.seed
    // 抗锯齿半径：1.4 个设备像素，换算成「格」为单位
    u.uAA.value = 1.4 / (params.dotPitch * dpr)
    // 采样窗口按画布长宽比取，字形不拉伸
    u.uAtlasScale.value.set((w / h) * ATLAS_ASPECT_INV, 1)
    u.uAtlasOffset.value.set(0.008, 0)
    invalidate()
  }, [width, height, tier, setDpr, invalidate])

  // 进度通道 → uniform。**不进 React state**，写完请求一帧就结束。
  useEffect(() => {
    impressionUniforms().uProgress.value = impressionProgress()
    invalidate()
    return subscribeImpressionProgress((v) => {
      impressionUniforms().uProgress.value = v
      invalidate()
    })
  }, [invalidate])

  // 从 'never' 回到 'demand' 时补一帧
  useEffect(() => {
    if (active) invalidate()
  }, [active, invalidate])

  const { material, geometry } = impressionGfx()
  // dispose={null}：material / geometry 是 impressionResources 的**单例**，
  // 不归 R3F 所有。让 R3F 在卸载时把它们 dispose 掉，下一次挂载（StrictMode
  // 的双挂载、tier 切换）就会拿到已释放的 GPU 资源。
  // 释放只走 disposeImpressionGfx()。
  return (
    <mesh geometry={geometry} material={material} frustumCulled={false} dispose={null} />
  )
}

export function ImpressionScene({
  tier,
  sourceLines,
  active,
  className,
}: ImpressionSceneProps) {
  return (
    <Canvas
      className={className}
      frameloop={active ? 'demand' : 'never'}
      // 背景必须透明：纸的地方不输出任何东西
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      dpr={1}
      style={{ position: 'absolute', inset: 0 }}
      // 相机与本场景无关（顶点着色器不乘任何矩阵），给一个最省的正交相机即可
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1 }}
    >
      <ImpressionPlane tier={tier} sourceLines={sourceLines} active={active} />
    </Canvas>
  )
}

export default ImpressionScene
