'use client'

/**
 * 「现在停在哪一个 section」的**唯一**来源（CREATIVE §7.3 性能红线）。
 *
 * 之前站内有三份各自为政的实现：
 *   - `HudFrame` 每个滚动帧 `querySelectorAll` + 19 次 `getBoundingClientRect()`
 *   - `hooks/useSectionActive` 自建 IntersectionObserver
 *   - 齿孔栏 / 裁切角标又各需要一份
 * 现在统一收进这里：**全站一个 IntersectionObserver**，引用计数管理生命周期，
 * 主线程零布局读取，只有「当前 section 真的换了」时才通知一次（低频，允许 setState）。
 *
 * 判定带与 `useSectionActive` 同语义：「哪个 section 盖住视口 45% 这条线」。
 * 边界处可能同时命中两个，取靠前的那个（与旧实现一致）。
 */

import { useSyncExternalStore } from 'react'

/** 判定带：视口 45%~47% 的一条 2% 窄带。 */
const BAND = '-45% 0px -53% 0px'

/** 招牌时刻标记：section 根节点带此属性 → HUD 读数与四角裁切标记转 crimson。 */
const ACCENT_ATTR = 'data-hud-accent'

export interface ActiveSection {
  /** `data-section` 的值（锚点 id），无命中为 null。 */
  id: string | null
  /** `data-sec` 的值（`'07'`），无命中为 null。 */
  sec: string | null
  /** 文档顺序下标，无命中为 -1。 */
  index: number
  /** 已登记的 section 总数。 */
  total: number
  /** 当前 section 是否是招牌时刻。 */
  accent: boolean
  /**
   * **最后一次有效**的 `sec` 读数：判定带空窗时（页脚、页首过渡帧）保留上一个值，
   * 只有从未命中过才是 null。
   *
   * 为什么要单独一份而不是让 `sec` 自己粘住：`sec` 是「此刻带上盖着谁」，
   * HUD / 齿孔栏 / 裁切标记要的是这个瞬时值，空窗就该空。
   * 而导航高亮要的是「读者读到哪儿了」—— 页脚不是 section，却显然属于最后一个乐章。
   * 两种语义分开写，谁也不用为对方将就。
   */
  heldSec: string | null
}

/** **永远是同一个对象引用**，消费者可以缓存。 */
const state: ActiveSection = {
  id: null,
  sec: null,
  index: -1,
  total: 0,
  accent: false,
  heldSec: null,
}

export type ActiveSectionListener = (state: Readonly<ActiveSection>) => void

const listeners = new Set<ActiveSectionListener>()

let io: IntersectionObserver | null = null
let nodes: HTMLElement[] = []
let timer = 0
/** 当前落在判定带内的下标集合。 */
const hit = new Set<number>()
let refCount = 0

/**
 * 给 React 用的**不可变快照**。`state` 是逐帧读取用的固定引用（零分配），
 * React 需要「值变了引用也变」才能重渲染，因此每次变更时换一个新对象。
 * 变更是低频的（整页 18 次），不构成分配压力。
 */
/** SSR 快照必须是常量引用，否则 React 会判定服务端渲染不稳定。 */
const SERVER_SNAPSHOT: Readonly<ActiveSection> = Object.freeze({ ...state })
/** 初值直接复用 SSR 快照：hydrate 后引用不变，不会白白多渲染一次。 */
let snapshot: Readonly<ActiveSection> = SERVER_SNAPSHOT

function emit(): void {
  snapshot = { ...state }
  for (const fn of listeners) fn(state)
}

function apply(): void {
  let index = -1
  for (const i of hit) if (index === -1 || i < index) index = i
  const node = index >= 0 ? nodes[index] : null
  // 只读 dataset / 属性，不读几何 —— 不触发布局。
  const id = node?.dataset.section ?? null
  const sec = node?.dataset.sec ?? null
  const accent = node !== null && node.hasAttribute(ACCENT_ATTR)
  const total = nodes.length
  /*
   * hit 为空时沿用旧值会把读数卡住：中线落在页脚（页脚不是 [data-sec] 区域），
   * 或一次性跳到底部（锚点跳转 / Cmd+End / 刷新恢复位置）时，
   * IntersectionObserver 只报告最终状态，中间段从未进入过判定带，
   * heldSec 于是停在跳转前的那一段 —— 实测滚到页脚时导航仍高亮 03 BUILD。
   * 只在无命中时做一次几何扫描（低频，不在滚动热路径上），
   * 取最后一个已经滚过判定线的 section。
   */
  let heldSec = sec ?? state.heldSec
  if (sec === null && nodes.length > 0) {
    const edge = window.innerHeight * 0.45
    let passed: string | null = null
    for (const n of nodes) {
      if (n.getBoundingClientRect().top > edge) break
      passed = n.dataset.sec ?? passed
    }
    if (passed !== null) heldSec = passed
  }

  if (
    state.id === id &&
    state.sec === sec &&
    state.index === index &&
    state.total === total &&
    state.accent === accent &&
    state.heldSec === heldSec
  ) {
    return
  }

  state.id = id
  state.sec = sec
  state.index = index
  state.total = total
  state.accent = accent
  state.heldSec = heldSec
  emit()
}

function scan(): void {
  const next = Array.from(
    document.querySelectorAll<HTMLElement>('[data-section][data-sec]'),
  )
  // 集合没变就不重建观察者：重建会丢掉当前命中态，导致读数闪一下。
  if (next.length === nodes.length && next.every((n, i) => n === nodes[i])) return

  nodes = next
  hit.clear()
  io?.disconnect()
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const i = nodes.indexOf(e.target as HTMLElement)
        if (i < 0) continue
        if (e.isIntersecting) hit.add(i)
        else hit.delete(i)
      }
      apply()
    },
    { rootMargin: BAND, threshold: 0 },
  )
  for (const n of nodes) io.observe(n)
  apply()
}

function ensure(): void {
  if (io || typeof window === 'undefined' || !('IntersectionObserver' in window)) return
  scan()
  // section 由 SSR 一次性输出，正常情况 scan 一次就够；
  // 字体落位后与 1.2s 后各补扫一次，兜住「客户端 section 晚挂载」这种边角情况。
  document.fonts?.ready.then(() => io && scan()).catch(() => {})
  timer = window.setTimeout(() => io && scan(), 1200)
}

function teardown(): void {
  window.clearTimeout(timer)
  timer = 0
  io?.disconnect()
  io = null
  nodes = []
  hit.clear()
  state.id = null
  state.sec = null
  state.index = -1
  state.total = 0
  state.accent = false
  state.heldSec = null
  snapshot = SERVER_SNAPSHOT
}

/** 只读当前值。没有订阅者时返回上一次已知值。 */
export function activeSection(): Readonly<ActiveSection> {
  return state
}

/**
 * 订阅当前 section。返回退订函数；订阅瞬间会同步收到一次当前值。
 * 第一个订阅者创建观察者，最后一个退订时销毁（子页不残留）。
 */
export function subscribeActiveSection(fn: ActiveSectionListener): () => void {
  if (typeof window === 'undefined') return () => {}
  listeners.add(fn)
  refCount += 1
  ensure()
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

function subscribeForReact(onChange: () => void): () => void {
  return subscribeActiveSection(onChange)
}

function getSnapshot(): Readonly<ActiveSection> {
  return snapshot
}

function getServerSnapshot(): Readonly<ActiveSection> {
  return SERVER_SNAPSHOT
}

/**
 * React 侧读取当前 section。低频重渲染（整页最多 18 次），
 * 与「滚动量绝不进 React state」的铁律不冲突 —— 这里换的是**离散章节**，不是连续量。
 */
export function useActiveSection(): Readonly<ActiveSection> {
  return useSyncExternalStore(subscribeForReact, getSnapshot, getServerSnapshot)
}
