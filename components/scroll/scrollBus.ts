'use client'

/**
 * 滚动进度总线（CREATIVE §3 / M1）。
 *
 * 全站**唯一**的「文档级滚动量」来源。任何需要知道「现在滚到哪」的消费者
 * ——HUD、齿孔栏 SprocketRail、WebGL uniform、光标、Nav 阴影——都从这里读，
 * 而不是各自 `addEventListener('scroll')` 或各建一个 body ScrollTrigger。
 *
 * 设计约束（CREATIVE §7.3 性能红线）：
 * - 只有 **1 个** ScrollTrigger 监听 body，`onUpdate` 直写一个**固定引用**的
 *   可变对象 `state`，再同步通知订阅者。**零分配、零 setState。**
 * - `getBoundingClientRect` 只在 `onRefresh`（= ScrollTrigger.refresh / resize）
 *   时发生，绝不在 onUpdate 里读布局。
 * - 引用计数：第一个订阅者创建 trigger，最后一个离开时 kill，
 *   子页（/team /manifesto）不会残留监听。
 * - SSR 安全：模块可以在服务端被 import，`ensure()` 直接 no-op。
 *
 * 另有「命名通道」`setScrollChannel / getScrollChannel`：
 * 让某个 section 把自己的局部进度（例如 S3 的 uProgress、S12 的横向进度）
 * 广播出去，供 HUD 或别的 section 只读消费——同样是零 React 状态。
 * 通道是**跨组件的单向数据流**：写方唯一，读方任意。
 */

import { ScrollTrigger, registerGsap } from './gsap'

/* ═══ 文档级状态 ═══════════════════════════════════════════ */

export interface ScrollState {
  /** 当前滚动位置（px）。 */
  y: number
  /** 文档滚动进度 0..1。 */
  progress: number
  /** 有符号速度（px/s），来自 ScrollTrigger.getVelocity()。 */
  velocity: number
  /** 1 = 向下，-1 = 向上，0 = 尚未滚动。 */
  direction: 1 | -1 | 0
  /** 可滚动总距离（px），`onRefresh` 时更新。 */
  limit: number
  /** 视口高度（px），`onRefresh` 时更新。 */
  vh: number
  /** 视口宽度（px），`onRefresh` 时更新。 */
  vw: number
}

export type ScrollListener = (state: Readonly<ScrollState>) => void

/** **永远是同一个对象引用**——消费者可以缓存它，逐帧读不产生垃圾。 */
const state: ScrollState = {
  y: 0,
  progress: 0,
  velocity: 0,
  direction: 0,
  limit: 0,
  vh: 0,
  vw: 0,
}

const listeners = new Set<ScrollListener>()

let trigger: ScrollTrigger | null = null
let refCount = 0

function emit(): void {
  for (const fn of listeners) fn(state)
}

function readMetrics(): void {
  if (typeof window === 'undefined') return
  state.vh = window.innerHeight || 0
  state.vw = window.innerWidth || 0
}

function ensure(): void {
  if (trigger || typeof window === 'undefined' || typeof document === 'undefined') return
  registerGsap()
  readMetrics()

  trigger = ScrollTrigger.create({
    trigger: document.body,
    start: 'top top',
    end: 'bottom bottom',
    invalidateOnRefresh: true,
    onRefresh: (self) => {
      readMetrics()
      state.limit = Math.max(0, self.end - self.start)
      state.y = self.scroll()
      state.progress = self.progress
      emit()
    },
    onUpdate: (self) => {
      state.y = self.scroll()
      state.progress = self.progress
      state.velocity = self.getVelocity()
      state.direction = self.direction === 0 ? 0 : self.direction > 0 ? 1 : -1
      emit()
    },
  })

  // 首帧同步一次，避免刷新后停在页面中段时消费者读到 0。
  state.limit = Math.max(0, trigger.end - trigger.start)
  state.y = trigger.scroll()
  state.progress = trigger.progress
  emit()
}

function teardown(): void {
  trigger?.kill()
  trigger = null
}

/**
 * 只读当前状态。**不会**自动启动总线——若没有任何订阅者，
 * 返回的是上一次已知值（首屏为全 0）。逐帧读取请直接缓存这个引用。
 */
export function scrollState(): Readonly<ScrollState> {
  return state
}

/**
 * 订阅滚动更新。返回退订函数。
 * 第一个订阅者会创建 body ScrollTrigger，最后一个退订时销毁。
 *
 *   useEffect(() => subscribeScroll((s) => { el.style.setProperty('--p', String(s.progress)) }), [])
 */
export function subscribeScroll(fn: ScrollListener): () => void {
  if (typeof window === 'undefined') return () => {}
  listeners.add(fn)
  refCount += 1
  ensure()
  // 让新订阅者立刻拿到当前值，而不是等到下一次滚动。
  fn(state)

  let released = false
  return () => {
    if (released) return
    released = true
    listeners.delete(fn)
    refCount -= 1
    if (refCount <= 0) {
      refCount = 0
      teardown()
    }
  }
}

/**
 * 只持有总线而不订阅回调（例如 WebGL 逐帧自己去 `scrollState()` 读）。
 * 返回释放函数。
 */
export function retainScrollBus(): () => void {
  return subscribeScroll(NOOP)
}

const NOOP: ScrollListener = () => {}

/* ═══ 命名通道 ═════════════════════════════════════════════ */

/**
 * 站内约定的通道名。新增请在这里登记，避免各处拼字符串拼错。
 * （类型是开放的 string，这里只是一份「已知清单」。）
 */
export const SCROLL_CHANNEL = {
  /** S3 The Impression 的 uProgress 0..1。 */
  impression: 'impression',
  /** S5→S6 尺断的连续进度 0..1。 */
  ruler: 'ruler',
  /** S12 横向 pin 的行程 0..1。 */
  fifthColumn: 'fifthColumn',
  /** 齿孔栏形态阶段 0..1（A1）。 */
  sprocket: 'sprocket',
} as const

export type ScrollChannel = string

const channels = new Map<ScrollChannel, number>()
const channelListeners = new Map<ScrollChannel, Set<(v: number) => void>>()

/** 写入通道。写方唯一，通常是拥有该 section 的那个 ScrollTrigger。 */
export function setScrollChannel(name: ScrollChannel, value: number): void {
  if (channels.get(name) === value) return
  channels.set(name, value)
  const set = channelListeners.get(name)
  if (!set) return
  for (const fn of set) fn(value)
}

/** 读取通道当前值；从未写过时返回 `fallback`（默认 0）。 */
export function getScrollChannel(name: ScrollChannel, fallback = 0): number {
  return channels.get(name) ?? fallback
}

/** 订阅某个通道。返回退订函数。订阅瞬间会同步收到一次当前值。 */
export function subscribeScrollChannel(
  name: ScrollChannel,
  fn: (value: number) => void,
): () => void {
  let set = channelListeners.get(name)
  if (!set) {
    set = new Set()
    channelListeners.set(name, set)
  }
  set.add(fn)
  fn(channels.get(name) ?? 0)

  let released = false
  return () => {
    if (released) return
    released = true
    set.delete(fn)
    if (set.size === 0) channelListeners.delete(name)
  }
}

/** 路由切换时清空通道（不影响文档级状态）。 */
export function resetScrollChannels(): void {
  for (const name of Array.from(channels.keys())) setScrollChannel(name, 0)
}
