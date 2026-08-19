'use client'

/**
 * 「永远指向最新一次渲染的值」的 ref。
 *
 * 用途只有一个：把**回调**塞进一个长期存活的订阅里（滚动总线、ScrollTrigger、
 * IntersectionObserver），既能读到最新闭包，又不会因为调用方没写 `useCallback`
 * 就每次渲染都重建订阅。
 *
 * 为什么不直接在渲染期写 `ref.current = value`：
 * React Compiler 已在本项目启用，渲染期写 ref 是被禁止的（`react-hooks/refs`），
 * 而且在并发渲染下会读到被丢弃的那次渲染的值。这里改用 **layout effect** 写入——
 * layout effect 按 hook 调用顺序执行，只要本 hook 调用在消费方之前，
 * 消费方的 layout effect（`useGSAP` 就是）就一定能读到已更新的值。
 *
 * SSR：服务端没有 layout 阶段，直接退回 `useEffect` 以免 React 告警；
 * 服务端本来也不会有订阅在跑，ref 初值即正确值。
 */

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef(value)

  useIsomorphicLayoutEffect(() => {
    ref.current = value
  }, [value])

  return ref
}

export default useLatestRef
