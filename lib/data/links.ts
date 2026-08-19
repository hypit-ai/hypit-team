/**
 * 站点外链（蓝图 §3.17 / D9）。
 * url 为 null 的项 UI 层必须自动隐藏，禁止渲染死链。
 */

import type { LinkRef } from './types'

export const links: LinkRef[] = [
  {
    id: 'github',
    label: 'GitHub',
    url: 'https://github.com/hypit-ai/narratage',
    external: true,
    note: 'hypit-ai/narratage',
  },
  {
    id: 'discord',
    label: 'Discord',
    url: 'https://discord.gg/z6UefHvj7f',
    external: true,
  },
  {
    id: 'docs',
    label: 'Docs',
    url: 'https://narratage.hypit.ai/quickstart',
    external: true,
    note: 'Quickstart',
  },
  {
    id: 'website',
    label: 'narratage.hypit.ai',
    url: 'https://narratage.hypit.ai/',
    external: true,
  },
  {
    id: 'preview',
    label: 'Preview',
    url: 'https://narratage.hypit.site/',
    external: true,
    note: 'staging preview',
  },
  {
    id: 'license',
    label: 'Narratage Open Source License',
    url: 'https://github.com/hypit-ai/narratage/blob/main/LICENSE',
    external: true,
    note: 'modified Apache 2.0',
  },
  {
    id: 'email',
    label: 'official@hypit.ai',
    url: 'mailto:official@hypit.ai',
    external: true,
    note: 'commercial licensing',
  },
  // 未确认，不上线（§8 红线 9）。UI 层遇到 null 自动隐藏。
  { id: 'x', label: 'X', url: null, external: true },
  { id: 'telegram', label: 'Telegram', url: null, external: true },
]

const index = new Map(links.map((l) => [l.id, l]))

export function linkById(id: string): LinkRef | undefined {
  return index.get(id)
}

/** 只返回有 url 的链接，供页脚/导航直接渲染。 */
export function visibleLinks(ids?: readonly string[]): LinkRef[] {
  const pool = ids ? ids.map((id) => index.get(id)).filter(isLink) : links
  return pool.filter((l) => l.url !== null)
}

function isLink(value: LinkRef | undefined): value is LinkRef {
  return value !== undefined
}
