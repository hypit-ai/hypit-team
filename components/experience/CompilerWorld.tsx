'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useTier } from '@/components/three/useTier'
import { readWorldState } from '@/lib/experience/worldState'
import { HeroAtmosphere } from './HeroAtmosphere'

const FRAME_COUNT_FULL = 54
const FRAME_COUNT_LITE = 30
const POINT_COUNT_FULL = 360
const POINT_COUNT_LITE = 160
const TUNNEL_COUNT_FULL = 208
const TUNNEL_COUNT_LITE = 104
const TUNNEL_ACCENT_FULL = 44
const TUNNEL_ACCENT_LITE = 22

function hash(value: number): number {
  return Math.abs(Math.sin(value * 127.1) * 43758.5453) % 1
}

function rangeProgress(value: number, start: number, end: number): number {
  return THREE.MathUtils.smoothstep(value, start, end)
}

function cssColor(token: string): string {
  const root = document.querySelector<HTMLElement>('.ex-root')
  return root ? getComputedStyle(root).getPropertyValue(token).trim() : ''
}

function useMaterialTokens(
  paper: React.RefObject<THREE.Material | null>,
  crimson: React.RefObject<THREE.Material | null>,
  muted?: React.RefObject<THREE.Material | null>,
) {
  useEffect(() => {
    const paperColor = cssColor('--ex-paper')
    const crimsonColor = cssColor('--ex-crimson-hot')
    const mutedColor = cssColor('--ex-muted')

    if (paper.current && 'color' in paper.current && paperColor) {
      ;(paper.current as THREE.MeshStandardMaterial).color.set(paperColor)
    }
    if (crimson.current && 'color' in crimson.current && crimsonColor) {
      ;(crimson.current as THREE.MeshStandardMaterial).color.set(crimsonColor)
    }
    if (muted?.current && 'color' in muted.current && mutedColor) {
      ;(muted.current as THREE.PointsMaterial).color.set(mutedColor)
    }
  }, [crimson, muted, paper])
}

function CameraRig() {
  const reduced = useReducedMotion()

  useFrame((state, delta) => {
    if (reduced) return
    const world = readWorldState()
    const camera = state.camera
    camera.position.x = THREE.MathUtils.damp(camera.position.x, world.pointerX * 0.24, 4, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, world.pointerY * 0.16, 4, delta)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, 7.2 - world.compile * 1.35, 3, delta)
    camera.lookAt(0, 0, 0)
  })

  return null
}

function FrameHelix({ lite }: { lite: boolean }) {
  const frameRef = useRef<THREE.InstancedMesh>(null)
  const paperMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const crimsonMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const group = useRef<THREE.Group>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = lite ? FRAME_COUNT_LITE : FRAME_COUNT_FULL

  useMaterialTokens(paperMaterial, crimsonMaterial)

  useFrame((state, delta) => {
    const world = readWorldState()
    const progress = world.compile
    const frames = frameRef.current
    if (!frames || !group.current) return

    const tunnel = rangeProgress(progress, 0.28, 0.42)
    const afterHero = rangeProgress(world.page, 0.055, 0.09)
    if (paperMaterial.current) paperMaterial.current.opacity = 0.82 * (1 - tunnel) * afterHero
    if (crimsonMaterial.current) {
      crimsonMaterial.current.opacity = (1 - tunnel) * afterHero
      crimsonMaterial.current.transparent = true
    }

    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      world.page * 1.8 + world.pointerX * 0.08,
      3.5,
      delta,
    )
    group.current.rotation.z = THREE.MathUtils.damp(
      group.current.rotation.z,
      -0.22 + progress * 0.5,
      3.5,
      delta,
    )

    for (let index = 0; index < count; index += 1) {
      const unit = index / Math.max(1, count - 1)
      const phase = unit * Math.PI * (4.5 + progress * 2.5) + state.clock.elapsedTime * 0.08
      const radius = THREE.MathUtils.lerp(2.35, 1.05, progress)
      const depth = (unit - 0.5) * THREE.MathUtils.lerp(8.5, 12, progress)
      dummy.position.set(
        Math.cos(phase) * radius,
        Math.sin(phase) * radius * 0.56,
        depth,
      )
      dummy.rotation.set(Math.sin(phase) * 0.1, phase + Math.PI / 2, phase + progress * 0.8)
      const pulse = 0.86 + Math.sin(phase * 2 + progress * 8) * 0.12
      dummy.scale.set(pulse, pulse, THREE.MathUtils.lerp(0.75, 1.35, progress))
      dummy.updateMatrix()
      frames.setMatrixAt(index, dummy.matrix)
    }
    frames.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={group}>
      <instancedMesh ref={frameRef} args={[undefined, undefined, count]}>
        <boxGeometry args={[0.62, 0.36, 0.035]} />
        <meshStandardMaterial
          ref={paperMaterial}
          roughness={0.38}
          metalness={0.5}
          transparent
          opacity={0.82}
          depthWrite={false}
        />
      </instancedMesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.22, 0.022, 8, 160]} />
        <meshStandardMaterial
          ref={crimsonMaterial}
          transparent
          depthWrite={false}
          roughness={0.25}
          metalness={0.8}
          emissiveIntensity={0.9}
        />
      </mesh>
    </group>
  )
}

function NarrativeCore() {
  const group = useRef<THREE.Group>(null)
  const paperMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const crimsonMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-2.7, -0.2, 1.2),
          new THREE.Vector3(-1.4, 1.2, 0.2),
          new THREE.Vector3(0, -0.7, -0.5),
          new THREE.Vector3(1.5, 0.9, -1.1),
          new THREE.Vector3(2.8, 0.1, -2),
        ],
        false,
        'catmullrom',
        0.42,
      ),
    [],
  )

  useMaterialTokens(paperMaterial, crimsonMaterial)

  useFrame((state, delta) => {
    const world = readWorldState()
    if (!group.current) return
    const tunnel = rangeProgress(world.compile, 0.28, 0.42)
    const afterHero = rangeProgress(world.page, 0.055, 0.09)
    if (paperMaterial.current) paperMaterial.current.opacity = 0.34 * (1 - tunnel) * afterHero
    if (crimsonMaterial.current) crimsonMaterial.current.opacity = (1 - tunnel) * afterHero
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      0.25 + world.compile * 0.8 + world.pointerY * 0.08,
      3,
      delta,
    )
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      -0.22 + world.page * 1.25,
      3,
      delta,
    )
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.08
    const scale = THREE.MathUtils.lerp(0.86, 1.12, Math.sin(world.page * Math.PI) ** 2)
    group.current.scale.setScalar(scale)
  })

  return (
    <group ref={group}>
      <mesh>
        <tubeGeometry args={[curve, 160, 0.11, 10, false]} />
        <meshStandardMaterial
          ref={crimsonMaterial}
          transparent
          depthWrite={false}
          roughness={0.2}
          metalness={0.82}
          emissiveIntensity={0.72}
        />
      </mesh>
      <mesh rotation={[0.5, 0.2, 0]}>
        <icosahedronGeometry args={[0.74, 2]} />
        <meshStandardMaterial
          ref={paperMaterial}
          wireframe
          transparent
          depthWrite={false}
          opacity={0.34}
          roughness={0.5}
        />
      </mesh>
    </group>
  )
}

function SignalField({ lite }: { lite: boolean }) {
  const pointsRef = useRef<THREE.Points>(null)
  const paperMaterial = useRef<THREE.PointsMaterial>(null)
  const crimsonMaterial = useRef<THREE.PointsMaterial>(null)
  const count = lite ? POINT_COUNT_LITE : POINT_COUNT_FULL
  const geometry = useMemo(() => {
    const values = new Float32Array(count * 3)
    for (let index = 0; index < count; index += 1) {
      const unit = index / count
      const band = (index % 9) / 9
      const angle = unit * Math.PI * 18 + band * 0.8
      const radius = 2.8 + band * 5.8
      values[index * 3] = Math.cos(angle) * radius
      values[index * 3 + 1] = Math.sin(angle * 0.72) * radius * 0.55
      values[index * 3 + 2] = (unit - 0.5) * 18
    }
    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.BufferAttribute(values, 3))
    return result
  }, [count])

  useMaterialTokens(paperMaterial, crimsonMaterial, paperMaterial)

  useFrame((_, delta) => {
    const world = readWorldState()
    if (!pointsRef.current) return
    if (paperMaterial.current) {
      paperMaterial.current.opacity = 0.38
        * (1 - rangeProgress(world.compile, 0.28, 0.42))
        * rangeProgress(world.page, 0.045, 0.085)
    }
    pointsRef.current.rotation.z += delta * (0.012 + world.compile * 0.035)
    pointsRef.current.rotation.y = THREE.MathUtils.damp(
      pointsRef.current.rotation.y,
      world.page * -0.85,
      2.5,
      delta,
    )
  })

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={paperMaterial}
        size={lite ? 0.028 : 0.022}
        transparent
        opacity={0.38}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function GatewayRibbon() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const geometry = useMemo(() => {
    const segments = 96
    const positions = new Float32Array((segments + 1) * 2 * 3)
    const indices: number[] = []

    for (let index = 0; index <= segments; index += 1) {
      const unit = index / segments
      const angle = unit * Math.PI * 4.7 - 0.7
      const radius = THREE.MathUtils.lerp(6.8, 0.42, unit)
      const center = new THREE.Vector3(
        Math.cos(angle) * radius - 0.25,
        Math.sin(angle) * radius * 0.56 + 0.15,
        THREE.MathUtils.lerp(-6.5, 1.5, unit),
      )
      const nextAngle = angle + 0.01
      const nextRadius = THREE.MathUtils.lerp(6.8, 0.42, Math.min(1, unit + 0.01))
      const tangent = new THREE.Vector2(
        Math.cos(nextAngle) * nextRadius - Math.cos(angle) * radius,
        (Math.sin(nextAngle) * nextRadius - Math.sin(angle) * radius) * 0.56,
      ).normalize()
      const normal = new THREE.Vector2(-tangent.y, tangent.x)
      const width = THREE.MathUtils.lerp(0.78, 0.18, unit)

      for (let side = 0; side < 2; side += 1) {
        const sign = side === 0 ? -1 : 1
        const offset = (index * 2 + side) * 3
        positions[offset] = center.x + normal.x * width * sign
        positions[offset + 1] = center.y + normal.y * width * sign
        positions[offset + 2] = center.z
      }
      if (index < segments) {
        const offset = index * 2
        indices.push(offset, offset + 1, offset + 2, offset + 1, offset + 3, offset + 2)
      }
    }

    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    result.setIndex(indices)
    result.computeVertexNormals()
    return result
  }, [])

  useEffect(() => {
    const color = cssColor('--ex-crimson-hot')
    if (materialRef.current && color) materialRef.current.color.set(color)
    return () => geometry.dispose()
  }, [geometry])

  useFrame((state, delta) => {
    const world = readWorldState()
    if (!meshRef.current || !materialRef.current) return
    const enter = rangeProgress(world.compile, 0.28, 0.38)
    const leave = 1 - rangeProgress(world.compile, 0.45, 0.57)
    const visibility = enter * leave
    materialRef.current.opacity = visibility * 0.92
    meshRef.current.visible = visibility > 0.002
    meshRef.current.rotation.z = THREE.MathUtils.damp(
      meshRef.current.rotation.z,
      -0.14 + world.pointerX * 0.1,
      4,
      delta,
    )
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.32) * 0.045
    const scale = 0.92 + enter * 0.16
    meshRef.current.scale.setScalar(scale)
  })

  return (
    <mesh ref={meshRef} geometry={geometry} renderOrder={2}>
      <meshBasicMaterial
        ref={materialRef}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

function makeLogoPlate(width: number, height: number, slant: number, depth: number) {
  const geometry = new THREE.BoxGeometry(width, height, depth, 2, 2, 1)
  const shear = new THREE.Matrix4().set(
    1, slant / height, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  )
  geometry.applyMatrix4(shear)
  geometry.computeVertexNormals()
  return geometry
}

function HeroLightRig() {
  const keyLight = useRef<THREE.PointLight>(null)
  const rimLight = useRef<THREE.PointLight>(null)

  useEffect(() => {
    const paper = cssColor('--ex-paper')
    const crimson = cssColor('--ex-crimson-hot')
    if (keyLight.current && paper) keyLight.current.color.set(paper)
    if (rimLight.current && crimson) rimLight.current.color.set(crimson)
  }, [])

  useFrame((_, delta) => {
    const world = readWorldState()
    const presence = 1 - rangeProgress(world.hero, 0.58, 0.96)
    const key = keyLight.current
    const rim = rimLight.current
    if (!key || !rim) return

    key.position.x = THREE.MathUtils.damp(key.position.x, world.pointerX * 7.2, 7, delta)
    key.position.y = THREE.MathUtils.damp(key.position.y, 1 + world.pointerY * 4.4, 7, delta)
    key.position.z = THREE.MathUtils.damp(key.position.z, 4.8 + world.pointerEnergy * 0.9, 6, delta)
    key.intensity = presence * (9.5 + world.pointerEnergy * 6.5)

    rim.position.x = THREE.MathUtils.damp(rim.position.x, -2.8 - world.pointerX * 2.2, 5, delta)
    rim.position.y = THREE.MathUtils.damp(rim.position.y, -1.8 - world.pointerY * 1.6, 5, delta)
    rim.intensity = presence * (6.5 + world.pointerEnergy * 4.5)
  })

  return (
    <>
      <pointLight ref={keyLight} position={[1.2, 1.4, 4.8]} distance={13} decay={1.6} />
      <pointLight ref={rimLight} position={[-2.8, -1.8, 2.4]} distance={10} decay={1.8} />
    </>
  )
}

function HeroSignalRings({ lite }: { lite: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const ringRefs = useRef<Array<THREE.Mesh | null>>([])
  const materialRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([])
  const viewport = useThree((state) => state.viewport)
  const rings = useMemo(
    () => [
      { radius: 1.38, tube: 0.014, arc: 1.2 },
      { radius: 1.94, tube: 0.01, arc: 1.48 },
      { radius: 2.55, tube: 0.008, arc: 1.72 },
      { radius: 3.18, tube: 0.006, arc: 1.24 },
    ],
    [],
  )

  useEffect(() => {
    const paper = cssColor('--ex-paper-soft')
    const crimson = cssColor('--ex-crimson-hot')
    materialRefs.current.forEach((material, index) => {
      if (!material) return
      const color = index === 0 || index === 3 ? crimson : paper
      if (color) material.color.set(color)
    })
  }, [rings])

  useFrame((state, delta) => {
    const world = readWorldState()
    const group = groupRef.current
    if (!group) return
    const entrance = THREE.MathUtils.smoothstep(state.clock.elapsedTime, 0.06, 1.08)
    const heroExit = rangeProgress(world.hero, 0.5, 0.92)
    const pageExit = rangeProgress(world.page, 0.045, 0.075)
    const exit = 1 - (1 - heroExit) * (1 - pageExit)
    const mobileScale = Math.min(1, viewport.width / 5.7)
    const opacity = entrance * (1 - exit)

    group.visible = opacity > 0.002
    group.scale.setScalar(mobileScale * (0.88 + entrance * 0.12 + world.pointerEnergy * 0.025))
    group.position.x = THREE.MathUtils.damp(group.position.x, -world.pointerX * 0.44, 4.2, delta)
    group.position.y = THREE.MathUtils.damp(
      group.position.y,
      -world.pointerY * 0.28 + world.hero * 1.05,
      4.2,
      delta,
    )
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, 0.82 + world.pointerY * 0.08, 4, delta)
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, world.pointerX * -0.1, 4, delta)

    ringRefs.current.forEach((ring, index) => {
      if (!ring) return
      const direction = index % 2 === 0 ? 1 : -1
      ring.rotation.z += delta * direction * (0.055 + index * 0.016 + world.pointerEnergy * 0.08)
      const material = materialRefs.current[index]
      if (material) {
        material.opacity = opacity * (0.11 + index * 0.018 + world.pointerEnergy * 0.08)
      }
    })
  })

  return (
    <group ref={groupRef} position={[0, 0, -0.48]}>
      {rings.slice(0, lite ? 3 : rings.length).map((ring, index) => (
        <mesh
          key={ring.radius}
          ref={(mesh) => { ringRefs.current[index] = mesh }}
          rotation={[0, 0, index * 1.37 - 0.7]}
        >
          <torusGeometry args={[ring.radius, ring.tube, 5, 128, Math.PI * ring.arc]} />
          <meshBasicMaterial
            ref={(material) => { materialRefs.current[index] = material }}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function BrandMark({ lite }: { lite: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const haloRef = useRef<THREE.Points>(null)
  const plateMaterials = useRef<Array<THREE.MeshPhysicalMaterial | null>>([])
  const edgeMaterials = useRef<Array<THREE.LineBasicMaterial | null>>([])
  const plateGroups = useRef<Array<THREE.Group | null>>([])
  const haloMaterial = useRef<THREE.PointsMaterial>(null)
  const satelliteRefs = useRef<Array<THREE.Mesh | null>>([])
  const viewport = useThree((state) => state.viewport)
  const plates = useMemo(
    () => [
      makeLogoPlate(1.45, 0.64, 0.48, 0.34),
      makeLogoPlate(2.55, 0.64, 0.48, 0.34),
      makeLogoPlate(1.45, 0.64, 0.48, 0.34),
    ],
    [],
  )
  const platePositions = useMemo(
    () => [
      new THREE.Vector3(-0.72, 0.83, 0.1),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.72, -0.83, -0.1),
    ],
    [],
  )
  const haloGeometry = useMemo(() => {
    const count = lite ? 280 : 720
    const values = new Float32Array(count * 3)
    for (let index = 0; index < count; index += 1) {
      const angle = hash(index + 41) * Math.PI * 2
      const radius = Math.sqrt(hash(index + 191)) * 3.25
      values[index * 3] = Math.cos(angle) * radius
      values[index * 3 + 1] = Math.sin(angle) * radius
      values[index * 3 + 2] = -0.8 - hash(index + 11) * 0.6
    }
    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.BufferAttribute(values, 3))
    return result
  }, [lite])

  useEffect(() => {
    const crimson = cssColor('--ex-crimson-hot')
    const paper = cssColor('--ex-paper')
    plateMaterials.current.forEach((material) => {
      if (!material || !crimson) return
      material.color.set(crimson)
      material.emissive.set(crimson)
    })
    edgeMaterials.current.forEach((material) => {
      if (material && paper) material.color.set(paper)
    })
    if (haloMaterial.current && paper) haloMaterial.current.color.set(paper)
    satelliteRefs.current.forEach((satellite, index) => {
      if (!satellite) return
      const material = satellite.material as THREE.MeshBasicMaterial
      const color = index === 1 ? paper : crimson
      if (color) material.color.set(color)
    })
  }, [haloGeometry, plates])

  useFrame((state, delta) => {
    const group = groupRef.current
    const halo = haloRef.current
    if (!group || !halo || !haloMaterial.current) return
    const world = readWorldState()
    const entrance = THREE.MathUtils.smoothstep(state.clock.elapsedTime, 0.12, 1.15)
    const heroExit = rangeProgress(world.hero, 0.48, 1.4)
    const pageExit = rangeProgress(world.page, 0.045, 0.075)
    const exit = 1 - (1 - heroExit) * (1 - pageExit)
    const mobileScale = Math.min(1, viewport.width / 5.7)
    const baseScale = entrance * mobileScale * 1.22 * (1 - exit * 0.24)
    group.visible = exit < 0.995
    group.scale.setScalar(baseScale)
    group.position.x = THREE.MathUtils.damp(group.position.x, world.pointerX * 0.84, 4.8, delta)
    group.position.y = THREE.MathUtils.damp(
      group.position.y,
      world.pointerY * 0.52 + world.hero * 1.25,
      4.8,
      delta,
    )
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, -0.17 + world.pointerY * 0.28, 4.4, delta)
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, 0.24 + world.pointerX * 0.42 + exit * 0.5, 4.4, delta)
    group.rotation.z = THREE.MathUtils.damp(group.rotation.z, world.pointerX * -0.08, 4.4, delta)

    plateGroups.current.forEach((plate, index) => {
      if (!plate) return
      const layer = index - 1
      const origin = platePositions[index]
      plate.position.x = THREE.MathUtils.damp(
        plate.position.x,
        origin.x + world.pointerX * layer * 0.13,
        6.2,
        delta,
      )
      plate.position.y = THREE.MathUtils.damp(
        plate.position.y,
        origin.y + world.pointerY * layer * 0.09,
        6.2,
        delta,
      )
      plate.rotation.z = THREE.MathUtils.damp(
        plate.rotation.z,
        world.pointerX * layer * -0.035,
        5.8,
        delta,
      )
    })

    const opacity = entrance * (1 - exit)
    plateMaterials.current.forEach((material, index) => {
      if (!material) return
      material.opacity = opacity
      material.emissiveIntensity = 0.28 + world.pointerEnergy * 0.5 + index * 0.04
    })
    edgeMaterials.current.forEach((material, index) => {
      if (material) material.opacity = opacity * (0.32 + world.pointerEnergy * 0.22 + index * 0.035)
    })
    haloMaterial.current.opacity = opacity * (0.24 + world.pointerEnergy * 0.18)
    halo.position.x = THREE.MathUtils.damp(halo.position.x, -world.pointerX * 0.34, 4.1, delta)
    halo.position.y = THREE.MathUtils.damp(halo.position.y, -world.pointerY * 0.22, 4.1, delta)
    halo.rotation.z += delta * (0.035 + world.pointerEnergy * 0.12)
    halo.scale.setScalar(0.76 + entrance * 0.24 + world.pointerEnergy * 0.04)

    satelliteRefs.current.forEach((satellite, index) => {
      if (!satellite) return
      const phase = state.clock.elapsedTime * (0.22 + index * 0.035) + index * 2.1
      const radius = 2.25 + index * 0.28
      satellite.position.set(
        Math.cos(phase) * radius + world.pointerX * (index + 1) * 0.16,
        Math.sin(phase) * radius * 0.52 + world.pointerY * (3 - index) * 0.12,
        -0.15 + index * 0.3,
      )
      satellite.rotation.x += delta * (0.3 + index * 0.2)
      satellite.rotation.y += delta * (0.45 + index * 0.16)
      const size = (0.08 + index * 0.025) * entrance * (1 - exit)
      satellite.scale.setScalar(size)
    })
  })

  return (
    <group ref={groupRef} position={[0, 0, 0.25]}>
      <points ref={haloRef} geometry={haloGeometry}>
        <pointsMaterial
          ref={haloMaterial}
          transparent
          opacity={0}
          size={lite ? 0.035 : 0.027}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <group rotation={[0, 0, -0.05]}>
        {plates.map((geometry, index) => (
          <group
            key={index}
            ref={(group) => { plateGroups.current[index] = group }}
            position={platePositions[index]}
          >
            <mesh geometry={geometry}>
              <meshPhysicalMaterial
                ref={(material) => { plateMaterials.current[index] = material }}
                transparent
                opacity={0}
                roughness={0.18}
                metalness={0.76}
                clearcoat={1}
                clearcoatRoughness={0.11}
              />
            </mesh>
            <lineSegments renderOrder={3}>
              <edgesGeometry args={[geometry, 22]} />
              <lineBasicMaterial
                ref={(material) => { edgeMaterials.current[index] = material }}
                transparent
                opacity={0}
                depthWrite={false}
                toneMapped={false}
              />
            </lineSegments>
          </group>
        ))}
      </group>
      {[0, 1, 2].map((index) => (
        <mesh key={index} ref={(mesh) => { satelliteRefs.current[index] = mesh }}>
          {index === 1 ? <octahedronGeometry args={[1, 0]} /> : <tetrahedronGeometry args={[1, 0]} />}
          <meshBasicMaterial wireframe />
        </mesh>
      ))}
    </group>
  )
}

function TimeTunnel({ lite, accent = false }: { lite: boolean; accent?: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const groupRef = useRef<THREE.Group>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = accent
    ? (lite ? TUNNEL_ACCENT_LITE : TUNNEL_ACCENT_FULL)
    : (lite ? TUNNEL_COUNT_LITE : TUNNEL_COUNT_FULL)
  const seedOffset = accent ? 601 : 0
  const seeds = useMemo(
    () => Array.from({ length: count }, (_, index) => ({
      angle: (index / count) * Math.PI * 2 + hash(index + 3 + seedOffset) * 0.3,
      radius: 2.1 + hash(index + 11 + seedOffset) * 9.4,
      depth: hash(index + 29 + seedOffset) * 43,
      speed: 0.7 + hash(index + 47 + seedOffset) * 1.35,
      width: 0.55 + hash(index + 73 + seedOffset) * 0.95,
    })),
    [count, seedOffset],
  )

  useEffect(() => {
    const material = materialRef.current
    if (material) {
      material.color.set(cssColor(accent ? '--ex-crimson-hot' : '--ex-paper-soft'))
    }
  }, [accent, seeds])

  useFrame((state, delta) => {
    const world = readWorldState()
    const mesh = meshRef.current
    const material = materialRef.current
    const group = groupRef.current
    if (!mesh || !material || !group) return

    const pressure = rangeProgress(world.compile, 0.43, 0.62)
    const density = rangeProgress(world.compile, 0.48, 0.9)
    const velocity = THREE.MathUtils.clamp(world.scrollVelocity, 0, 1)
    const pointerBoost = THREE.MathUtils.clamp(world.pointerEnergy, 0, 1)
    material.opacity = pressure * (accent ? 0.82 : 0.34 + density * 0.58)
    mesh.visible = pressure > 0.002

    group.position.x = THREE.MathUtils.damp(group.position.x, world.pointerX * 1.45, 5.5, delta)
    group.position.y = THREE.MathUtils.damp(group.position.y, world.pointerY * 0.86, 5.5, delta)
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, -world.pointerX * 0.055, 5, delta)
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, world.pointerY * 0.04, 5, delta)
    group.rotation.z += delta * (0.008 + density * 0.028)

    const travel = state.clock.elapsedTime * (0.55 + pressure * 1.8 + velocity * 5.5)
      + world.compile * 112
    for (let index = 0; index < count; index += 1) {
      const seed = seeds[index]
      const depth = (seed.depth + travel * seed.speed) % 43
      const zFront = 5.15 - depth
      const near = 1 - THREE.MathUtils.clamp(depth / 43, 0, 1)
      const radius = seed.radius * (0.9 + density * 0.18)
      const x = Math.cos(seed.angle) * radius
      const y = Math.sin(seed.angle) * radius * 0.58
      const length = (0.5 + density * 4.4 + velocity * 3.2 + pointerBoost * 1.5)
        * seed.speed
        * (0.72 + near * 0.64)
      const thickness = 0.018 * seed.width * (0.72 + near * 0.9)

      dummy.position.set(x, y, zFront - length * 0.5)
      dummy.rotation.set(0, 0, seed.angle)
      dummy.scale.set(thickness, thickness, length)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          ref={materialRef}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  )
}

function CorePortal({ lite }: { lite: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const ringMaterialRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([])
  const voidMaterialRef = useRef<THREE.MeshBasicMaterial>(null)

  useEffect(() => {
    const ring = cssColor('--ex-crimson-hot')
    const voidColor = cssColor('--ex-void')
    ringMaterialRefs.current.forEach((material, index) => {
      if (!material) return
      material.color.set(index === 0 || index === 3 ? ring : cssColor('--ex-paper-soft'))
    })
    if (voidMaterialRef.current && voidColor) voidMaterialRef.current.color.set(voidColor)
  }, [])

  useFrame((state, delta) => {
    const world = readWorldState()
    const group = groupRef.current
    if (!group || !voidMaterialRef.current) return
    const portal = rangeProgress(world.compile, 0.84, 0.98)
    group.visible = portal > 0.002
    group.position.x = THREE.MathUtils.damp(group.position.x, world.pointerX * 0.62, 5, delta)
    group.position.y = THREE.MathUtils.damp(group.position.y, world.pointerY * 0.36, 5, delta)
    group.rotation.z = state.clock.elapsedTime * 0.08 + world.pointerX * 0.15
    group.scale.setScalar(lite ? 0.28 + portal * 0.16 : 0.7 + portal * 0.38)
    ringMaterialRefs.current.forEach((material, index) => {
      if (material) material.opacity = portal * (0.7 - index * 0.1)
    })
    voidMaterialRef.current.opacity = portal
  })

  return (
    <group ref={groupRef} position={[0, 0, 0.6]} renderOrder={8}>
      <mesh>
        <circleGeometry args={[0.52, 64]} />
        <meshBasicMaterial ref={voidMaterialRef} transparent opacity={0} depthTest={false} />
      </mesh>
      {[0.62, 0.74, 0.9, 1.08].map((radius, index) => (
        <mesh key={radius} rotation={[0, 0, index * 0.34]}>
          <torusGeometry args={[radius, 0.008 + index * 0.002, 6, 96, Math.PI * (1.1 + index * 0.18)]} />
          <meshBasicMaterial
            ref={(material) => { ringMaterialRefs.current[index] = material }}
            transparent
            opacity={0}
            depthTest={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function CompanyRelay({ lite }: { lite: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const fragmentRef = useRef<THREE.InstancedMesh>(null)
  const fragmentMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const ringMaterialRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([])
  const outputMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  const outputEdgeRef = useRef<THREE.LineBasicMaterial>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const outputGeometry = useMemo(() => new THREE.PlaneGeometry(1.55, 2.25), [])
  const viewport = useThree((state) => state.viewport)
  const count = lite ? 8 : 12

  useEffect(() => {
    const paper = cssColor('--ex-paper-soft')
    const crimson = cssColor('--ex-crimson-hot')
    if (fragmentMaterialRef.current && paper) fragmentMaterialRef.current.color.set(paper)
    if (outputMaterialRef.current && crimson) outputMaterialRef.current.color.set(crimson)
    if (outputEdgeRef.current && paper) outputEdgeRef.current.color.set(paper)
    ringMaterialRefs.current.forEach((material, index) => {
      if (!material) return
      const color = index === 1 ? crimson : paper
      if (color) material.color.set(color)
    })
  }, [outputGeometry])

  useFrame((_, delta) => {
    const world = readWorldState()
    const group = groupRef.current
    const fragments = fragmentRef.current
    if (!group || !fragments || !fragmentMaterialRef.current || !outputMaterialRef.current) return

    const enter = rangeProgress(world.artifact, 0.04, 0.28)
    const leave = 1 - rangeProgress(world.artifact, 0.72, 0.96)
    const presence = enter * leave
    const focus = world.artifactFocus
    group.visible = presence > 0.002
    if (!group.visible) return

    const wide = viewport.width > 6
    group.position.x = THREE.MathUtils.damp(group.position.x, wide ? 1.1 : 0, 4.2, delta)
    group.position.y = THREE.MathUtils.damp(group.position.y, wide ? -0.05 : 0.42, 4.2, delta)
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, -0.08 + world.pointerY * 0.12, 4, delta)
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, 0.2 + world.pointerX * 0.2, 4, delta)
    group.scale.setScalar((lite ? 0.72 : 0.92) * presence * (1 + focus * 0.045))

    for (let index = 0; index < count; index += 1) {
      const unit = index / count
      const travel = (unit + world.artifact * 1.45) % 1
      const gather = rangeProgress(travel, 0.28, 0.66)
      const release = rangeProgress(travel, 0.64, 0.94)
      const x = THREE.MathUtils.lerp(-3.4, 2.45, travel)
      const amplitude = (1 - gather) * 0.86 + release * 0.18
      const phase = index * 1.73 + world.artifact * Math.PI * 2
      dummy.position.set(
        x,
        Math.sin(phase) * amplitude,
        Math.cos(phase * 0.72) * amplitude * 0.55,
      )
      dummy.rotation.set(phase * 0.13, phase * 0.18, phase + gather * 1.2)
      const size = THREE.MathUtils.lerp(0.78, 0.28, gather) * (1 - release * 0.28)
      dummy.scale.set(size, size * 0.58, 0.08 + focus * 0.035)
      dummy.updateMatrix()
      fragments.setMatrixAt(index, dummy.matrix)
    }
    fragments.instanceMatrix.needsUpdate = true

    fragmentMaterialRef.current.opacity = presence * (0.3 + focus * 0.28)
    outputMaterialRef.current.opacity = presence * (0.1 + focus * 0.13)
    if (outputEdgeRef.current) outputEdgeRef.current.opacity = presence * (0.46 + focus * 0.28)
    ringMaterialRefs.current.forEach((material, index) => {
      if (material) material.opacity = presence * (0.18 + index * 0.08 + focus * 0.12)
    })
  })

  return (
    <group ref={groupRef} position={[1.1, 0, 0.1]} renderOrder={5}>
      <instancedMesh ref={fragmentRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[0.72, 0.42, 1]} />
        <meshBasicMaterial
          ref={fragmentMaterialRef}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
      {[0.74, 1.08, 1.45].map((radius, index) => (
        <mesh key={radius} rotation={[Math.PI / 2, 0, index * 0.72]}>
          <torusGeometry args={[radius, 0.012 + index * 0.004, 6, 96, Math.PI * (1.18 + index * 0.18)]} />
          <meshBasicMaterial
            ref={(material) => { ringMaterialRefs.current[index] = material }}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      <mesh geometry={outputGeometry} position={[2.55, 0, -0.15]} rotation={[0, -0.24, 0]}>
        <meshBasicMaterial
          ref={outputMaterialRef}
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
        <lineSegments position={[0, 0, 0.01]}>
          <edgesGeometry args={[outputGeometry]} />
          <lineBasicMaterial
            ref={outputEdgeRef}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </lineSegments>
      </mesh>
    </group>
  )
}

function FieldConstellation({ lite }: { lite: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const anchorRefs = useRef<Array<THREE.Mesh | null>>([])
  const anchorMaterialRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([])
  const lineMaterialRef = useRef<THREE.LineBasicMaterial>(null)
  const viewport = useThree((state) => state.viewport)
  const positions = useMemo(
    () => [
      new THREE.Vector3(-3.5, 1.65, -0.3),
      new THREE.Vector3(3.25, 0.92, -0.55),
      new THREE.Vector3(2.65, -1.55, -0.1),
      new THREE.Vector3(-3.15, -1.18, 0.15),
    ],
    [],
  )
  const lineGeometry = useMemo(() => {
    const points = [positions[0], positions[1], positions[1], positions[2], positions[2], positions[3]]
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [positions])

  useEffect(() => {
    const paper = cssColor('--ex-paper-soft')
    const crimson = cssColor('--ex-crimson-hot')
    anchorMaterialRefs.current.forEach((material, index) => {
      if (!material) return
      const color = index === 1 || index === 3 ? crimson : paper
      if (color) material.color.set(color)
    })
    if (lineMaterialRef.current && paper) lineMaterialRef.current.color.set(paper)
    return () => lineGeometry.dispose()
  }, [lineGeometry])

  useFrame((_, delta) => {
    const world = readWorldState()
    const group = groupRef.current
    if (!group) return
    const enter = rangeProgress(world.fieldNotes, 0.02, 0.18)
    const leave = 1 - rangeProgress(world.fieldNotes, 0.82, 0.98)
    const presence = enter * leave
    group.visible = presence > 0.002
    if (!group.visible) return

    const responsiveScale = Math.min(1, viewport.width / 8.5)
    group.scale.setScalar(responsiveScale * (lite ? 0.72 : 1))
    group.rotation.z = THREE.MathUtils.damp(
      group.rotation.z,
      (world.fieldNotes - 0.5) * 0.12 + world.pointerX * 0.025,
      3.4,
      delta,
    )
    group.position.y = THREE.MathUtils.damp(
      group.position.y,
      (0.5 - world.fieldNotes) * 0.34 + world.pointerY * 0.12,
      3.4,
      delta,
    )

    anchorRefs.current.forEach((anchor, index) => {
      if (!anchor) return
      const active = index === world.activeNote ? 1 : 0
      const target = positions[index]
      anchor.position.x = THREE.MathUtils.damp(anchor.position.x, target.x, 4, delta)
      anchor.position.y = THREE.MathUtils.damp(anchor.position.y, target.y + active * 0.18, 4, delta)
      anchor.position.z = target.z
      anchor.rotation.x = world.fieldNotes * (index % 2 === 0 ? 1.4 : -1.1) + active * 0.4
      anchor.rotation.y = world.fieldNotes * (index % 2 === 0 ? -1.2 : 1.5) + active * 0.3
      anchor.scale.setScalar(presence * (0.18 + index * 0.035 + active * 0.18))
      const material = anchorMaterialRefs.current[index]
      if (material) material.opacity = presence * (0.24 + active * 0.58)
    })
    if (lineMaterialRef.current) lineMaterialRef.current.opacity = presence * 0.14
  })

  return (
    <group ref={groupRef} renderOrder={1}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          ref={lineMaterialRef}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
      {positions.map((position, index) => (
        <mesh
          key={`${position.x}-${position.y}`}
          ref={(mesh) => { anchorRefs.current[index] = mesh }}
          position={position}
        >
          {index % 2 === 0
            ? <octahedronGeometry args={[1, 0]} />
            : <icosahedronGeometry args={[1, 1]} />}
          <meshBasicMaterial
            ref={(material) => { anchorMaterialRefs.current[index] = material }}
            wireframe
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function TeamOrbit() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const crimsonMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const paperMaterial = useRef<THREE.MeshStandardMaterial>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useMaterialTokens(paperMaterial, crimsonMaterial)

  useFrame((state) => {
    const world = readWorldState()
    const mesh = meshRef.current
    if (!mesh) return
    mesh.visible = world.team > 0.001
    if (!mesh.visible) return
    for (let index = 0; index < 7; index += 1) {
      const phase = (index / 7) * Math.PI * 2 + state.clock.elapsedTime * 0.05
      const spread = THREE.MathUtils.lerp(0.2, 3.15, world.team)
      dummy.position.set(
        Math.cos(phase) * spread,
        Math.sin(phase) * spread * 0.45,
        Math.sin(phase * 2) * 0.6,
      )
      const active = index === world.activeMember ? 1 : 0
      const size = THREE.MathUtils.lerp(0.08, 0.24 + active * 0.18, world.team)
      dummy.scale.setScalar(size)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 7]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        ref={crimsonMaterial}
        roughness={0.24}
        metalness={0.78}
        emissiveIntensity={0.8}
      />
    </instancedMesh>
  )
}

function WorldScene({ lite }: { lite: boolean }) {
  return (
    <>
      <HeroAtmosphere lite={lite} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 5]} intensity={2.4} />
      <HeroLightRig />
      <CameraRig />
      <HeroSignalRings lite={lite} />
      <BrandMark lite={lite} />
      <SignalField lite={lite} />
      <GatewayRibbon />
      <TimeTunnel lite={lite} />
      <TimeTunnel lite={lite} accent />
      <CorePortal lite={lite} />
      <CompanyRelay lite={lite} />
      <FieldConstellation lite={lite} />
      <FrameHelix lite={lite} />
      <NarrativeCore />
      <TeamOrbit />
    </>
  )
}

export function CompilerWorld() {
  const tier = useTier()
  const reduced = useReducedMotion()

  if (tier === 'static') {
    return <div className="ex-world-fallback" aria-hidden="true" />
  }

  return (
    <Canvas
      aria-hidden="true"
      className="ex-world__canvas"
      dpr={tier === 'lite' ? [0.7, 1] : [0.8, 1.4]}
      frameloop={reduced ? 'demand' : 'always'}
      camera={{ position: [0, 0, 7.2], fov: 42, near: 0.1, far: 40 }}
      gl={{
        alpha: true,
        antialias: tier === 'full',
        powerPreference: 'high-performance',
      }}
      performance={{ min: 0.55 }}
    >
      <WorldScene lite={tier === 'lite'} />
    </Canvas>
  )
}

export default CompilerWorld
