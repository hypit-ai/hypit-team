/**
 * 动效常量（蓝图 §4 / §4.1）。
 * 与 app/globals.css @theme 里的 --dur-* / --ease-* **同源**：改这里必须同步改 CSS。
 * 纯数据模块，无副作用、无 gsap / motion 运行时依赖，服务端与客户端均可导入。
 */

/* ═══ 时长（秒，GSAP / motion 用）═════════════════════════ */
export const DUR = {
  instant: 0.08,
  fast: 0.14,
  base: 0.22,
  mid: 0.32,
  slow: 0.48,
  enter: 0.56,
  stage: 0.9,
  epic: 1.35,
} as const

export type DurKey = keyof typeof DUR

/** 时长（毫秒，setTimeout / CSS 字符串用）。 */
export const DUR_MS = {
  instant: 80,
  fast: 140,
  base: 220,
  mid: 320,
  slow: 480,
  enter: 560,
  stage: 900,
  epic: 1350,
} as const

/** 退场时长 = 进场 × 0.6（§4.1）。 */
export const EXIT_RATIO = 0.6

/** exitDur('enter') → 0.336 */
export function exitDur(key: DurKey): number {
  return Number((DUR[key] * EXIT_RATIO).toFixed(4))
}

/* ═══ 缓动 ════════════════════════════════════════════════ */

/**
 * overshoot 白名单（§4.1）——`EASE_GSAP.snapMoment` 是**唯一**允许过冲的曲线，
 * 且只允许出现在「东西真的弹出来了」的时刻：S5 Moment 竖线弹出 / S6 词替换。
 * 名字里带 `moment` 就是为了让别处的 `ease: EASE_GSAP.snapMoment` 读起来
 * 显然不对劲 —— 叫 `snap` 时它读起来像一条通用的「干脆」曲线，于是到处都在弹。
 * 其余任何「要有力度」的诉求一律用 `outExpo`。
 *
 * 过冲曲线**只在 GSAP 一侧存在**：下面的 `EASE` / `EASE_CSS` / `EASE_VAR`
 * 里没有它的孪生体，CSS 里也不再有 `--ease-snap`。白名单靠「写不出来」执行——
 * 只要 `ease-[var(--ease-snap)]` 还能解析，任何一处 hover 弹跳都读起来像合法用法。
 */

/** cubic-bezier 控制点。 */
export const EASE = {
  outQuart: [0.22, 1, 0.36, 1],
  outExpo: [0.16, 1, 0.3, 1],
  outCubic: [0.33, 1, 0.68, 1],
  inOutQuint: [0.83, 0, 0.17, 1],
  compile: [0.65, 0, 0.35, 1],
  inQuart: [0.5, 0, 0.75, 0],
} as const satisfies Record<string, readonly [number, number, number, number]>

export type EaseKey = keyof typeof EASE

/** CSS 字符串形式（inline style / Tailwind 任意值）。 */
export const EASE_CSS = {
  outQuart: 'cubic-bezier(0.22, 1, 0.36, 1)',
  outExpo: 'cubic-bezier(0.16, 1, 0.30, 1)',
  outCubic: 'cubic-bezier(0.33, 1, 0.68, 1)',
  inOutQuint: 'cubic-bezier(0.83, 0, 0.17, 1)',
  compile: 'cubic-bezier(0.65, 0, 0.35, 1)',
  inQuart: 'cubic-bezier(0.50, 0, 0.75, 0)',
  linear: 'linear',
} as const

/** CSS 变量引用形式（Tailwind: `ease-[var(--ease-out-quart)]`）。 */
export const EASE_VAR = {
  outQuart: 'var(--ease-out-quart)',
  outExpo: 'var(--ease-out-expo)',
  outCubic: 'var(--ease-out-cubic)',
  inOutQuint: 'var(--ease-in-out-quint)',
  compile: 'var(--ease-compile)',
  inQuart: 'var(--ease-in-quart)',
  linear: 'var(--ease-linear)',
} as const

/**
 * GSAP 命名缓动（免费插件范围内的最近似曲线，禁止引入 CustomEase）。
 * scrub 动画内部一律用 `EASE_GSAP.scrub`（'none'）。
 */
export const EASE_GSAP = {
  outQuart: 'power4.out',
  outExpo: 'expo.out',
  outCubic: 'power2.out',
  inOutQuint: 'power4.inOut',
  compile: 'power2.inOut',
  /** 唯一的过冲曲线。白名单见本文件上方注释；白名单外一律 `outExpo`。 */
  snapMoment: 'back.out(1.7)',
  inQuart: 'power4.in',
  linear: 'none',
  /** scrub 内部恒为 none（§4.1）。 */
  scrub: 'none',
} as const

/* ═══ stagger ═════════════════════════════════════════════ */

export const STAGGER = {
  /** 标题逐词 */
  word: 0.028,
  /** 矩阵格子 */
  cell: 0.02,
  /** 移动端卡片 */
  tight: 0.04,
  /** 表格行 */
  row: 0.045,
  /** 层堆叠 */
  layer: 0.06,
  /** 卡片组 */
  card: 0.07,
} as const

/* ═══ 位移与模糊上限（§4.1 硬约束）═══════════════════════ */

export const MOVE = {
  /** 桌面进场位移上限 28px（≤32） */
  desktop: 28,
  /** 移动端进场位移上限 20px */
  mobile: 20,
  /** 小位移（trace / 行） */
  small: 14,
} as const

/** blur 上限 8px，且同屏 ≤3 个元素同时 blur。 */
export const BLUR_MAX = 8

/* ═══ ScrollTrigger 常用默认值 ═══════════════════════════ */

export const SCRUB = {
  tight: 0.5,
  base: 0.6,
  loose: 1,
} as const

export const VIEWPORT_ONCE = { once: true, amount: 0.35 } as const

/** 距底部 15% 触发的标准 start。 */
export const TRIGGER_START = 'top 85%'
