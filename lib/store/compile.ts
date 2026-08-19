/**
 * 编译带（Ribbon）数据通道。
 *
 * 铁律（蓝图 §5.3）：**滚动 → WebGL 的数据一律直写 `u` 这个可变对象，
 * 绝不 setState**。任何 `scroll → setState → re-render` 都视为 bug。
 *
 *   // ScrollTrigger.onUpdate 里：
 *   setProgress(self.progress)
 *   // Ribbon 的 useFrame 里：
 *   const u = compileUniforms()   // 同一个对象引用，零分配
 *
 * store 里只有三个字段允许 React 订阅：`tier` / `visible` / `activeSection`，
 * 它们每分钟最多变几次，不会造成重渲染压力。
 */

import { create } from 'zustand'

/** 渲染档位。只降不升（蓝图 §5.4）。 */
export type Tier = 'full' | 'lite' | 'static'

/** 档位排序，数值越小越弱。用于「只降不升」判定。 */
export const TIER_RANK: Record<Tier, number> = { static: 0, lite: 1, full: 2 }

/**
 * 与 shader uniform 一一对应的可变状态（蓝图 §5.5）。
 * 数组字段是**固定引用**，请就地改写（`d[0] = x`），不要整体替换。
 */
export interface CompileUniformState {
  /** 主时钟 0..1。全站滚动进度的语义化推进量。 */
  progress: number
  /** 局部重编译区间 [x0, x1]，均为 0..1 的 uv.x。未启用 = [-1, -1]。 */
  dirty: [number, number]
  /** 脏区重扫年龄 0..1，1 = 已收敛。 */
  dirtyAge: number
  /** 脏区色相偏移（度，来自 recompile-demo 的 chip.hue）。 */
  dirtyHue: number
  /** 编译带半宽（世界单位）。实际取值 = min(本值, tier 上限)：full .42 / lite .30。 */
  bandWidth: number
  /** S17：ribbon 90° 扭转 0..1。 */
  twist: number
  /** S18：塌缩成一条线 0..1。 */
  collapse: number
  /** S3：DOM 对齐矩形，NDC 空间 [x0, y0, x1, y1]。未启用 = [0,0,0,0]。 */
  targetRect: [number, number, number, number]
  /** 归一化鼠标位置 -1..1，驱动 ±1.5° 倾斜。 */
  mouse: [number, number]
  /** 秒。由 Ribbon 的 useFrame 写入，其它地方只读。 */
  time: number
}

function createUniformState(): CompileUniformState {
  return {
    progress: 0,
    dirty: [-1, -1],
    dirtyAge: 0,
    dirtyHue: 0,
    bandWidth: 0.42,
    twist: 0,
    collapse: 0,
    targetRect: [0, 0, 0, 0],
    mouse: [0, 0],
    time: 0,
  }
}

interface CompileStore {
  /** 可变 uniform 载体。**永远是同一个对象引用。** */
  u: CompileUniformState
  /** 当前渲染档位。 */
  tier: Tier
  /** 是否被手动锁定（?tier= / localStorage / setTierOverride）。锁定后自动探测不再改它。 */
  tierLocked: boolean
  /** Canvas 是否应该渲染（在视口内 且 标签页可见）。 */
  visible: boolean
  /** 当前激活的 section id，供 HUD 显示 SEC/NN。 */
  activeSection: string | null
  /** 自动探测调用：只允许降档。 */
  proposeTier: (t: Tier) => void
  /** 手动覆盖：可升可降，并锁定自动探测。传 null 解锁。 */
  setTierOverride: (t: Tier | null) => void
  setVisible: (v: boolean) => void
  setActiveSection: (id: string | null) => void
  /** 路由切换 / 卸载时把 uniform 复位（就地改写，不换引用）。 */
  resetUniforms: () => void
}

export const useCompileStore = create<CompileStore>((set, get) => ({
  u: createUniformState(),
  tier: 'full',
  tierLocked: false,
  visible: true,
  activeSection: null,

  proposeTier: (t) => {
    const { tier, tierLocked } = get()
    if (tierLocked) return
    if (TIER_RANK[t] >= TIER_RANK[tier]) return // 只降不升
    set({ tier: t })
  },

  setTierOverride: (t) => {
    if (t === null) {
      set({ tierLocked: false })
      return
    }
    set({ tier: t, tierLocked: true })
  },

  setVisible: (v) => {
    if (get().visible !== v) set({ visible: v })
  },

  setActiveSection: (id) => {
    if (get().activeSection !== id) set({ activeSection: id })
  },

  resetUniforms: () => {
    const u = get().u
    Object.assign(u, createUniformState(), {
      dirty: u.dirty,
      targetRect: u.targetRect,
      mouse: u.mouse,
    })
    u.dirty[0] = -1
    u.dirty[1] = -1
    u.targetRect[0] = 0
    u.targetRect[1] = 0
    u.targetRect[2] = 0
    u.targetRect[3] = 0
    u.mouse[0] = 0
    u.mouse[1] = 0
  },
}))

/* ── 非 React 写入口（section 动效只用这些）───────────────────────── */

/** 拿到可变 uniform 对象，零订阅零重渲染。 */
export function compileUniforms(): CompileUniformState {
  return useCompileStore.getState().u
}

export function setProgress(v: number): void {
  compileUniforms().progress = v
}

/** 开启局部重编译高亮区间（uv.x 0..1）。 */
export function setDirtyRange(x0: number, x1: number): void {
  const d = compileUniforms().dirty
  d[0] = x0
  d[1] = x1
}

/** 关闭局部重编译高亮。 */
export function clearDirtyRange(): void {
  setDirtyRange(-1, -1)
  compileUniforms().dirtyAge = 0
}

export function setDirtyAge(v: number): void {
  compileUniforms().dirtyAge = v
}

export function setDirtyHue(deg: number): void {
  compileUniforms().dirtyHue = deg
}

export function setTwist(v: number): void {
  compileUniforms().twist = v
}

export function setCollapse(v: number): void {
  compileUniforms().collapse = v
}

export function setBandWidth(v: number): void {
  compileUniforms().bandWidth = v
}

/**
 * S3 用：把一个 DOM 矩形换算成 NDC 并写入 uTargetRect。
 * 传 null 关闭对齐。
 */
export function setTargetRectFromDom(el: HTMLElement | null): void {
  const r = compileUniforms().targetRect
  if (!el || typeof window === 'undefined') {
    r[0] = r[1] = r[2] = r[3] = 0
    return
  }
  const b = el.getBoundingClientRect()
  const w = window.innerWidth || 1
  const h = window.innerHeight || 1
  r[0] = (b.left / w) * 2 - 1
  r[1] = 1 - (b.bottom / h) * 2
  r[2] = (b.right / w) * 2 - 1
  r[3] = 1 - (b.top / h) * 2
}

export function setMouseNormalized(x: number, y: number): void {
  const m = compileUniforms().mouse
  m[0] = x
  m[1] = y
}
