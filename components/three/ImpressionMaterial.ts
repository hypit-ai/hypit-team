'use client'

/**
 * THE IMPRESSION 的材质（CREATIVE §5.1）。
 *
 * `RawShaderMaterial` + `transparent` + `depthWrite:false` + NormalBlending。
 * 没有光照、没有贴图环境、没有后处理——这是印刷，不是照明。
 *
 * 背景永远透明：纸的地方 alpha=0（shader 直接 discard），
 * 因此它不可能在纸上留下一块灰底（三次验收失败的共同根因）。
 */

import * as THREE from 'three'
import { impressionVert } from './impression.vert.glsl'
import { impressionFrag } from './impression.frag.glsl'

export interface ImpressionUniforms {
  uProgress: { value: number }
  uDotPitch: { value: number }
  uDotScale: { value: number }
  uOpacity: { value: number }
  uSeed: { value: number }
  uHasAtlas: { value: number }
  uAA: { value: number }
  uResolution: { value: THREE.Vector2 }
  uAtlasScale: { value: THREE.Vector2 }
  uAtlasOffset: { value: THREE.Vector2 }
  uInk: { value: THREE.Vector3 }
  uCrimson: { value: THREE.Vector3 }
  uAtlas: { value: THREE.Texture | null }
}

export function createImpressionUniforms(): ImpressionUniforms {
  return {
    uProgress: { value: 0 },
    uDotPitch: { value: 6 },
    uDotScale: { value: 0.92 },
    uOpacity: { value: 0.88 },
    uSeed: { value: 17.42 },
    uHasAtlas: { value: 0 },
    uAA: { value: 0.12 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uAtlasScale: { value: new THREE.Vector2(0.2, 1) },
    uAtlasOffset: { value: new THREE.Vector2(0.01, 0) },
    uInk: { value: new THREE.Vector3(0.098, 0.094, 0.086) },
    uCrimson: { value: new THREE.Vector3(0.627, 0.07, 0.251) },
    uAtlas: { value: null },
  }
}

export function createImpressionMaterial(
  uniforms: ImpressionUniforms,
): THREE.RawShaderMaterial {
  return new THREE.RawShaderMaterial({
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    vertexShader: impressionVert,
    fragmentShader: impressionFrag,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NormalBlending,
  })
}
