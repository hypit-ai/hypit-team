/**
 * 仓库实测数字（蓝图 §3.3 / §8 红线 4）。
 * 数据源：hypit-ai/narratage 工作区实测，禁止杜撰或四舍五入。
 *   packages/ 88 个 · services/ 3 个 · .ts 648 个 · *.test.ts 100 个
 *   provider-* 9 个 · examples/**\/*.svml 8 个 · docs/**\/*.md 38 个 · engines.node >= 22
 */

import type { L10n } from './types'

export interface Stat {
  id: string
  value: number
  suffix?: string
  label: L10n
  note?: L10n
}

export const stats: Stat[] = [
  {
    id: 'packages',
    value: 88,
    label: { en: 'packages', cn: '个包' },
    note: { en: 'seven layers, one workspace', cn: '七层架构，一个工作区' },
  },
  {
    id: 'services',
    value: 3,
    label: { en: 'services', cn: '个服务' },
    note: { en: 'whisperx · media-lambda · image-opencv', cn: 'whisperx · media-lambda · image-opencv' },
  },
  {
    id: 'ts-files',
    value: 648,
    label: { en: 'TypeScript files', cn: '个 TypeScript 文件' },
  },
  {
    id: 'test-files',
    value: 100,
    label: { en: 'test files', cn: '个测试文件' },
    note: { en: 'node:test, no framework', cn: '直接用 node:test，不引框架' },
  },
  {
    id: 'providers',
    value: 9,
    label: { en: 'provider packages', cn: '个 Provider 包' },
    note: { en: 'BYOK — swap any of them', cn: 'BYOK，随时替换' },
  },
  {
    id: 'examples',
    value: 8,
    label: { en: 'example .svml projects', cn: '个 .svml 示例工程' },
  },
  {
    id: 'docs',
    value: 38,
    label: { en: 'docs pages', cn: '篇文档' },
  },
  {
    id: 'node',
    value: 22,
    suffix: '+',
    label: { en: 'Node.js required', cn: 'Node.js 版本要求' },
  },
]

const index = new Map(stats.map((s) => [s.id, s]))

export function statById(id: string): Stat | undefined {
  return index.get(id)
}
