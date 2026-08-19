'use client'

/**
 * GSAP 插件单例注册。
 *
 * 全站**唯一**允许 `gsap.registerPlugin` 的地方。任何 section 需要 gsap /
 * ScrollTrigger / useGSAP，一律从本文件 import，绝不 `import 'gsap/all'`
 * （体积预算见蓝图 §5.6）。
 *
 * 副作用在模块被 client 端 import 时执行一次，SSR 下自动跳过。
 */

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

let registered = false

/** 幂等注册。SSR 环境直接 no-op。 */
export function registerGsap(): void {
  if (registered || typeof window === 'undefined') return
  registered = true

  gsap.registerPlugin(ScrollTrigger, useGSAP)

  // 单时钟：Lenis 驱动 ticker，lagSmoothing 必须关掉，
  // 否则掉帧时 gsap 会自行补偿，和 Lenis 的时间轴打架（蓝图 §5.1）。
  gsap.ticker.lagSmoothing(0)

  // 移动端地址栏收缩会触发 resize，默认行为会导致 pin 抖动。
  ScrollTrigger.config({ ignoreMobileResize: true })

  gsap.defaults({ ease: 'none', overwrite: 'auto' })
}

registerGsap()

/** 是否已完成注册（测试/调试用）。 */
export function isGsapRegistered(): boolean {
  return registered
}

export { gsap, ScrollTrigger, useGSAP }
