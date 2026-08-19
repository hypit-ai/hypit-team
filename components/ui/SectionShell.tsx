import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { pad } from '@/lib/utils/format'
import { Eyebrow } from './Eyebrow'
import { SectionRule } from './SectionRule'

export type SectionWidth = 'shell' | 'wide' | 'prose' | 'full'
export type TitleScale = 'setpiece' | 'movement' | 'default' | 'close'
export type Rhythm = 'setpiece' | 'flow' | 'movement' | 'none'

export interface SectionShellProps {
  /** 锚点 id（"hero" / "what" / "graphs" …），同时写入 `data-section`。 */
  id: string
  /**
   * section 序号（S0..S18）。写入 `data-sec="07"`，供 HudFrame 读取显示 `SEC/07`。
   */
  sec?: number
  /**
   * mono 小标签，文案来自 lib/data。
   *
   * **不传就是默认**：段号已经由右下角常驻的 HudFrame 从 `data-sec` 读出来了，
   * 正文里再打一遍只是把 18 段都调成同一个节拍（P0-4.1）。全站只有五个乐章
   * 首段传它，内容也不再是 `SEC/NN` 而是乐章名（`MOVEMENT III — BUILD`）：
   * S2 READ · S5 BREAK · S7 BUILD · S11 ARGUE · S15 PEOPLE。
   */
  eyebrow?: ReactNode
  /** 大标题。 */
  title?: ReactNode
  /** 标题下的导语。 */
  lead?: ReactNode
  children?: ReactNode
  width?: SectionWidth
  /** 顶部 border-t（默认开）。Hero 等首屏 section 传 false。 */
  divider?: boolean
  /** 铺一层 .grid-field 细网格底。 */
  grid?: boolean
  /**
   * 纵向节奏三档（全站**唯一**的 section 间距来源）。
   *
   * 规则只有一条：**pb 恒为 tail，pt 分三档**。两段之间的空白因此
   * 完全由下一段的 `rhythm` 决定——边界只有一个作者，不再是两个对称
   * padding 相加的副产品。段落自己不得再写 `py-*`。
   *
   *   `setpiece` 招牌镜头进场（S3 / S5 / S6）→ 边界 104px，贴脸
   *   `flow`     普通阅读段（默认）           → 边界 192px
   *   `movement` 乐章首段（S2/S7/S11/S15/S17）→ 边界 312px，配 SectionRule
   *   `none`     完全自管纵向留白（Hero 一类首屏）
   */
  rhythm?: Rhythm
  /**
   * 招牌时刻（CREATIVE §1-A2）：写出 `data-hud-accent`，
   * 四角裁切标记与 HUD 读数在本 section 内转 crimson。
   * 全站仅 S3 / S5 / S6 / S11 四处（= 三个招牌镜头 + ARGUE 的塌缩），别处不要开。
   */
  hudAccent?: boolean
  /**
   * 章节转场（CREATIVE.md §6）：进入视口时顶栏细线 scaleX 0→1 展开、末端刻度弹出。
   * 仅在 `divider` 为真时生效；纯装饰，关掉也不影响可读性。
   *
   * **默认关闭**：每一段都画同一条线，等于一条也没画。全站只有五处显式打开——
   * S2 READ、S7 BUILD（走本 prop），S11 ARGUE、S15 PEOPLE、S17 尾声（手写版面，
   * 自己 import `SectionRule`）。BREAK 的边界（S5）不画线：那一段本身就是从版心
   * 挣脱出来的整幅镜头，一条入口线只会把它降回普通阅读段。
   */
  transition?: boolean
  /**
   * 标题三档（全站唯一的标题字号来源，section 不得自写 h2 字号）：
   *   `movement` 乐章首段 · `default` 常规段 · `close` 收束段
   */
  titleScale?: TitleScale
  /**
   * 招牌镜头（P0-3）不走 shell 报头、自己在正文里写标题时，
   * 把那个标题节点的 id 传进来，section 依然有可及名字。
   */
  labelledById?: string
  className?: string
  containerClassName?: string
  headerClassName?: string
}

/**
 * 全站**唯一**的 section 纵向留白来源（见 `rhythm` prop 的注释）。
 * 不走 SectionShell 的手写版面（S11 / S12 / S13 / S14 / S15 / S16 / S17）
 * **也必须**从这里取 class，不得自写 `py-section` 或 `py-[calc(...)]`。
 */
export const RHYTHM: Record<Rhythm, string> = {
  setpiece: 'pt-[var(--spacing-rhythm-setpiece)] pb-[var(--spacing-tail)]',
  flow: 'pt-[var(--spacing-rhythm-flow)] pb-[var(--spacing-tail)]',
  movement: 'pt-[var(--spacing-rhythm-movement)] pb-[var(--spacing-tail)]',
  none: '',
}

/**
 * 全站**唯一**的 section 标题字号来源（P1-5）。此前三种字号并存且与重要性无关：
 * 走 SectionShell 的段落是 h2，手写版面的段落各自写 h1 或 display，读者无法从字号
 * 判断哪一段更重。四档的分工是内容职责，不是版面偏好：
 *
 *   `setpiece` 排版装置本身（S15 拼词 / S16 年龄计数 / S18 回响）——一屏只此一件
 *   `movement` 乐章首段
 *   `default`  常规段
 *   `close`    收束段
 *
 * 不走 SectionShell 的手写段落**也必须**从这里取 class，不得自写字号。
 */
export const TITLE_SCALE: Record<TitleScale, string> = {
  setpiece: 'text-[length:var(--text-display)] leading-[1.02] tracking-[-0.05em] font-bold',
  movement: 'text-[length:var(--text-h1)] leading-[1.06] tracking-[-0.036em] font-bold max-w-[18ch]',
  default: 'text-[length:var(--text-h2)] leading-[1.1] tracking-[-0.028em] font-semibold max-w-[22ch]',
  close: 'text-[length:var(--text-h3)] leading-[1.22] tracking-[-0.018em] font-semibold max-w-[28ch]',
}

const WIDTH: Record<SectionWidth, string> = {
  shell: 'max-w-shell',
  wide: 'max-w-wide',
  prose: 'max-w-prose',
  full: 'max-w-none',
}

/**
 * 统一 section 外壳（蓝图 §1 约定）：
 * `id` + `data-section` + 顶部 `border-t border-line` + 节奏三档纵向留白 + 居中容器。
 * 纯 RSC，无 'use client'。标题层级固定 h2（Hero 用 `titleAs` 由调用方自行渲染 h1）。
 */
export function SectionShell({
  id,
  sec,
  eyebrow,
  title,
  lead,
  children,
  width = 'shell',
  divider = true,
  grid = false,
  rhythm = 'flow',
  hudAccent = false,
  transition = false,
  titleScale = 'default',
  labelledById,
  className,
  containerClassName,
  headerClassName,
}: SectionShellProps) {
  const headingId = labelledById ?? (title ? `${id}-title` : undefined)
  return (
    <section
      id={id}
      data-section={id}
      data-sec={sec === undefined ? undefined : pad(sec, 2)}
      data-hud-accent={hudAccent ? '' : undefined}
      aria-labelledby={headingId}
      className={cn(
        'relative isolate w-full',
        divider && 'border-line border-t',
        RHYTHM[rhythm],
        className,
      )}
    >
      {divider && transition ? <SectionRule /> : null}
      {grid ? <div aria-hidden="true" className="grid-field" /> : null}

      <div
        className={cn(
          'relative z-1 mx-auto w-full px-5 sm:px-8 lg:px-12',
          WIDTH[width],
          containerClassName,
        )}
      >
        {/*
          报头恒为**单列**：eyebrow → 标题 → 导语，自上而下同一条左边线。
          此前这里是 `md:flex-row md:items-end md:justify-between`，为的是把一个
          `aside` 元数据块甩到标题右侧 —— 但全站 19 个 section 没有一处传过
          `aside`，那条 row 轴从未被走到，只是把「小标签蹲在标题旁边」这个
          编辑型 SaaS 模板留在了骨架里。prop 与 row 轴一并删掉。
        */}
        {eyebrow || title || lead ? (
          <header className={cn('mb-block flex min-w-0 flex-col gap-4', headerClassName)}>
            {eyebrow ? <Eyebrow variant="dot">{eyebrow}</Eyebrow> : null}
            {title ? (
              <h2 id={`${id}-title`} className={cn('text-text-0', TITLE_SCALE[titleScale])}>
                {title}
              </h2>
            ) : null}
            {lead ? (
              <p className="text-[length:var(--text-lead)] leading-[1.6] text-text-1 max-w-prose">{lead}</p>
            ) : null}
          </header>
        ) : null}

        {children}
      </div>
    </section>
  )
}

export default SectionShell
