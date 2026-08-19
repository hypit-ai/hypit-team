'use client'

import { useMediaQuery } from './useMediaQuery'

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * 用户是否要求减少动效。
 * SSR / 首帧返回 false（与 CSS 媒体查询兜底一致），hydrate 后校正。
 * GSAP / Lenis / Three 的初始化必须先读它：为 true 时不初始化 Lenis、tier 直接 static。
 */
export function useReducedMotion(): boolean {
  return useMediaQuery(REDUCED_MOTION_QUERY)
}
