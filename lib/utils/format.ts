/**
 * 纯函数格式化工具。全部与 locale 无关（用 'en-US' 固定分隔符），
 * 保证 SSR / CSR 输出一致，杜绝 hydration 抖动。
 */

const NUM = new Intl.NumberFormat('en-US')

/** 1234 → "1,234" */
export function formatNumber(value: number): string {
  return NUM.format(value)
}

/** 数字补零：pad(7, 2) → "07"；pad(417, 4) → "0417" */
export function pad(value: number, width = 2): string {
  return Math.trunc(Math.abs(value)).toString().padStart(width, '0')
}

/** 序号标签：hexIndex(1) → "0x01" */
export function hexIndex(value: number, width = 2): string {
  return `0x${Math.trunc(value).toString(16).toUpperCase().padStart(width, '0')}`
}

/** section 编号：secLabel(7) → "SEC/07" */
export function secLabel(value: number, width = 2): string {
  return `SEC/${pad(value, width)}`
}

/** HUD 帧号：frameLabel(417, 1200) → "FRAME 0417 / 1200" */
export function frameLabel(frame: number, total: number): string {
  const width = Math.max(4, String(Math.trunc(total)).length)
  return `FRAME ${pad(frame, width)} / ${pad(total, width)}`
}

/** 滚动进度 0..1 → 帧号（配合 frameLabel 使用）。 */
export function progressToFrame(progress: number, totalFrames: number): number {
  const p = clamp01(progress)
  return Math.round(p * totalFrames)
}

/** 时钟：formatClock(new Date()) → "22:35:07" */
export function formatClock(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** 毫秒 → "41ms" / "1.4s" */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  const s = ms / 1000
  return `${s < 10 ? s.toFixed(1) : Math.round(s)}s`
}

/** 秒 → "1.4s"（保留一位小数，整数不带小数点） */
export function formatSeconds(seconds: number): string {
  return Number.isInteger(seconds) ? `${seconds}s` : `${seconds.toFixed(1)}s`
}

/** 0.8 → "Δ 0.8%"（HUD 用） */
export function formatDelta(pct: number): string {
  return `Δ ${pct.toFixed(1)}%`
}

/** 百分比：0.235 → "24%" */
export function formatPercent(ratio: number, digits = 0): string {
  return `${(clamp01(ratio) * 100).toFixed(digits)}%`
}

/** ISO 日期串 → "2026.08.17"（mono 时间线用，不依赖运行时时区） */
export function formatLogDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return d ? `${y}.${m}.${d}` : iso
}

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

/** 线性映射并夹紧到 0..1（ScrollTrigger 区间换算常用）。 */
export function mapRange01(value: number, inMin: number, inMax: number): number {
  if (inMax === inMin) return 0
  return clamp01((value - inMin) / (inMax - inMin))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
