/**
 * `not-found` 页文案（蓝图 D10：所有对外文案双语，组件内零硬编码）。
 *
 * 404 原本整页写死英文（`No source for this route.` 等），是全站唯一一处
 * 绕开数据层的对外文案。语汇沿用全站的「校样 / 编译」隐喻：
 * 路由解析不到 = 这条路由没有对应的源码，编译器报 cannot resolve。
 */

import type { L10n } from './types'

export interface NotFoundData {
  /** mono eyebrow，记号不翻译。 */
  eyebrow: string
  title: L10n
  /** `<title>` 用（Metadata 不能放 JSX，单独一份短标题）。 */
  metaTitle: L10n
  /** 伪编译错误块。注释与消息双语，标识符是代码不翻译。 */
  error: {
    comment: L10n
    keyword: string
    message: L10n
    token: string
    hint: L10n
  }
  backLabel: L10n
}

export const notFound: NotFoundData = {
  eyebrow: 'SEC/404 — RESOLVE FAILED',
  title: {
    en: 'No source for this route.',
    cn: '这条路由没有对应的源码。',
  },
  metaTitle: {
    en: '404 — compile error',
    cn: '404 — 编译失败',
  },
  error: {
    comment: { en: '// narratage build', cn: '// narratage build' },
    keyword: 'error',
    message: { en: 'cannot resolve ', cn: '无法解析 ' },
    token: '<route>',
    hint: {
      en: '//   the page you requested is not part of this graph',
      cn: '//   你请求的页面不在这张图里',
    },
  },
  backLabel: {
    en: '← Back to index',
    cn: '← 返回首页',
  },
}
