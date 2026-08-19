'use client'

/**
 * 通用 ScrollTrigger 封装（蓝图 §1 约定：所有 ScrollTrigger 都在 `useGSAP({ scope })` 内创建）。
 *
 * 解决四件重复劳动：
 * 1. scope 隔离 + 自动 revert（组件卸载/依赖变化时不残留 trigger）；
 * 2. `prefers-reduced-motion` 与断点分支（内置 matchMedia）；
 * 3. `invalidateOnRefresh` / `ease:'none'` 等 scrub 默认值（§4.1 硬约束）；
 * 4. scroll → uniform 直写（不经过 React 状态，§5.3）。
 *
 * 用法：
 *   const root = useRef<HTMLElement>(null)
 *   useSectionTrigger(root, ({ gsap, q, scrub }) => {
 *     gsap.to(q('[data-word]'), { '--w': 1, stagger: 0.02, scrollTrigger: scrub({ end: 'bottom 60%' }) })
 *   })
 */

import { useEffect, useRef, type RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP } from './gsap'
import { compileUniforms, type CompileUniformState } from '@/lib/store/compile'

export type SectionScope = RefObject<HTMLElement | null>

export interface SectionTriggerCtx {
  gsap: typeof gsap
  ScrollTrigger: typeof ScrollTrigger
  /** section 根元素。 */
  root: HTMLElement
  /** 用户要求减少动效。为 true 时应只做 opacity 级别的过渡或直接静止。 */
  reduced: boolean
  /** ≥64rem。移动端优先：桌面专属的 pin / 横向滚动放在 `if (desktop)` 里。 */
  desktop: boolean
  /** scope 内选择器查询。 */
  q: <T extends Element = HTMLElement>(selector: string) => T[]
  /** scope 内单个查询。 */
  one: <T extends Element = HTMLElement>(selector: string) => T | null
  /** 生成一份带项目默认值的 scrub ScrollTrigger 配置。 */
  scrub: (vars?: ScrollTrigger.Vars, amount?: number | boolean) => ScrollTrigger.Vars
  /** 生成一份「进入一次即播」的 ScrollTrigger 配置。 */
  once: (vars?: ScrollTrigger.Vars) => ScrollTrigger.Vars
}

/**
 * builder 可以返回一个清理函数：定时器、原生监听器、rAF 这类 GSAP
 * 自己回滚不掉的东西必须挂在这里。返回值直接交给 `gsap.matchMedia` 的
 * context，断点/动效偏好变化与组件卸载时都会跑一次。
 */
export type SectionTriggerBuilder = (ctx: SectionTriggerCtx) => void | (() => void)

export interface SectionTriggerOptions {
  /** 额外依赖，变化时整段 revert 重建。 */
  deps?: unknown[]
  /** reduced-motion 下是否仍然执行 builder（默认 true，由 builder 内部自己分支）。 */
  runWhenReduced?: boolean
}

const MQ_DESKTOP = '(min-width: 64rem)'
const MQ_REDUCED = '(prefers-reduced-motion: reduce)'

function matches(query: string): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(query).matches
}

/**
 * 在 section 根元素的 scope 内创建动效。
 * 内部用 `gsap.matchMedia()`，断点/动效偏好变化时自动重建并回滚旧的。
 */
export function useSectionTrigger(
  scope: SectionScope,
  build: SectionTriggerBuilder,
  { deps = [], runWhenReduced = true }: SectionTriggerOptions = {},
): void {
  useGSAP(
    () => {
      const root = scope.current
      if (!root) return

      const mm = gsap.matchMedia()
      mm.add(
        { desktop: MQ_DESKTOP, reduced: MQ_REDUCED },
        (ctx) => {
          const conditions = (ctx.conditions ?? {}) as { desktop?: boolean; reduced?: boolean }
          const reduced = Boolean(conditions.reduced)
          const desktop = Boolean(conditions.desktop)
          if (reduced && !runWhenReduced) return

          const q = <T extends Element = HTMLElement>(selector: string): T[] =>
            Array.from(root.querySelectorAll<Element>(selector)) as unknown as T[]

          return build({
            gsap,
            ScrollTrigger,
            root,
            reduced,
            desktop,
            q,
            one: <T extends Element = HTMLElement>(selector: string) =>
              root.querySelector(selector) as T | null,
            scrub: (vars, amount = 0.5) => ({
              trigger: root,
              start: 'top bottom',
              end: 'bottom top',
              scrub: reduced ? false : amount,
              invalidateOnRefresh: true,
              ...vars,
            }),
            once: (vars) => ({
              trigger: root,
              start: 'top 78%',
              once: true,
              ...vars,
            }),
          })
        },
      )

      return () => {
        mm.revert()
      }
    },
    { scope, dependencies: deps, revertOnUpdate: true },
  )
}

/** 把滚动进度直写进某个 uniform，全程零 React 状态。 */
export type ScalarUniformKey = {
  [K in keyof CompileUniformState]: CompileUniformState[K] extends number ? K : never
}[keyof CompileUniformState]

export interface UniformScrubOptions {
  /** 目标 uniform（标量）。 */
  key: ScalarUniformKey
  from?: number
  to?: number
  start?: ScrollTrigger.Vars['start']
  end?: ScrollTrigger.Vars['end']
  scrub?: number | boolean
  /** 每次更新的附加回调（例如同时驱动 DOM）。 */
  onUpdate?: (value: number, progress: number) => void
}

/**
 * section 滚动 → uniform 的标准接线。
 *
 *   const root = useRef<HTMLElement>(null)
 *   useUniformScrub(root, { key: 'progress', from: 0, to: 0.22, end: '+=120%' })
 *
 * reduced-motion 下不建 trigger，直接把 uniform 写成 `to`（终态）。
 */
export function useUniformScrub(scope: SectionScope, options: UniformScrubOptions): void {
  const optsRef = useRef(options)
  optsRef.current = options

  useGSAP(
    () => {
      const root = scope.current
      if (!root) return
      const o = optsRef.current
      const from = o.from ?? 0
      const to = o.to ?? 1
      const u = compileUniforms()

      if (matches(MQ_REDUCED)) {
        ;(u[o.key] as number) = to
        o.onUpdate?.(to, 1)
        return
      }

      const st = ScrollTrigger.create({
        trigger: root,
        start: o.start ?? 'top bottom',
        end: o.end ?? 'bottom top',
        scrub: o.scrub ?? true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const v = from + (to - from) * self.progress
          ;(u[o.key] as number) = v
          o.onUpdate?.(v, self.progress)
        },
      })
      return () => st.kill()
    },
    { scope, dependencies: [options.key], revertOnUpdate: true },
  )
}

/**
 * 记录「当前 section」用于 HUD 的 SEC/NN。
 * 用 store 的 setActiveSection（低频 React 状态，允许订阅）。
 */
export function useActiveSectionReporter(
  scope: SectionScope,
  id: string,
  report: (id: string | null) => void,
): void {
  const reportRef = useRef(report)

  useEffect(() => {
    reportRef.current = report
  }, [report])

  useGSAP(
    () => {
      const root = scope.current
      if (!root) return
      const st = ScrollTrigger.create({
        trigger: root,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (self) => {
          if (self.isActive) reportRef.current(id)
        },
      })
      return () => st.kill()
    },
    { scope, dependencies: [id] },
  )
}
