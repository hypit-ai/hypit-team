'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * matchMedia 的 React 订阅版。SSR 与首帧一律返回 `serverFallback`（默认 false），
 * 客户端 hydrate 后立即校正，避免 hydration mismatch。
 */
export function useMediaQuery(query: string, serverFallback = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return serverFallback
    return window.matchMedia(query).matches
  }, [query, serverFallback])

  const getServerSnapshot = useCallback(() => serverFallback, [serverFallback])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** 常用断点（与 globals.css §4 的 --breakpoint-* 同源）。 */
export const mq = {
  sm: '(min-width: 40rem)',
  md: '(min-width: 48rem)',
  lg: '(min-width: 64rem)',
  xl: '(min-width: 80rem)',
  fine: '(pointer: fine)',
  hover: '(hover: hover)',
} as const

/** 桌面（≥64rem）。移动端优先：SSR 默认 false。 */
export function useIsDesktop(): boolean {
  return useMediaQuery(mq.lg)
}

/** 精确指针设备——hover 类交互只在此为 true 时启用。 */
export function useHasFinePointer(): boolean {
  return useMediaQuery(mq.fine)
}
