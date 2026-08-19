'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { readWorldState } from '@/lib/experience/worldState'

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform vec3 uVoid;
  uniform vec3 uRaised;
  uniform vec3 uCrimson;
  uniform vec3 uWine;
  uniform vec3 uPaper;
  uniform float uTime;
  uniform float uHero;
  uniform float uEnergy;
  uniform float uLite;
  uniform float uReady;

  float hash21(vec2 value) {
    value = fract(value * vec2(123.34, 456.21));
    value += dot(value, value + 45.32);
    return fract(value.x * value.y);
  }

  float valueNoise(vec2 value) {
    vec2 cell = floor(value);
    vec2 local = fract(value);
    local = local * local * (3.0 - 2.0 * local);
    float a = hash21(cell);
    float b = hash21(cell + vec2(1.0, 0.0));
    float c = hash21(cell + vec2(0.0, 1.0));
    float d = hash21(cell + vec2(1.0, 1.0));
    return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
  }

  float fieldNoise(vec2 value) {
    float result = 0.0;
    float amplitude = 0.56;
    for (int octave = 0; octave < 3; octave++) {
      result += valueNoise(value) * amplitude;
      value = value * 2.06 + vec2(2.17, -1.63);
      amplitude *= 0.48;
    }
    return result;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = uv - 0.5;
    p.x *= aspect;

    vec2 focus = vec2(uPointer.x * aspect, uPointer.y);
    vec2 focusDelta = p - focus;
    float focusDistance = length(focusDelta);
    float lens = exp(-dot(focusDelta, focusDelta) * 3.15);
    float lensCore = exp(-dot(focusDelta, focusDelta) * 17.0);
    float heroSignal = smoothstep(0.035, 0.56, uHero);
    float heroPresence = 1.0 - smoothstep(0.66, 0.98, uHero);
    float time = uTime * 0.13;

    vec2 direction = focusDelta / max(focusDistance, 0.001);
    vec2 warped = p - direction * lens * (0.035 + uEnergy * 0.032);
    float turbulence = fieldNoise(warped * 1.72 + vec2(time * 0.28, -time * 0.21));
    float sweep = sin(
      warped.x * 3.25
      - warped.y * 2.15
      - time * 1.08
      + turbulence * 3.85
      + lens * 1.35
    );
    float crossSweep = sin(
      warped.y * 5.1
      + warped.x * 1.35
      + time * 0.72
      + turbulence * 2.55
    );
    float ribbon = 1.0 - smoothstep(0.14, 0.76, abs(sweep));
    float interference = 1.0 - smoothstep(0.18, 0.88, abs(crossSweep));
    float diagonal = smoothstep(-1.18, 0.72, warped.x - warped.y * 0.42);
    float field = ribbon * 0.72 + interference * 0.28;
    field *= diagonal * (0.38 + heroSignal * 0.3) + lens * (0.26 + uEnergy * 0.38);

    float cellSize = mix(5.0, 7.0, uLite);
    vec2 cell = fract(gl_FragCoord.xy / cellSize) - 0.5;
    float dots = 1.0 - smoothstep(0.18, 0.46, length(cell));
    float grain = hash21(floor(gl_FragCoord.xy / mix(1.0, 2.0, uLite)));
    float halftone = mix(1.0, 0.5 + dots * 0.5, 0.2 + heroSignal * 0.62);
    float vignette = 1.0 - smoothstep(0.5, 1.18, length(p));
    float glow = clamp(field * halftone * (0.66 + vignette * 0.34), 0.0, 1.0);
    float verticalGradient = smoothstep(-0.62, 0.58, p.y + turbulence * 0.16);
    float cursorRing = smoothstep(0.17, 0.2, focusDistance)
      - smoothstep(0.205, 0.245, focusDistance);

    vec3 base = mix(uVoid, uRaised, 0.26 + verticalGradient * 0.2);
    base = mix(base, uWine, 0.38 + glow * 0.24 + lens * 0.12);
    vec3 signal = mix(uCrimson, uPaper, lensCore * 0.22 + pow(glow, 3.0) * 0.12);
    vec3 color = mix(base, signal, glow * (0.42 + heroSignal * 0.12));
    color = mix(color, uPaper, cursorRing * (0.11 + uEnergy * 0.14));
    color += (grain - 0.5) * 0.018;

    float alpha = heroPresence * uReady * (0.82 + glow * 0.12);

    gl_FragColor = vec4(color, alpha);
  }
`

function readColor(token: string): string {
  const root = document.querySelector<HTMLElement>('.ex-root')
  return root ? getComputedStyle(root).getPropertyValue(token).trim() : ''
}

export function HeroAtmosphere({ lite }: { lite: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const pointer = useRef(new THREE.Vector2())
  const { gl, size } = useThree()
  const uniforms = useMemo(
    () => ({
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2() },
      uVoid: { value: new THREE.Color(0) },
      uRaised: { value: new THREE.Color(0) },
      uCrimson: { value: new THREE.Color(0) },
      uWine: { value: new THREE.Color(0) },
      uPaper: { value: new THREE.Color(0) },
      uTime: { value: 0 },
      uHero: { value: 0 },
      uEnergy: { value: 0 },
      uLite: { value: lite ? 1 : 0 },
      uReady: { value: 0 },
    }),
    [lite],
  )

  useEffect(() => {
    const material = materialRef.current
    if (!material) return
    const voidColor = readColor('--ex-void')
    const raised = readColor('--ex-void-raised')
    const crimson = readColor('--ex-crimson-hot')
    const wine = readColor('--ex-wine')
    const paper = readColor('--ex-paper-soft')
    if (voidColor) material.uniforms.uVoid.value.set(voidColor)
    if (raised) material.uniforms.uRaised.value.set(raised)
    if (crimson) material.uniforms.uCrimson.value.set(crimson)
    if (wine) material.uniforms.uWine.value.set(wine)
    if (paper) material.uniforms.uPaper.value.set(paper)
    material.uniforms.uReady.value = 1
  }, [uniforms])

  useFrame((_, delta) => {
    const material = materialRef.current
    if (!material) return
    const world = readWorldState()
    const dpr = gl.getPixelRatio()
    pointer.current.x = THREE.MathUtils.damp(pointer.current.x, world.pointerX, 5.2, delta)
    pointer.current.y = THREE.MathUtils.damp(pointer.current.y, world.pointerY, 5.2, delta)
    material.uniforms.uResolution.value.set(size.width * dpr, size.height * dpr)
    material.uniforms.uPointer.value.copy(pointer.current)
    material.uniforms.uTime.value += Math.min(delta, 0.05)
    material.uniforms.uHero.value = world.hero
    material.uniforms.uEnergy.value = THREE.MathUtils.damp(
      material.uniforms.uEnergy.value,
      world.pointerEnergy,
      6,
      delta,
    )
  })

  return (
    <mesh renderOrder={-100} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}
