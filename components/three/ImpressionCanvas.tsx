'use client'

/**
 * S3「翻面」的 WebGL 宿主 —— 全站唯一一处 WebGL 的挂载点。
 *
 * 用法（由 S3 section 负责摆放；宿主自己是 `absolute inset-0`，
 * 父元素必须是 `position: relative` 的那个格子，且正文层 z-index 更高）：
 *
 *   <div className="relative">
 *     <ImpressionCanvas sourceLines={lines} />        // z-0，pointer-events-none
 *     <figure className="relative z-1"> …正文… </figure>
 *   </div>
 *
 * 驱动：`setImpressionProgress(p)`（见 impressionProgress.ts），
 * 由 S3 的 ScrollTrigger.onUpdate 直接调用，不经过 React state。
 *
 * 三道闸门：
 *   near   —— 提前一屏才动态 import three chunk（首屏不含 three）
 *   active —— 在视口内 且 标签页可见，否则 frameloop='never'
 *   tier   —— static / reduced-motion / 无 WebGL → 根本不挂 Canvas，只画静态版
 */

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils/cn'
import { useTier } from './useTier'
import { useInkTheme } from './useInkTheme'
import { ImpressionPoster } from './ImpressionPoster'

const ImpressionScene = dynamic(
  () => import('./ImpressionScene').then((m) => m.ImpressionScene),
  { ssr: false, loading: () => null },
)

export interface ImpressionCanvasProps {
  /** 画进字形图集的真实源码行（来自 lib/data/code-samples）。 */
  sourceLines?: readonly string[]
  className?: string
}

export function ImpressionCanvas({ sourceLines, className }: ImpressionCanvasProps) {
  const tier = useTier()
  const theme = useInkTheme()
  const hostRef = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  const [active, setActive] = useState(false)
  const isStatic = tier === 'static'

  // 预载闸门：距视口一屏内才加载 three chunk
  useEffect(() => {
    const el = hostRef.current
    if (isStatic || !el || typeof window === 'undefined') return
    if (!('IntersectionObserver' in window)) {
      // 老浏览器没有 IO：异步降级为「一直算靠近」，避免 effect 内同步 setState
      queueMicrotask(() => setNear(true))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '100% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [isStatic])

  // 渲染闸门：离开视口 / 标签页隐藏 → frameloop='never'
  useEffect(() => {
    const el = hostRef.current
    if (isStatic || !el || typeof window === 'undefined') return
    let inView = false
    const sync = () => setActive(inView && document.visibilityState === 'visible')

    const io =
      'IntersectionObserver' in window
        ? new IntersectionObserver(
            (entries) => {
              inView = entries.some((e) => e.isIntersecting)
              sync()
            },
            { rootMargin: '10% 0px' },
          )
        : null
    if (io) io.observe(el)
    else {
      inView = true
      queueMicrotask(sync)
    }

    document.addEventListener('visibilitychange', sync)
    return () => {
      io?.disconnect()
      document.removeEventListener('visibilitychange', sync)
      setActive(false)
    }
  }, [isStatic])

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      data-tier={tier}
      data-impression=""
      // z-0 且 pointer-events-none：正文（z-1 起）永远压在它之上，永不遮挡。
      className={cn('pointer-events-none absolute inset-0 z-0 overflow-hidden', className)}
      // 墨点「印进纸里」而不是「浮在纸上」：light multiply / dark screen
      style={{ mixBlendMode: theme.dark ? 'screen' : 'multiply' }}
    >
      {/* static 档画静态版；其余档在靠近视口前什么都不画（不做无用的 2D 绘制） */}
      {isStatic ? (
        <ImpressionPoster sourceLines={sourceLines} />
      ) : near ? (
        <ImpressionScene tier={tier} sourceLines={sourceLines} active={active} />
      ) : null}
    </div>
  )
}

export default ImpressionCanvas
