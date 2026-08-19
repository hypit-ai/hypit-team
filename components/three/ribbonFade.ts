/**
 * 编译带的「可见度闸门」——模块级可变单例。
 *
 * 为什么不放进 zustand：它每帧都可能变（滚动驱动），走 React 状态就违反
 * §5.3「scroll → setState 视为 bug」。这里和 `lib/store/compile.ts` 的 `u`
 * 是同一种手法：**唯一引用、就地改写、零分配**。
 *
 * 语义：`1` = ribbon 在 Hero（S1）视口内、完全可见；`0` = 已滚出 Hero、
 * 必须彻底不可见（不是「淡到很低」，是 CSS opacity 0 + visibility hidden +
 * frameloop 停摆）。写入方是 `components/scroll/useHeroFade.ts`，
 * 读取方是 `CanvasHost`（CSS 层）与 `Ribbon`（uniform 层）。
 */

const state = { fade: 1 }

/** 读当前可见度 0..1。 */
export function ribbonFade(): number {
  return state.fade
}

/** 写可见度 0..1（自动 clamp）。 */
export function setRibbonFade(v: number): void {
  state.fade = v < 0 ? 0 : v > 1 ? 1 : v
}

/** ribbon 是否处于「完全落位」状态——S3 的 DOM 对齐等强形变只允许在此时生效。 */
export function ribbonFullyVisible(): boolean {
  return state.fade > 0.995
}
