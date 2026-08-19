'use client'

/**
 * S4 · FOUR CONSTRUCTS —— Script 的四条语法（CREATIVE.md M5，强度 2）。
 *
 * 这一段是「读」乐章的收尾，**动效预算为零**。节奏走 `rhythm="flow"`，
 * 段内禁止任何 scrub 或进场动画 —— 留白是给 S5/S6 双高潮让位的（CREATIVE §2 留白规则）。
 *
 * 动效：
 * - **无进场动画**：四张卡直接在位渲染。这一段的作用是安静，不是再演一次揭幕。
 * - 展开更长代码示例：`<details>` 语义 + grid-template-rows 高度过渡；
 *   两段式 state 保证「打开」这一帧也能跑出过渡（原生 details 关闭时子节点 display:none）。
 *   summary 是 `min-h-11`（44px 触摸目标）。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { SectionShell } from '@/components/ui/SectionShell'
import { Card } from '@/components/ui/Card'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { useLocale } from '@/hooks/useLocale'
import { constructs, constructsIntro, type Construct } from '@/lib/data/constructs'
import { DUR_MS } from '@/lib/motion/tokens'
import { cn } from '@/lib/utils/cn'

export interface FourConstructsProps {
  className?: string
}

export function FourConstructs({ className }: FourConstructsProps) {
  const { t } = useLocale()

  return (
    <SectionShell
      id="constructs"
      sec={4}
      title={t(constructsIntro.title)}
      lead={t(constructsIntro.sub)}
      width="shell"
      // 「读」乐章的收尾：普通阅读段。安静由前一段（招牌）的 tail 与本段的
      // flow 共同给出 192px 的边界，不靠把自己撑空来制造。
      rhythm="flow"
      className={className}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {constructs.map((construct) => (
          <ConstructCard key={construct.id} construct={construct} />
        ))}
      </div>
    </SectionShell>
  )
}

interface ConstructCardProps {
  construct: Construct
}

function ConstructCard({ construct }: ConstructCardProps) {
  const { t } = useLocale()
  /** details 的 open 属性：先挂上再放动画，关闭时延后卸载。 */
  const [mounted, setMounted] = useState(false)
  /** 视觉展开态：驱动 grid-template-rows 过渡。 */
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const frame = useRef<number | null>(null)

  const toggle = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current)
      frame.current = null
    }
    if (!open) {
      setMounted(true)
      frame.current = requestAnimationFrame(() => {
        frame.current = null
        setOpen(true)
      })
    } else {
      setOpen(false)
      timer.current = setTimeout(() => {
        timer.current = null
        setMounted(false)
      }, DUR_MS.mid)
    }
  }, [open])

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    },
    [],
  )

  return (
    <div data-construct className="relative flex min-w-0">
      {/* 常驻顶轨：hover 时 Card 自带的 crimson 轨道盖在它上面。 */}
      <span
        data-track
        aria-hidden="true"
        className="bg-rule pointer-events-none absolute inset-x-0 top-0 z-0 h-px origin-left"
      />
      <Card
        as="article"
        index={construct.index}
        title={construct.name}
        className="h-full w-full"
        bodyClassName="flex flex-col gap-4"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-ink font-mono text-[length:var(--text-mono)] leading-[1.65] break-words">
            {construct.syntax}
          </p>
          {construct.formalName ? (
            <p className="text-muted font-mono text-[length:var(--text-eyebrow)] tracking-[0.16em] uppercase">
              {construct.formalName}
            </p>
          ) : null}
        </div>

        <p className="text-muted min-w-0 text-sm">{t(construct.painPoint)}</p>

        <details
          open={mounted}
          className="mt-auto min-w-0"
          onToggle={(event) => {
            // 键盘/原生触发时保持两个 state 同步。
            if (event.currentTarget.open && !open) setOpen(true)
          }}
        >
          <summary
            onClick={(event) => {
              event.preventDefault()
              toggle()
            }}
            className={cn(
              'border-rule text-muted hover:text-crimson flex min-h-11 cursor-pointer list-none items-center gap-2 border-t',
              'font-mono text-[length:var(--text-eyebrow)] tracking-[0.16em] uppercase',
              'transition-colors duration-[var(--dur-base)] ease-[var(--ease-out-quart)]',
              '[&::-webkit-details-marker]:hidden',
            )}
          >
            <span aria-hidden="true" className="inline-block w-[1ch]">
              {open ? '−' : '+'}
            </span>
            <span className="truncate">{construct.name}</span>
          </summary>

          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-[var(--dur-mid)] ease-[var(--ease-out-quart)]',
              open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="flex flex-col gap-3 pt-3">
                <CodeBlock
                  code={construct.expanded.code}
                  lang="svml"
                  showLineNumbers={false}
                  dense
                  ariaLabel={`${construct.name} — ${construct.syntax}`}
                />
                <p className="text-muted text-sm">{t(construct.expanded.note)}</p>
              </div>
            </div>
          </div>
        </details>
      </Card>
    </div>
  )
}

export default FourConstructs
