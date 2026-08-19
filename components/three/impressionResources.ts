'use client'

/**
 * THE IMPRESSION 的 GPU 资源单例（材质 / 几何 / uniform 载体）。
 *
 * 为什么放在 React 之外：uniform 是**可变对象**，滚动每帧就地改写。
 * 一旦它经由 `useMemo` / 依赖数组进入 React，就既触发 React Compiler 的
 * 不可变性约束，又诱导别人写出 `scroll → setState → re-render`。
 * 这里与 `lib/store/compile` 的做法一致：可变量一律活在 React 之外。
 *
 * 全站只有 S3 一处 WebGL，因此单例是安全的：材质与几何在整个 App 生命周期
 * 内复用，section 反复进出视口也不会重新编译 shader。
 */

import * as THREE from 'three'
import {
  createImpressionMaterial,
  createImpressionUniforms,
  type ImpressionUniforms,
} from './ImpressionMaterial'

export interface ImpressionGfx {
  uniforms: ImpressionUniforms
  material: THREE.RawShaderMaterial
  geometry: THREE.PlaneGeometry
}

let gfx: ImpressionGfx | null = null

/** 取（必要时创建）单例资源。 */
export function impressionGfx(): ImpressionGfx {
  if (!gfx) {
    const uniforms = createImpressionUniforms()
    gfx = {
      uniforms,
      material: createImpressionMaterial(uniforms),
      geometry: new THREE.PlaneGeometry(2, 2),
    }
  }
  return gfx
}

/** 可变 uniform 载体。零分配、零订阅。 */
export function impressionUniforms(): ImpressionUniforms {
  return impressionGfx().uniforms
}

/** 释放 GPU 资源。正常流程用不到（单例常驻），留给 HMR / 测试。 */
export function disposeImpressionGfx(): void {
  if (!gfx) return
  gfx.material.dispose()
  gfx.geometry.dispose()
  gfx = null
}
