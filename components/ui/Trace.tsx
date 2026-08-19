import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface TracePoint {
  x: number
  y: number
}

export type TraceTone = 'line' | 'accent' | 'danger' | 'muted'

export interface TraceProps {
  /** 折线顶点（viewBox 坐标系）。至少两个点。 */
  points: readonly TracePoint[]
  /** viewBox 尺寸。默认由 points 的包围盒推导。 */
  width?: number
  height?: number
  /** 直角处的圆角半径，上限 4px（§4.1 无圆角 >4px）。 */
  radius?: number
  strokeWidth?: number
  tone?: TraceTone
  /** 虚线（复用节点/未激活路径）。 */
  dashed?: boolean
  /** 激活态：加粗 + 换 carbide。 */
  active?: boolean
  /** 两端画 4px 方块节点。 */
  nodes?: boolean
  /** 有意义时传 label（渲染 <title>）；否则整块 aria-hidden。 */
  label?: ReactNode
  className?: string
  /** 供 GSAP 选中的 data 属性值。 */
  id?: string
}

const TONE: Record<TraceTone, string> = {
  line: 'stroke-line-strong',
  accent: 'stroke-carbide',
  danger: 'stroke-fuse',
  muted: 'stroke-line',
}

const NODE_TONE: Record<TraceTone, string> = {
  line: 'fill-line-strong',
  accent: 'fill-carbide',
  danger: 'fill-fuse',
  muted: 'fill-line',
}

/** 折线 → 带圆角的直角路径 d。radius 会被夹到 [0,4] 且不超过相邻线段一半。 */
export function orthPath(points: readonly TracePoint[], radius = 3): string {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  const r = Math.max(0, Math.min(4, radius))
  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points[i - 1]
    const cur = points[i]
    const next = points[i + 1]
    const inLen = Math.hypot(cur.x - prev.x, cur.y - prev.y)
    const outLen = Math.hypot(next.x - cur.x, next.y - cur.y)
    const rr = Math.min(r, inLen / 2, outLen / 2)
    if (rr <= 0.01) {
      d += ` L ${cur.x} ${cur.y}`
      continue
    }
    const inUx = (cur.x - prev.x) / (inLen || 1)
    const inUy = (cur.y - prev.y) / (inLen || 1)
    const outUx = (next.x - cur.x) / (outLen || 1)
    const outUy = (next.y - cur.y) / (outLen || 1)
    const a = { x: cur.x - inUx * rr, y: cur.y - inUy * rr }
    const b = { x: cur.x + outUx * rr, y: cur.y + outUy * rr }
    d += ` L ${round(a.x)} ${round(a.y)} Q ${cur.x} ${cur.y} ${round(b.x)} ${round(b.y)}`
  }

  const last = points[points.length - 1]
  d += ` L ${last.x} ${last.y}`
  return d
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * 生成两点之间的直角走线（曼哈顿路由）。
 * axis='h' → 先横后纵；axis='v' → 先纵后横。
 */
export function elbow(
  from: TracePoint,
  to: TracePoint,
  axis: 'h' | 'v' = 'h',
): TracePoint[] {
  if (from.x === to.x || from.y === to.y) return [from, to]
  const mid: TracePoint = axis === 'h' ? { x: to.x, y: from.y } : { x: from.x, y: to.y }
  return [from, mid, to]
}

/** 生成带中段的 Z 形走线（总线式布线，避免贴边）。 */
export function zRoute(
  from: TracePoint,
  to: TracePoint,
  atRatio = 0.5,
  axis: 'h' | 'v' = 'h',
): TracePoint[] {
  if (axis === 'h') {
    const mx = from.x + (to.x - from.x) * atRatio
    return [from, { x: mx, y: from.y }, { x: mx, y: to.y }, to]
  }
  const my = from.y + (to.y - from.y) * atRatio
  return [from, { x: from.x, y: my }, { x: to.x, y: my }, to]
}

/**
 * SVG 直角走线（蓝图 §7 T2 / S7 依赖图）。
 * 纯 SVG、无 JS、**无动画**：走线是一张接线图，不是一条正在传输的管道。
 * 早先叠了一层 3.2s 无限跑马灯脉冲，它既不表示进度也不表示状态，只是让画面里
 * 永远有东西在动 —— 静态虚线已经把「这是一条走线」说完了。
 */
export function Trace({
  points,
  width,
  height,
  radius = 3,
  strokeWidth = 1,
  tone = 'line',
  dashed = false,
  active = false,
  nodes = false,
  label,
  className,
  id,
}: TraceProps) {
  if (points.length < 2) return null

  const maxX = width ?? Math.max(...points.map((p) => p.x)) + strokeWidth
  const maxY = height ?? Math.max(...points.map((p) => p.y)) + strokeWidth
  const d = orthPath(points, radius)
  const first = points[0]
  const last = points[points.length - 1]
  const effTone: TraceTone = active ? 'accent' : tone

  return (
    <svg
      data-trace={id}
      viewBox={`0 0 ${maxX} ${maxY}`}
      preserveAspectRatio="none"
      fill="none"
      role={label ? 'img' : 'presentation'}
      aria-hidden={label ? undefined : 'true'}
      className={cn('pointer-events-none block h-full w-full overflow-visible', className)}
    >
      {label ? <title>{label}</title> : null}
      {/* 底线：始终可见 */}
      <path
        d={d}
        strokeWidth={active ? strokeWidth + 0.5 : strokeWidth}
        strokeLinecap="butt"
        strokeLinejoin="round"
        strokeDasharray={dashed ? '3 4' : undefined}
        className={cn(
          TONE[effTone],
          'transition-[stroke,stroke-width] duration-[var(--dur-mid)] ease-[var(--ease-out-expo)]',
          !active && tone === 'muted' && 'opacity-60',
        )}
      />
      {nodes ? (
        <>
          <rect
            x={first.x - 2}
            y={first.y - 2}
            width={4}
            height={4}
            className={NODE_TONE[effTone]}
          />
          <rect
            x={last.x - 2}
            y={last.y - 2}
            width={4}
            height={4}
            className={NODE_TONE[effTone]}
          />
        </>
      ) : null}
    </svg>
  )
}

export default Trace
