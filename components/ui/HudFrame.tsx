'use client'

import { useActiveSection, type ActiveSection } from '@/components/scroll/activeSection'
import { cn } from '@/lib/utils/cn'

export interface HudFrameProps {
  /**
   * 受控 section 编号（如 `'07'`）。省略时读全站唯一的 `activeSection` 观察者。
   * 传 `null` 可强制隐藏。
   */
  sec?: string | null
  /** 编号前缀，默认 `SEC/`。 */
  prefix?: string
  className?: string
}

/**
 * 招牌时刻的标记属性由 `components/scroll/activeSection.ts` 统一读取：
 * 任何 section 根节点上写 `data-hud-accent` —— HUD 读数与四角裁切标记同时转 crimson。
 * CREATIVE §1-A2 把这条信号限定在 M4 / M6 / M9 三处，别处别加。
 */

/**
 * 旧实现在每个滚动帧里做 `querySelectorAll` + 对全部 19 个 section 逐个
 * `getBoundingClientRect()`——19 次强制同步布局 / 帧，是全站最贵的一处滚动开销
 * （CREATIVE §7.3 明令禁止在 onUpdate 里读布局）。
 *
 * 现在整套判定收进 `activeSection`（全站一个 IntersectionObserver，齿孔栏与
 * 裁切角标共用同一份），主线程零布局读取，只在 section 真的切换时重渲染一次。
 */
const EMPTY: Readonly<ActiveSection> = {
  id: null,
  sec: null,
  index: -1,
  total: 0,
  accent: false,
  heldSec: null,
}

/** 组件私有 keyframes：数字翻位（§6「像计数器翻位，而非淡入淡出」）。 */
const HUD_CSS = `
@keyframes hudRoll{
  from{ transform: translateY(0.62em); opacity: 0 }
  to{ transform: translateY(0); opacity: 1 }
}
.hud-digit{ display:inline-block; animation: hudRoll var(--dur-base) var(--ease-out-expo) both }
@media (prefers-reduced-motion: reduce){
  .hud-digit{ animation: none; opacity: 1; transform: none }
}
`

/**
 * HUD 器械（CREATIVE.md §1-A2 / §6）—— 恒定框架里「读数」的那一半。
 *
 * 分工说明：四角裁切标记（CROP MARKS）与左缘齿孔栏（SPROCKET RAIL）是各自
 * 独立的固定层组件，本文件**不重复绘制**它们，只负责两件读数：
 *
 *  1. **右缘章节索引**：每个 `[data-section][data-sec]` 一道 1px 短刻度，
 *     背后一条竖直发丝线，已走过的部分转 crimson —— 整页是一条正在被编译完的校样，
 *     刻度尺的语汇与 A1 齿孔栏同源。当前章节的刻度更长、转 crimson。
 *  2. **右下角 SEC 读数**：`SEC/07 — 19`，数字**逐位翻位**而非淡入淡出。
 *     section 根节点带 `data-hud-accent` 时（招牌时刻）整组读数转 crimson。
 *
 * 仍然是 `fixed / pointer-events:none / aria-hidden`，不参与命中与朗读。
 * z-index 取 40 —— 压在 np-grain（45）之下，颗粒会盖到读数上，
 * 保证它看起来印在纸上而不是浮在纸上。
 * 移动端（<sm）只保留右下读数：右缘刻度在窄屏会和内容抢边距。
 */
export function HudFrame({ sec, prefix = 'SEC/', className }: HudFrameProps) {
  const observed = useActiveSection()
  // 受控用法（传了 sec）不需要观察者的读数，但 hook 不能条件调用，
  // 因此照常订阅、只在这里丢弃结果。
  const self = sec === undefined ? observed : EMPTY
  const activeSec = sec === undefined ? self.sec : sec
  const { index, total, accent } = self

  const ticks = total > 0 ? Array.from({ length: total }, (_, i) => i) : []
  const walked = total > 1 && index >= 0 ? (index / (total - 1)) * 100 : 0

  /*
   * 节点**恒在**：早先的写法是 `if (!activeSec) return null`，服务端渲染 null、
   * 客户端 effect 后再插入这个 div。它的兄弟节点由 Lenis / GSAP 直接操作过，
   * React 找不到预期的锚点，于是抛
   * "Failed to execute 'insertBefore' on 'Node'"。
   * 改成始终渲染同一个节点、只切换文本与可见性，DOM 结构在两端保持一致。
   */
  return (
    <div
      aria-hidden="true"
      data-hud=""
      className={cn(
        'pointer-events-none fixed inset-0 z-40 select-none',
        'font-mono text-[length:var(--text-micro)] leading-none tracking-[0.18em] tabular-nums uppercase',
        className,
      )}
    >
      <style>{HUD_CSS}</style>

      {/* 右缘章节索引 */}
      <div
        className={cn(
          'absolute top-1/2 right-4 hidden -translate-y-1/2 sm:right-6',
          'flex-col items-end gap-1 sm:flex',
          'transition-opacity duration-[var(--dur-mid)]',
          ticks.length > 1 ? 'opacity-100' : 'opacity-0',
        )}
      >
        <span className="relative flex flex-col items-end gap-1">
          {/* 背衬发丝线 + 已编译段 */}
          <span className="bg-rule-soft absolute top-0 right-0 block h-full w-px" />
          {/*
            已编译段：满高 + scaleY，而不是动画 height。
            这条线常驻 fixed 层，每次 section 切换都会跑一次 300ms——
            用 height 意味着它在整页滚动期间反复触发布局与重绘。
          */}
          <span
            className="bg-crimson absolute top-0 right-0 block h-full w-px origin-top transition-transform duration-[var(--dur-mid)] ease-[var(--ease-out-quart)]"
            style={{ transform: `scaleY(${(walked / 100).toFixed(4)})` }}
          />
          {ticks.map((i) => (
            // 刻度同理：统一 14px 实宽（最长态），短态用 scaleX 收，origin 贴右缘对齐。
            <span
              key={i}
              className={cn(
                'block h-px w-[14px] origin-right transition-[transform,background-color] duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
                i === index ? 'bg-crimson' : i < index ? 'bg-rule' : 'bg-rule-soft',
              )}
              style={{ transform: `scaleX(${i === index ? 1 : i < index ? 0.5 : 0.357})` }}
            />
          ))}
        </span>
      </div>

      {/* 右下角读数 */}
      <div
        className={cn(
          'absolute right-4 bottom-4 flex items-center gap-2 sm:right-6 sm:bottom-6',
          'transition-opacity duration-[var(--dur-base)]',
          activeSec ? 'opacity-100' : 'opacity-0',
        )}
      >
        <span className={accent ? 'text-crimson' : 'text-muted'}>{prefix}</span>
        <span className={accent ? 'text-crimson' : 'text-ink'}>
          {(activeSec ?? '').split('').map((ch, i) => (
            // key 含字符：只有真正变化的那一位会重挂载、重新翻位
            <span key={`${i}-${ch}`} className="hud-digit">
              {ch}
            </span>
          ))}
        </span>
        {total > 0 ? (
          <>
            <span aria-hidden="true" className="bg-rule block h-px w-3" />
            <span className="text-muted">{total}</span>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default HudFrame
