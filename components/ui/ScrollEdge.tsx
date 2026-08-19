/**
 * 截断语汇 —— 全站**唯一**的「这里还有内容」记号。
 *
 * 为什么要单独一份：S7 一段之内曾经并存三套互不相干的横滚处理
 *  ① CodeBlock 用背景渐变画「纸边墨影」（Komarov 的 scroll-shadow 两层法）
 *  ② 依赖图面板 `overflow-x-auto` 裸奔，什么提示都没有
 *  ③ CLI 行 `overflow-x-auto` 同样裸奔
 * 其中 ① 从原理上就不可能成立：`background` 画在 `<code>` 文字**背后**，
 * 遮片再厚也只是把纸染淡，字形本身仍被 `overflow` 在某个像素上齐刷刷切断——
 * 屏幕上读起来是「渲染坏了」，不是「右边还有」。
 *
 * 这里换成 `mask-image`：遮罩作用于**内容**，最后一列字形真的会淡出去。
 * 遮罩定位区是元素的边框盒（遮罩没有 `attachment`，天然钉在可视边缘不随内容滚动），
 * 所以它始终描的是「可视窗口的边」，而不是「内容的边」。
 *
 * 两端各自的宽度是两个已注册的自定义属性，由 **scroll-driven animation** 驱动：
 * 滚到最左时左端渐隐宽度为 0（左边没有更多了），滚到最右时右端归 0。
 * 不需要一行 JS，也不需要量任何布局。不支持 `scroll()` 时间线的浏览器
 * 退回静态形态：末端常驻一道渐隐——代价只是滚到尽头时末字符略淡，
 * 仍然远好过硬切。`prefers-reduced-motion` 下也走这个静态形态：globals 在该媒体
 * 查询里对 `*` 强制 `animation-duration: var(--dur-fast)` 与
 * `animation-iteration-count: 1`，滚动时间线被按时间重解释后会停在某个中间态，
 * 渐隐宽度就与滚动位置脱钩了。与其让它错，不如让它静止。
 *
 * 用法：容器加 `X_SCROLL`（横向）/ `Y_SCROLL`（纵向），并在同一棵树里渲染一次
 * `<ScrollEdgeStyle />`。`<style href precedence>` 由 React 19 提升并按 href 去重，
 * 挂多少次都只输出一份。
 */

/** 横向可滚容器：右端（滚动后左端亦然）渐隐。 */
export const X_SCROLL = 'nrt-xfade'
/** 纵向可滚容器：下端（滚动后上端亦然）渐隐。 */
export const Y_SCROLL = 'nrt-yfade'

/** 渐隐带宽度：横向 34px ≈ 4 个等宽字符，够读出「字在淡出」而不是「字没画完」。 */
const CSS = `
@property --nrt-xf-s { syntax: "<length>"; inherits: false; initial-value: 0px; }
@property --nrt-xf-e { syntax: "<length>"; inherits: false; initial-value: 34px; }
@property --nrt-yf-s { syntax: "<length>"; inherits: false; initial-value: 0px; }
@property --nrt-yf-e { syntax: "<length>"; inherits: false; initial-value: 26px; }

.nrt-xfade {
  mask-image: linear-gradient(
    to right,
    transparent 0,
    #000 var(--nrt-xf-s),
    #000 calc(100% - var(--nrt-xf-e)),
    transparent 100%
  );
}
.nrt-yfade {
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--nrt-yf-s),
    #000 calc(100% - var(--nrt-yf-e)),
    transparent 100%
  );
}
.nrt-xfade.nrt-yfade {
  mask-image:
    linear-gradient(
      to right,
      transparent 0,
      #000 var(--nrt-xf-s),
      #000 calc(100% - var(--nrt-xf-e)),
      transparent 100%
    ),
    linear-gradient(
      to bottom,
      transparent 0,
      #000 var(--nrt-yf-s),
      #000 calc(100% - var(--nrt-yf-e)),
      transparent 100%
    );
  mask-composite: intersect;
}

/* 焦点环默认 outline-offset:3px，画在边框盒之外会被遮罩连根裁掉。
   收成内描边，键盘可达性不受截断语汇影响。 */
.nrt-xfade:focus-visible,
.nrt-yfade:focus-visible {
  outline-offset: -3px;
}

@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: scroll(self inline)) {
    .nrt-xfade {
      animation: nrt-xfade linear both;
      animation-timeline: scroll(self inline);
    }
  }
  @supports (animation-timeline: scroll(self block)) {
    .nrt-yfade {
      animation: nrt-yfade linear both;
      animation-timeline: scroll(self block);
    }
    .nrt-xfade.nrt-yfade {
      animation:
        nrt-xfade linear both,
        nrt-yfade linear both;
      animation-timeline: scroll(self inline), scroll(self block);
    }
  }
}

@keyframes nrt-xfade {
  from { --nrt-xf-s: 0px; --nrt-xf-e: 34px; }
  to { --nrt-xf-s: 34px; --nrt-xf-e: 0px; }
}
@keyframes nrt-yfade {
  from { --nrt-yf-s: 0px; --nrt-yf-e: 26px; }
  to { --nrt-yf-s: 26px; --nrt-yf-e: 0px; }
}
`

export function ScrollEdgeStyle() {
  return (
    <style href="nrt-scroll-edge" precedence="default">
      {CSS}
    </style>
  )
}

export default ScrollEdgeStyle
