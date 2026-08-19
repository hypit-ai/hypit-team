/**
 * OG 图（蓝图 §2 / §7 T4）：1200×630，crimson on paper。
 *
 * 文案取自 `lib/data/hero.ts`（英文版），与首屏一致；颜色写死为 BRAND.md §1 light
 * 色板的字面量（ImageResponse 不经过 Tailwind / CSS 变量，改 token 时同步这里）。
 * OG 图固定用 light（纸），社交平台缩略图没有主题概念，纸是品牌默认面。
 */

import { ImageResponse } from 'next/og'
import { hero } from '@/lib/data/hero'
import { nav } from '@/lib/data/nav'

export const alt = `${nav.brand.name} — ${hero.headline.line1.en} ${hero.headline.line2.en}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** BRAND.md §1 light 色板字面量。强调色只有 crimson。 */
const BG_0 = '#f3f0e8'
const TEXT_0 = '#191816'
const TEXT_1 = '#4a453d'
const TEXT_2 = '#6b6459'
const LINE = '#c7c0b2'
const CARBIDE = '#a01240'
/** 曾经的次强调 fuse 已并入 crimson；保留常量名以免打散下方版式。 */
const FUSE = '#a01240'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: BG_0,
          padding: '64px 72px',
        }}
      >
        {/* 顶部：字标 + eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              width: 14,
              height: 14,
              backgroundColor: CARBIDE,
            }}
          />
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              letterSpacing: 6,
              color: TEXT_0,
            }}
          >
            {nav.brand.wordmark}
          </div>
          <div style={{ display: 'flex', fontSize: 20, letterSpacing: 4, color: TEXT_2 }}>
            {hero.eyebrow}
          </div>
        </div>

        {/* 中部：标题 + 导语 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 84,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 1.02,
              color: TEXT_0,
            }}
          >
            <div style={{ display: 'flex' }}>{hero.headline.line1.en}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span>{hero.headline.line2.en}</span>
              <span
                style={{ display: 'flex', width: 30, height: 66, backgroundColor: CARBIDE }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', fontSize: 28, color: TEXT_1 }}>{hero.lead.en}</div>
            <div style={{ display: 'flex', fontSize: 28, color: FUSE }}>{hero.warcry.en}</div>
          </div>
        </div>

        {/* 底部：细线 + mono 元数据行 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', height: 1, width: '100%', backgroundColor: LINE }} />
          <div
            style={{ display: 'flex', gap: 16, fontSize: 18, color: TEXT_2, letterSpacing: 2 }}
          >
            {hero.metaLine.map((item, i) => (
              <div key={item} style={{ display: 'flex', gap: 16 }}>
                {i > 0 ? <span style={{ color: LINE }}>·</span> : null}
                <span>{item.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
