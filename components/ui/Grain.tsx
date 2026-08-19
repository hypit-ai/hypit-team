/**
 * 纸张颗粒覆盖层（BRAND.md §3.2）。
 *
 * fixed inset-0 / z-45 / pointer-events:none。
 * light: mix-blend-mode multiply, opacity .42
 * dark:  mix-blend-mode overlay,  opacity .2
 * 具体数值由 globals.css 的 `--grain-op` / `--grain-blend` 随主题切换。
 *
 * 这是「纸」质感的唯一来源——缺了整个设计就塌。
 * 在 app/layout.tsx 的 <body> 内挂一次即可（全局单例）。
 * 无 hooks，可作 RSC。
 */
export function Grain({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={className ? `np-grain ${className}` : 'np-grain'}
    />
  )
}

export default Grain
