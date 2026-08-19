'use client'

/**
 * 滚动基础设施的统一入口。
 *
 * section 一律从 `@/components/scroll` 取东西，不要深入到具体文件——
 * 这样以后换实现（例如 Lenis 换掉）只改这一层。
 *
 * 选型速查：
 *   只想拿滚动量 → useScrollProgress / scrollState / 命名通道
 *   多层不同速率 → useParallax（1 个 trigger 带 N 层）
 *   单段 scrub    → useSectionTrigger
 *   pin 长镜头    → usePinnedScene
 *   横向 pin      → useHorizontalPin
 *   跨 section    → useContinuousScene
 */

export { gsap, ScrollTrigger, useGSAP, registerGsap, isGsapRegistered } from './gsap'
export { SmoothScroll, getLenis, scrollToTarget } from './SmoothScroll'
export type { ScrollToOptions, SmoothScrollProps } from './SmoothScroll'

export {
  scrollState,
  subscribeScroll,
  retainScrollBus,
  setScrollChannel,
  getScrollChannel,
  subscribeScrollChannel,
  resetScrollChannels,
  SCROLL_CHANNEL,
} from './scrollBus'
export type { ScrollState, ScrollListener, ScrollChannel } from './scrollBus'

export { useSectionTrigger, useUniformScrub, useActiveSectionReporter } from './useSectionTrigger'
export type {
  SectionScope,
  SectionTriggerCtx,
  SectionTriggerBuilder,
  SectionTriggerOptions,
  UniformScrubOptions,
} from './useSectionTrigger'

export { usePinnedScene } from './usePinnedScene'
export type { SceneScope, PinnedSceneCtx, PinnedSceneBuilder, PinnedSceneOptions } from './usePinnedScene'

export { useHorizontalPin } from './useHorizontalPin'
export type { HorizontalPinCtx, HorizontalPinBuilder, HorizontalPinOptions } from './useHorizontalPin'

export { useContinuousScene } from './useContinuousScene'
export type {
  ContinuousSceneCtx,
  ContinuousSceneBuilder,
  ContinuousSegment,
  ContinuousSceneOptions,
} from './useContinuousScene'
