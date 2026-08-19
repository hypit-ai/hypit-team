import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { pad } from '@/lib/utils/format'
import { ScrollEdgeStyle, X_SCROLL } from './ScrollEdge'

export type CellAlign = 'left' | 'right' | 'center'

export interface DataTableColumn<Row> {
  key: string
  /** 表头文案，来自 lib/data。 */
  header: ReactNode
  cell: (row: Row, index: number) => ReactNode
  align?: CellAlign
  /** CSS 宽度（'12ch' / '22%'），落到 <col>。 */
  width?: string
  /** 该列用等宽字（默认 true —— 档案表格排版）。 */
  mono?: boolean
  /** 该列在窄屏隐藏（信息密度分级）。 */
  hideBelow?: 'sm' | 'md' | 'lg'
  className?: string
}

export type StatusTone = 'default' | 'accent' | 'danger' | 'muted'

export interface RowStatus {
  label: ReactNode
  tone?: StatusTone
}

export interface DataTableProps<Row> {
  columns: readonly DataTableColumn<Row>[]
  rows: readonly Row[]
  /** 稳定 key。 */
  rowKey: (row: Row, index: number) => string
  /** 表格标题（<caption>，屏幕阅读器可见）。 */
  caption?: ReactNode
  /** 视觉上隐藏 caption（仅留给辅助技术）。默认 true。 */
  captionHidden?: boolean
  /**
   * 行首序号列（§9.1 M4）。
   * - 省略 → 自动 `01 02 03…`
   * - 函数 → 自定义（如 `(r) => r.code` 得到 `L1 L2…`）
   * - false → 不显示
   */
  seq?: false | ((row: Row, index: number) => ReactNode)
  /** 行尾状态标签（§9.1 M4）。返回 null 则该行留空。 */
  status?: (row: Row, index: number) => RowStatus | null
  /** 序号列表头文案（来自数据层；省略则表头空白）。 */
  seqHeader?: ReactNode
  /** 状态列表头文案。 */
  statusHeader?: ReactNode
  /** 受控高亮行（rowKey 值）。 */
  activeKey?: string | null
  /** 行可选：给出后行变为 role=button，键盘 Enter/Space 可触发。 */
  onRowSelect?: (row: Row, index: number) => void
  dense?: boolean
  /** 表格最小宽度，触发横滚（默认 '44rem'）。 */
  minWidth?: string
  className?: string
  wrapperClassName?: string
}

const ALIGN: Record<CellAlign, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
}

const HIDE: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
}

const STATUS_TONE: Record<StatusTone, string> = {
  default: 'text-text-1 border-line',
  accent: 'text-carbide border-carbide',
  danger: 'text-fuse border-fuse',
  muted: 'text-text-2 border-line',
}

/**
 * 档案表格（蓝图 §9.1 M4）：密排等宽 + 细分隔线 + 行首序号 + 行尾状态标签。
 * **不做卡片网格**——移动端保持表格语义，靠外层 `overflow-x-auto` 横滚，body 绝不横滚。
 *
 * 无 'use client'：无 hooks。若传 `onRowSelect`，调用方本身即 client 组件。
 */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  caption,
  captionHidden = true,
  seq,
  status,
  seqHeader,
  statusHeader,
  activeKey = null,
  onRowSelect,
  dense = true,
  minWidth = '44rem',
  className,
  wrapperClassName,
}: DataTableProps<Row>) {
  const showSeq = seq !== false
  const seqOf = typeof seq === 'function' ? seq : (_row: Row, i: number) => pad(i + 1, 2)
  const cellPad = dense ? 'px-3 py-2' : 'px-4 py-3'

  const handleKey = (row: Row, index: number) => (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (!onRowSelect) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onRowSelect(row, index)
    }
  }

  return (
    /*
      两层，不是一层：**边框在外，遮罩在内**。
      截断语汇（ScrollEdge）用 mask-image 让末列字形淡出，而遮罩的定位区是元素的
      边框盒——把它挂在带 border 的那一层上，右边那道 1px 框线会连同文字一起被吃掉，
      表格看起来像少了一条边。所以外层只负责框与宽度，内层才是滚动体。
    */
    <div className={cn('border-line w-full min-w-0 border', wrapperClassName)}>
      <ScrollEdgeStyle />
      <div className={cn('w-full min-w-0 overflow-x-auto', X_SCROLL)}>
        <table
          style={{ minWidth }}
          className={cn(
            'w-full border-collapse text-left',
            'font-mono text-[length:var(--text-mono)] leading-[1.65] text-text-1',
            className,
          )}
        >
          {caption ? (
            <caption
              className={cn(
                'text-[length:var(--text-eyebrow)] leading-none text-text-2 px-3 py-2 text-left tracking-[0.16em] uppercase',
                captionHidden && 'sr-only',
              )}
            >
              {caption}
            </caption>
          ) : null}

          <colgroup>
            {showSeq ? <col style={{ width: '4.5rem' }} /> : null}
            {columns.map((c) => (
              <col key={c.key} style={c.width ? { width: c.width } : undefined} />
            ))}
            {status ? <col style={{ width: '9rem' }} /> : null}
          </colgroup>

          <thead>
            <tr className="border-line-strong border-b">
              {showSeq ? (
                <th
                  scope="col"
                  className={cn(
                    'text-[length:var(--text-eyebrow)] leading-none text-text-2 font-normal tracking-[0.16em] uppercase',
                    cellPad,
                  )}
                >
                  {seqHeader ?? <span className="sr-only">#</span>}
                </th>
              ) : null}
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    'text-[length:var(--text-eyebrow)] leading-none text-text-2 font-normal tracking-[0.16em] whitespace-nowrap uppercase',
                    cellPad,
                    ALIGN[c.align ?? 'left'],
                    c.hideBelow && HIDE[c.hideBelow],
                  )}
                >
                  {c.header}
                </th>
              ))}
              {status ? (
                <th
                  scope="col"
                  className={cn(
                    'text-[length:var(--text-eyebrow)] leading-none text-text-2 text-right font-normal tracking-[0.16em] uppercase',
                    cellPad,
                  )}
                >
                  {statusHeader ?? <span className="sr-only">status</span>}
                </th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => {
              const key = rowKey(row, i)
              const isActive = activeKey !== null && activeKey === key
              const st = status?.(row, i) ?? null
              return (
                <tr
                  key={key}
                  data-row={key}
                  data-active={isActive || undefined}
                  {...(onRowSelect
                    ? {
                        tabIndex: 0,
                        role: 'button' as const,
                        'aria-pressed': isActive,
                        onClick: () => onRowSelect(row, i),
                        onKeyDown: handleKey(row, i),
                      }
                    : null)}
                  className={cn(
                    'border-line border-b last:border-b-0',
                    'transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
                    'data-[active]:bg-crimson-soft data-[active]:text-text-0',
                    onRowSelect &&
                      'hover:bg-bg-2 cursor-pointer focus-visible:outline-offset-[-2px]',
                  )}
                >
                  {showSeq ? (
                    <td
                      className={cn(
                        'text-text-2 text-[length:var(--text-eyebrow)] leading-none tracking-[0.12em] tabular-nums whitespace-nowrap',
                        cellPad,
                      )}
                    >
                      {seqOf(row, i)}
                    </td>
                  ) : null}

                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        'align-top',
                        cellPad,
                        ALIGN[c.align ?? 'left'],
                        (c.mono ?? true) ? 'font-mono' : 'font-sans text-sm',
                        c.hideBelow && HIDE[c.hideBelow],
                        c.className,
                      )}
                    >
                      {c.cell(row, i)}
                    </td>
                  ))}

                  {status ? (
                    <td className={cn('text-right whitespace-nowrap', cellPad)}>
                      {st ? (
                        <span
                          className={cn(
                            'text-[length:var(--text-eyebrow)] leading-none inline-block border px-2 py-1 tracking-[0.16em] uppercase',
                            STATUS_TONE[st.tone ?? 'default'],
                          )}
                        >
                          {st.label}
                        </span>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DataTable
