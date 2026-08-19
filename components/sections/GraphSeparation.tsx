'use client'

/**
 * S7 · AUTHOR GRAPH / RUN GRAPH —— 两个文件，两种语义（CREATIVE §2 转场带）。
 *
 * 节奏定位：**冷却带**。S5→S6 双高潮之后，这一段几乎零动效，
 * 靠**对照式构图**与密排等宽排版撑住——这是它的美学，不是它的偷懒。
 * 乐章 III 的首段，节奏走 `rhythm="movement"`（CREATIVE §2 留白规则），
 * 段内禁止任何 scrub 动画，只有一次性入场 + trace 走线。
 *
 * 对照怎么建立：
 * - **对开页（diptych）**：`.svml` / `.svrun` 左右并置，中间一条 1px 中缝线。
 *   左页向左对齐、右页向右对齐，像一份翻开的校样；两页的版式完全镜像。
 * - **一张图，两种读法**：同一批节点、同一套坐标，切换只改「哪些边还活着」。
 *   作者图 = 全量结构（中性墨线，静止）；运行图 = 本次子路径（crimson + 走线脉冲），
 *   被 Candidate 顶替的 Operation 当场裁成虚线灰。
 * - **Δ / ✓ 读数**：与 S6 同一对记号 —— 作者图 `Δ3 ✓0`，运行图 `Δ1 ✓2`。
 *   全站的隐喻在这里闭环：局部重编译就是这张图被裁剪的结果。
 *
 * 契约与复用：
 * - 数据：`lib/data/architecture.ts` + `lib/data/code-samples.ts`，零 prose 硬编码。
 *   图里的节点名逐字取自 `codeSamples['svrun-candidate']`（真实标识符，非杜撰）。
 * - 组件：`SectionShell` / `DataTable` / `CodeBlock` / `Rule` / `Eyebrow` + `orthPath()`。
 * - 色彩：强调色只有 crimson，且**只出现在运行图一侧**（"这次要跑的"）。
 *   作者图一侧全部中性墨线，两侧靠形态（实线/虚线、实心/描边）区分，不靠第二强调色。
 * - 纯 DOM + SVG，不占用 WebGL 通道。
 */

import { useMemo, useState } from 'react'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { ScrollEdgeStyle, X_SCROLL } from '@/components/ui/ScrollEdge'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Rule } from '@/components/ui/Rule'
import { SectionShell } from '@/components/ui/SectionShell'
import { orthPath, type TracePoint } from '@/components/ui/Trace'
import { useLocale } from '@/hooks/useLocale'
import {
  buildIdentityNote,
  candidateProtocol,
  fileRoles,
  graphsIntro,
  partialExecution,
  type FileRole,
} from '@/lib/data/architecture'
import { codeSamples } from '@/lib/data/code-samples'
import { cn } from '@/lib/utils/cn'
import { hexIndex } from '@/lib/utils/format'

/* ── 纯记号：与 S6 同族，无语言依赖 ────────────────────────── */
const GLYPH_BUILT = 'Δ'
/** 元信息分隔点（排版记号，非文案）。 */
const META_SEP = '·'
const GLYPH_REUSED = '✓'

/* ── 对照的两个文件 ──────────────────────────────────────────
   ext 与 alias 全部来自 fileRoles，代码来自 codeSamples，没有新增文案。 */
const AUTHOR_ROLE = fileRoles.find((r) => r.ext === '.svml') as FileRole
const RUN_ROLE = fileRoles.find((r) => r.ext === '.svrun') as FileRole

type GraphMode = 'author' | 'run'

const MODE_ROLE: Record<GraphMode, FileRole> = {
  author: AUTHOR_ROLE,
  run: RUN_ROLE,
}

/* ═══ 依赖图几何 ════════════════════════════════════════════
   节点标识符逐字取自 codeSamples['svrun-candidate']：
   ./main.svml · presenter.image · hook-take.video · final.video ·
   ./assets/presenter.png · bld_01234567… （与 .svrun 里的写法逐字一致）*/

const VB_W = 750
const VB_H = 236

interface GraphNode {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  /** candidate 节点只在 Run Graph 里出现。 */
  candidate?: boolean
  target?: boolean
  /** 源节点（不是计算节点，不计入 Δ/✓ 读数）。 */
  source?: boolean
}

const NODES: readonly GraphNode[] = [
  { id: 'src', label: './main.svml', x: 8, y: 106, w: 140, h: 44, source: true },
  { id: 'presenter', label: 'presenter.image', x: 286, y: 20, w: 166, h: 44 },
  { id: 'hook', label: 'hook-take.video', x: 286, y: 180, w: 166, h: 44 },
  { id: 'final', label: 'final.video', x: 592, y: 106, w: 150, h: 44, target: true },
  {
    id: 'file-cand',
    label: './assets/presenter.png',
    x: 8,
    y: 24,
    w: 196,
    h: 36,
    candidate: true,
  },
  {
    id: 'record-cand',
    label: 'bld_01234567…',
    x: 8,
    y: 184,
    w: 196,
    h: 36,
    candidate: true,
  },
]

/** 计算节点数（Δ/✓ 读数的分母）。 */
const COMPUTED = NODES.filter((n) => !n.candidate && !n.source).length
const CANDIDATES = NODES.filter((n) => n.candidate).length

/** 两种模式下的 Δ（本次执行）/ ✓（Candidate 复用）读数。 */
const TALLY: Record<GraphMode, { built: number; reused: number }> = {
  author: { built: COMPUTED, reused: 0 },
  run: { built: COMPUTED - CANDIDATES, reused: CANDIDATES },
}

interface GraphEdge {
  id: string
  points: readonly TracePoint[]
  /** author = 展开作者图时的边；candidate = 候选边；out = 两种模式共有的下游边。 */
  kind: 'author' | 'candidate' | 'out'
}

const EDGES: readonly GraphEdge[] = [
  {
    id: 'e-src-presenter',
    kind: 'author',
    points: [
      { x: 148, y: 128 },
      { x: 222, y: 128 },
      { x: 222, y: 42 },
      { x: 286, y: 42 },
    ],
  },
  {
    id: 'e-src-hook',
    kind: 'author',
    points: [
      { x: 148, y: 128 },
      { x: 222, y: 128 },
      { x: 222, y: 202 },
      { x: 286, y: 202 },
    ],
  },
  {
    id: 'e-presenter-final',
    kind: 'out',
    points: [
      { x: 452, y: 42 },
      { x: 522, y: 42 },
      { x: 522, y: 128 },
      { x: 592, y: 128 },
    ],
  },
  {
    id: 'e-hook-final',
    kind: 'out',
    points: [
      { x: 452, y: 202 },
      { x: 522, y: 202 },
      { x: 522, y: 128 },
      { x: 592, y: 128 },
    ],
  },
  {
    id: 'e-file-presenter',
    kind: 'candidate',
    points: [
      { x: 204, y: 42 },
      { x: 286, y: 42 },
    ],
  },
  {
    id: 'e-record-hook',
    kind: 'candidate',
    points: [
      { x: 204, y: 202 },
      { x: 286, y: 202 },
    ],
  },
]

/**
 * 每条边在某个模式下的呈现。
 * **作者图一侧永远中性**（这是全量结构，不是「正在发生的事」）；
 * crimson 只在运行图一侧出现，且只描本次真正走的那条路径。
 */
function edgeState(kind: GraphEdge['kind'], mode: GraphMode) {
  if (kind === 'candidate') {
    return mode === 'run'
      ? { stroke: 'stroke-crimson', opacity: 1, dashed: false, run: true }
      : { stroke: 'stroke-line', opacity: 0, dashed: true, run: false }
  }
  if (kind === 'author') {
    // Run Graph 下这两条 Operation 被 Candidate 顶替 → 当场裁成虚线灰
    return mode === 'run'
      ? { stroke: 'stroke-line', opacity: 0.3, dashed: true, run: false }
      : { stroke: 'stroke-line-strong', opacity: 1, dashed: false, run: false }
  }
  return mode === 'run'
    ? { stroke: 'stroke-crimson', opacity: 1, dashed: false, run: true }
    : { stroke: 'stroke-line-strong', opacity: 1, dashed: false, run: false }
}

function nodeState(node: GraphNode, mode: GraphMode) {
  if (node.candidate) {
    return {
      visible: mode === 'run',
      border: 'stroke-crimson',
      text: 'fill-crimson',
      dashed: true,
      /** 节点角标：这个节点由哪个文件声明。 */
      kicker: RUN_ROLE.ext,
      mark: GLYPH_REUSED,
    }
  }
  if (node.target) {
    return {
      visible: true,
      border: mode === 'run' ? 'stroke-crimson' : 'stroke-ink',
      text: 'fill-text-0',
      dashed: false,
      kicker: mode === 'run' ? RUN_ROLE.ext : AUTHOR_ROLE.ext,
      mark: GLYPH_BUILT,
    }
  }
  return {
    visible: true,
    border: 'stroke-line-strong',
    text: 'fill-text-1',
    dashed: false,
    kicker: AUTHOR_ROLE.ext,
    mark: mode === 'run' && !node.source ? GLYPH_REUSED : node.source ? '' : GLYPH_BUILT,
  }
}

export function GraphSeparation() {
  const { t } = useLocale()
  const [mode, setMode] = useState<GraphMode>('author')

  const authorSample = codeSamples['hero-svml']
  const runSample = codeSamples['svrun-candidate']

  const columns = useMemo<readonly DataTableColumn<FileRole>[]>(
    () => [
      {
        key: 'decides',
        header: 'decides',
        cell: (row) => <span className="text-text-1">{t(row.decides)}</span>,
      },
      {
        key: 'alias',
        header: 'alias',
        align: 'right',
        width: '13rem',
        cell: (row) => (
          <span
            className={cn(
              'text-[length:var(--text-eyebrow)] leading-none inline-block border px-2 py-1 tracking-[0.16em] uppercase',
              // 只有 .svrun（「这次要跑的」）拿 crimson；其余中性。
              row.ext === '.svrun'
                ? 'border-crimson text-crimson'
                : row.ext === '.svml'
                  ? 'border-ink text-text-0'
                  : 'border-line text-text-2',
            )}
          >
            {t(row.alias)}
          </span>
        ),
      },
    ],
    [t],
  )

  const graphLabel = `${MODE_ROLE[mode].ext} — ${t(MODE_ROLE[mode].alias)}`
  const tally = TALLY[mode]

  const panels = [
    { role: AUTHOR_ROLE, sample: authorSample, key: 'author' as const },
    { role: RUN_ROLE, sample: runSample, key: 'run' as const },
  ]

  return (
    <div>
      <ScrollEdgeStyle />
      <SectionShell
        id="graphs"
        sec={7}
        eyebrow={graphsIntro.eyebrow}
        title={t(graphsIntro.title)}
        lead={t(graphsIntro.lead)}
        titleScale="movement"
        transition
        width="shell"
        // 乐章 III BUILD 的首段：movement 档，上方 312px 与转场线一起做乐章边界
        rhythm="movement"
      >
        {/* ── 四文件职责表（档案表格排版）──────────────────── */}
        <DataTable<FileRole>
          columns={columns}
          rows={fileRoles}
          rowKey={(row) => row.ext}
          caption={graphsIntro.eyebrow}
          seq={(row) => <span className="text-text-0">{row.ext}</span>}
          seqHeader="ext"
          minWidth="38rem"
          wrapperClassName="mb-block"
        />

        {/* ═══ 对开页：两个文件并置，版式镜像 ═══════════════════ */}
        <div className="border-line grid border">
          <div className="grid lg:grid-cols-2">
            {panels.map(({ role, sample, key }, i) => {
              const isRun = key === 'run'
              return (
                <div
                  key={role.ext}
                  data-file-panel={key}
                  className={cn(
                    'flex min-w-0 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8',
                    // 中缝：小屏是横线，桌面是竖线
                    i === 1 && 'border-line border-t lg:border-t-0 lg:border-l',
                  )}
                >
                  {/* 文件封面：ext 大字 + 序号，右页整体右对齐（镜像）*/}
                  <div className={cn('flex flex-col gap-3', isRun && 'lg:items-end lg:text-right')}>
                    <span className="font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] text-text-2 uppercase">
                      {hexIndex(i + 1)}
                    </span>
                    <span
                      className={cn(
                        'text-[length:var(--text-h3)] leading-none tracking-[-0.02em] font-semibold',
                        // 负字距会把最后一个字形的行进宽度削掉 0.02em，右对齐时字面
                        // 因此悬挂到对齐边之外、贴死面板内边距，读起来像被切了半笔。
                        // 右页补回这 0.02em（左页左对齐，不受影响）。
                        isRun ? 'text-crimson lg:pe-[0.02em]' : 'text-text-0',
                      )}
                    >
                      {role.ext}
                    </span>
                    <Rule
                      variant="np"
                      tick={isRun ? 'l' : 'r'}
                      className={cn('w-full max-w-[12rem]', isRun && 'lg:ml-auto')}
                    />
                    <Eyebrow
                      variant="dot"
                      tone={isRun ? 'accent' : 'muted'}
                      className={cn(
                        'max-w-full whitespace-normal',
                        isRun ? 'lg:flex-row-reverse lg:items-start' : 'items-start',
                      )}
                    >
                      {t(role.alias)}
                    </Eyebrow>
                    <p
                      className={cn(
                        'text-[length:var(--text-body)] leading-[1.7] text-text-1',
                        isRun && 'lg:text-right',
                      )}
                    >
                      {t(role.decides)}
                    </p>
                  </div>

                  {/*
                    对开页上放的是**完整的两个文件**，不是节选：两份样例都已压到
                    52 列以内（见 code-samples.ts 的行宽预算注释），半栏装得下，
                    所以这里既不设 maxHeight 也不设 maxLines —— 校样上不该出现
                    「盒子里再套一个滚动条」。行数写进 meta 槽，读者数得出来。
                  */}
                  <CodeBlock
                    lines={sample.lines}
                    lang={sample.lang === 'svrun' ? 'svrun' : 'svml'}
                    filename={sample.filename}
                    meta={`${sample.meta} ${META_SEP} ${sample.lines.length} lines`}
                    className="flex-1"
                  />
                </div>
              )
            })}
          </div>

          {/* ── 同一张图，两种读法 ─────────────────────────── */}
          <div className="border-line border-t">
            <div className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-3 py-2">
              <div
                role="group"
                aria-label={graphsIntro.eyebrow}
                className="flex flex-wrap items-center gap-2"
              >
                {(['author', 'run'] as const).map((m) => {
                  const active = mode === m
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setMode(m)}
                      className={cn(
                        'font-mono text-[length:var(--text-mono)] leading-none',
                        'min-h-11 border px-3 tracking-[0.06em]',
                        'transition-colors duration-[var(--dur-mid)] ease-[var(--ease-out-expo)]',
                        // 作者图 = 墨（全量结构）；运行图 = crimson（这次要跑的）
                        active && m === 'author' && 'border-ink bg-ink text-paper',
                        active && m === 'run' && 'border-crimson bg-crimson text-on-crimson',
                        !active &&
                          'border-line text-text-1 hover:border-line-strong hover:text-text-0',
                      )}
                    >
                      <span className="font-medium">{MODE_ROLE[m].ext}</span>
                      <span className="ml-2 opacity-80">{t(MODE_ROLE[m].alias)}</span>
                    </button>
                  )
                })}
              </div>

              {/* Δ / ✓ 读数：与 S6 同一对记号 —— 局部重编译在图上的样子 */}
              <span className="font-mono text-[length:var(--text-eyebrow)] leading-none tracking-[0.16em] tabular-nums flex items-center gap-4 uppercase">
                <span
                  className={cn(
                    'transition-colors duration-[var(--dur-mid)]',
                    mode === 'run' ? 'text-text-2' : 'text-text-0',
                  )}
                >
                  {GLYPH_BUILT} {tally.built}
                </span>
                <span
                  className={cn(
                    'transition-colors duration-[var(--dur-mid)]',
                    mode === 'run' && tally.reused > 0 ? 'text-crimson' : 'text-text-2',
                  )}
                >
                  {GLYPH_REUSED} {tally.reused}
                </span>
              </span>
            </div>

            {/* body 绝不横滚：图自己滚，且用与代码块同一套截断语汇（ScrollEdge） */}
            <div className={cn('relative w-full overflow-x-auto px-3 py-6', X_SCROLL)}>
              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                role="img"
                aria-label={graphLabel}
                className="mx-auto block h-auto w-full min-w-[44rem] max-w-[52rem] overflow-visible"
                fill="none"
              >
                <title>{graphLabel}</title>

                {EDGES.map((edge) => {
                  const s = edgeState(edge.kind, mode)
                  const d = orthPath(edge.points, 4)
                  return (
                    <g
                      key={edge.id}
                      style={{ opacity: s.opacity }}
                      className="transition-opacity duration-[var(--dur-mid)] ease-[var(--ease-out-expo)]"
                    >
                      <path
                        d={d}
                        strokeWidth={1}
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                        strokeDasharray={s.dashed ? '3 4' : undefined}
                        className={cn(
                          s.stroke,
                          'transition-[stroke] duration-[var(--dur-mid)] ease-[var(--ease-out-expo)]',
                        )}
                      />
                      {/*
                        P2-6：这里原本挂着 `.trace-run`（globals.css，已随本次
                        收口一并删除，无其他消费方）—— 一条 3.2s 无限循环的
                        跑马灯。它想说的是「这条边这次真的走了」，可无限循环说的是
                        「一直在走」，而且桌面端只要这一段在视口内画面就永远有东西在动。
                        改成静态加粗：走过的边比没走的粗 0.5px，差值一眼可读，且是
                        **状态**不是节拍。
                      */}
                      {s.run ? (
                        <path
                          d={d}
                          strokeWidth={1.5}
                          vectorEffect="non-scaling-stroke"
                          strokeLinejoin="round"
                          className="stroke-crimson"
                        />
                      ) : null}
                    </g>
                  )
                })}

                {NODES.map((node) => {
                  const s = nodeState(node, mode)
                  return (
                    <g
                      key={node.id}
                      style={{ opacity: s.visible ? 1 : 0 }}
                      className="transition-opacity duration-[var(--dur-mid)] ease-[var(--ease-out-expo)]"
                    >
                      <rect
                        x={node.x}
                        y={node.y}
                        width={node.w}
                        height={node.h}
                        rx={0}
                        strokeWidth={1}
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray={s.dashed ? '3 4' : undefined}
                        className={cn(
                          'fill-bg-1',
                          s.border,
                          'transition-[stroke] duration-[var(--dur-mid)] ease-[var(--ease-out-expo)]',
                        )}
                      />
                      {/* 角标：这个节点由哪个文件声明（两种语义的证据）*/}
                      <text
                        x={node.x + 12}
                        y={node.y - 6}
                        className="fill-text-2 font-mono"
                        style={{ fontSize: 9, letterSpacing: '0.16em' }}
                      >
                        {s.kicker}
                      </text>
                      <text
                        x={node.x + 12}
                        y={node.y + node.h / 2 + 4}
                        className={cn('font-mono', s.text)}
                        style={{ fontSize: 12, letterSpacing: '0.02em' }}
                      >
                        {node.label}
                      </text>
                      {s.mark ? (
                        <text
                          x={node.x + node.w - 10}
                          y={node.y + node.h / 2 + 4}
                          textAnchor="end"
                          className={cn(
                            'font-mono',
                            s.mark === GLYPH_REUSED && mode === 'run'
                              ? 'fill-crimson'
                              : 'fill-text-2',
                          )}
                          style={{ fontSize: 11 }}
                        >
                          {s.mark}
                        </text>
                      ) : null}
                    </g>
                  )
                })}
              </svg>
            </div>

            <div className="border-line border-t px-3 py-3">
              <p className="text-[length:var(--text-body)] leading-[1.7] text-text-1">
                {t(partialExecution)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Candidate 候选协议 · Satisfaction 边 ───────────── */}
        <div className="mt-block flex flex-col gap-5">
          <div className="flex min-w-0 max-w-prose flex-col gap-5">
            {/* Eyebrow 默认 whitespace-nowrap；这条标题较长，移动端必须可换行 */}
            <Eyebrow
              variant="dot"
              tone="accent"
              className="max-w-full items-start whitespace-normal"
            >
              {t(candidateProtocol.title)}
            </Eyebrow>
            <p className="text-[length:var(--text-body)] leading-[1.7] text-text-1">
              {t(candidateProtocol.body)}
            </p>
            <Rule variant="trace" />
            <p className="text-[length:var(--text-body)] leading-[1.7] text-text-1 italic">
              {t(candidateProtocol.duckAnalogy)}
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <p className="text-[length:var(--text-body)] leading-[1.7] text-text-1 max-w-prose">
              {t(buildIdentityNote)}
            </p>
            <ul className="border-line flex flex-col border">
              {candidateProtocol.cli.map((line) => (
                <li
                  key={line}
                  className={cn(
                    'border-line font-mono text-[length:var(--text-mono)] leading-[1.65] text-text-1',
                    'overflow-x-auto border-b px-3 py-2 whitespace-pre last:border-b-0',
                    X_SCROLL,
                  )}
                >
                  <span className="text-text-2 select-none">$ </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SectionShell>
    </div>
  )
}

export default GraphSeparation
