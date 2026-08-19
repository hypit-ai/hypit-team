/** 导航（蓝图 §3.1 / S0）。 */

import type { L10n } from './types'

export interface NavItem {
  id: string
  href: string
  label: L10n
  /**
   * 这个乐章从第几段开始（`data-sec` 的数值）。
   *
   * 报头目录条是**五个乐章**的入口，不是五个 section 的锚点：17 段里只有 5 段
   * 挂着锚点，若照着这 5 个 id 各建一个 IntersectionObserver，中间那 12 段
   * 一律落在判定带外，高亮就会卡在上一个乐章不动 —— 滚到页脚仍亮着 `03 BUILD`
   * 正是这么来的。改成「当前段号 ≥ 哪个乐章的起点」，判定带交给全站唯一的
   * `components/scroll/activeSection` 观察者（它盯的是全部 17 段）。
   */
  fromSec: number
}

export interface NavData {
  items: NavItem[]
  ctaLinkId: string
  ctaLabel: L10n
  /**
   * 静态 star 数展示（不做运行时请求）。
   * 未核实到真实数字前保持 null —— UI 层隐藏该徽标，只渲染按钮，禁止编造。
   */
  githubStars: string | null
  brand: { name: string; wordmark: string; version: string }
}

export const nav: NavData = {
  brand: { name: 'Narratage', wordmark: 'NARRATAGE', version: 'v0.0.1' },
  items: [
    { id: 'what', href: '#what', label: { en: 'READ', cn: '读' }, fromSec: 2 },
    { id: 'hook', href: '#hook', label: { en: 'BREAK', cn: '拆' }, fromSec: 5 },
    { id: 'graphs', href: '#graphs', label: { en: 'BUILD', cn: '建' }, fromSec: 7 },
    { id: 'paradigms', href: '#paradigms', label: { en: 'ARGUE', cn: '辩' }, fromSec: 11 },
    { id: 'team', href: '#team', label: { en: 'PEOPLE', cn: '人' }, fromSec: 15 },
  ],
  ctaLinkId: 'github',
  ctaLabel: { en: 'Star on GitHub', cn: '在 GitHub 上 Star' },
  githubStars: null,
}
