'use client'

/**
 * A2 · CROP MARKS —— 四角裁切标记（CREATIVE.md §1-A2）。
 *
 * 视口四角固定 4 组 L 形 1px 角标（14px 臂长，`rule` 色），**永不动**。
 * 它们与右下角的 `HudFrame` 读数合成一句话：「这一屏是一块正在打样的版面」。
 *
 * 唯一的变化：在**招牌时刻**（M4 = S3 翻面 / M6–M7 = S5→S6 尺断 / M9 = S12 吞噬）
 * 转为 crimson，`transition: var(--dur-slow)`。全站仅此三处变色 —— 这是「你正在看重点」的
 * 唯一信号，比任何提示文案都高级，因此别处**不要**再加 `data-hud-accent`。
 *
 * 招牌时刻的判定来自全站唯一的 `activeSection` 观察者（section 根节点上的
 * `data-hud-accent`），与 HudFrame 读的是同一个信号，两者永远同步转色。
 *
 * 零 JS 逐帧开销：角标是静态 DOM，只有 `data-accent` 属性会切换（整页 3 次）。
 * `aria-hidden` + `pointer-events:none`，不参与朗读与命中。
 * z-index 取 40 —— 与 HudFrame 同层，压在 np-grain（45）之下，
 * 让颗粒盖到角标上，看起来是印在纸上而不是浮在纸上。
 */

import { cn } from '@/lib/utils/cn'
import { useActiveSection } from '@/components/scroll/activeSection'

export interface CropMarksProps {
  className?: string
}

const CORNERS = ['tl', 'tr', 'bl', 'br'] as const

export function CropMarks({ className }: CropMarksProps) {
  const { accent } = useActiveSection()

  return (
    <div
      aria-hidden="true"
      data-crop-marks=""
      data-accent={accent ? '' : undefined}
      className={cn('np-crop', className)}
    >
      <style>{CROP_CSS}</style>
      {CORNERS.map((corner) => (
        <span key={corner} className="np-crop__mark" data-corner={corner} />
      ))}
    </div>
  )
}

/**
 * 两条 1px 线拼成 L：用 `::before`（横臂）与 `::after`（竖臂）。
 * 不用 border 画整框 —— 角标是**四个角**，不是一个矩形。
 */
const CROP_CSS = `
.np-crop {
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
  --crop-pad: 14px;
  --crop-arm: 14px;
  /* 变色只经这一个变量，真正被过渡的是两条臂的 background-color。 */
  --crop-color: var(--color-rule);
}
@media (min-width: 640px) {
  .np-crop { --crop-pad: 20px; }
}
.np-crop[data-accent] { --crop-color: var(--color-crimson); }

.np-crop__mark {
  position: absolute;
  width: var(--crop-arm);
  height: var(--crop-arm);
}
.np-crop__mark::before,
.np-crop__mark::after {
  content: "";
  position: absolute;
  background: var(--crop-color);
  transition: background-color var(--dur-slow) var(--ease-out-quart);
}
/* 横臂 */
.np-crop__mark::before {
  left: 0;
  right: 0;
  height: 1px;
}
/* 竖臂 */
.np-crop__mark::after {
  top: 0;
  bottom: 0;
  width: 1px;
}

.np-crop__mark[data-corner="tl"] { top: var(--crop-pad); left: var(--crop-pad); }
.np-crop__mark[data-corner="tl"]::before { top: 0; }
.np-crop__mark[data-corner="tl"]::after { left: 0; }

.np-crop__mark[data-corner="tr"] { top: var(--crop-pad); right: var(--crop-pad); }
.np-crop__mark[data-corner="tr"]::before { top: 0; }
.np-crop__mark[data-corner="tr"]::after { right: 0; }

.np-crop__mark[data-corner="bl"] { bottom: var(--crop-pad); left: var(--crop-pad); }
.np-crop__mark[data-corner="bl"]::before { bottom: 0; }
.np-crop__mark[data-corner="bl"]::after { left: 0; }

.np-crop__mark[data-corner="br"] { bottom: var(--crop-pad); right: var(--crop-pad); }
.np-crop__mark[data-corner="br"]::before { bottom: 0; }
.np-crop__mark[data-corner="br"]::after { right: 0; }

/*
 * 左下角标会和齿孔栏（左缘 20–28px）叠在一起：把左侧两个角标推到栏外，
 * 两件器械各自可读，不互相压线。
 */
.np-crop__mark[data-corner="tl"],
.np-crop__mark[data-corner="bl"] { left: calc(var(--crop-pad) + clamp(20px, 2.2vw, 28px)); }
@media (max-width: 767px) {
  .np-crop__mark[data-corner="tl"],
  .np-crop__mark[data-corner="bl"] { left: calc(var(--crop-pad) + 12px); }
}

@media (prefers-reduced-motion: reduce) {
  .np-crop,
  .np-crop__mark::before,
  .np-crop__mark::after { transition: none; }
}
`

export default CropMarks
