/**
 * THE IMPRESSION · 片元着色器（CREATIVE §5.1）。
 *
 * 一块半调网点版：网点**数量不变、位置不变**，只有直径在变——
 * `uProgress` 0 时每个网点的直径拼出 `.svml` 源码字形，1 时同一批网点
 * 拼出一帧画面的灰阶。中间没有导出、没有第二种东西。
 *
 * 三条硬约束直接写在算法里：
 *   · 只画墨点，其余 `discard` —— 永远不会输出一块接近纸色的实底（历史缺陷 #1/#3）
 *   · `sqrt(v) * 0.5 * uDotScale`（uDotScale < 1）—— 最密处也留白，不糊成灰带
 *   · 颜色只有 uInk / uCrimson，全部来自 CSS 变量 —— shader 内零硬编码 RGB
 *
 * 没有 uTime：uProgress 不变时这就是完全静止的一帧。
 */
export const impressionFrag = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform float uProgress;    // 0..1，ScrollTrigger scrub 唯一驱动量
uniform float uDotPitch;    // 网点间距（CSS 逻辑像素）：桌面 6 / 移动 11
uniform float uDotScale;    // 网点直径系数，< 1 保证留白
uniform float uOpacity;     // light .88 / dark .72
uniform float uSeed;        // 相位种子（构建期常量，不是时间）
uniform float uHasAtlas;    // 字形图集是否就绪（未就绪走程序化兜底）
uniform float uAA;          // 抗锯齿半径，单位=格
uniform vec2  uResolution;  // canvas 逻辑尺寸
uniform vec2  uAtlasScale;  // 图集采样窗口缩放（保证字形不拉伸）
uniform vec2  uAtlasOffset;
uniform vec3  uInk;
uniform vec3  uCrimson;
uniform sampler2D uAtlas;

float hash21(vec2 p) {
  vec2 q = fract(p * vec2(123.34, 456.21));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
}

/* 图集未就绪时的程序化等宽字符网格：形态与真源码一致（长短不一的笔画行）。 */
float glyphFallback(vec2 uv) {
  vec2 c = vec2(uv.x * 26.0, uv.y * 9.0);
  vec2 id = floor(c);
  vec2 f = fract(c);
  float on = step(0.34, hash21(id + uSeed));
  float w = 0.28 + 0.58 * hash21(id.yx + 7.13);
  return on * step(f.x, w) * step(0.30, f.y) * step(f.y, 0.78);
}

float glyphValue(vec2 uv) {
  if (uHasAtlas < 0.5) return glyphFallback(uv);
  return texture2D(uAtlas, uv * uAtlasScale + uAtlasOffset).r;
}

float blob(vec2 p, vec2 c, vec2 r) {
  vec2 d = (p - c) / r;
  return 1.0 - smoothstep(0.80, 1.0, dot(d, d));
}

/* 画面态：程序化 SDF——人像剪影 + 两条帧格线 + 两侧齿孔。零贴图、零网络成本。 */
float framePattern(vec2 uv) {
  float v = 0.08 + 0.13 * (1.0 - uv.y);                        // 背景灰阶
  v += 0.60 * blob(uv, vec2(0.50, 0.585), vec2(0.115, 0.150)); // 头
  v += 0.52 * blob(uv, vec2(0.50, 0.150), vec2(0.300, 0.215)); // 肩

  float bars = step(abs(uv.y - 0.955), 0.010) + step(abs(uv.y - 0.045), 0.010);
  v += 0.78 * bars;                                            // 帧格上下横线

  float edge = step(uv.x, 0.038) + step(0.962, uv.x);
  float holes = step(fract(uv.y * 14.0), 0.50);
  v += 0.72 * edge * holes;                                    // 两侧齿孔

  return clamp(v, 0.0, 1.0);
}

void main() {
  vec2 cell = (vUv * uResolution) / uDotPitch;
  vec2 id = floor(cell);
  vec2 local = fract(cell) - 0.5;
  vec2 cuv = (id + 0.5) * uDotPitch / uResolution;

  // 每格一点相位偏移：翻面不是整齐划一的一刀切
  float p = clamp((uProgress - hash21(id + uSeed) * 0.22) / 0.78, 0.0, 1.0);
  float v = mix(glyphValue(cuv), framePattern(cuv), smoothstep(0.0, 1.0, p));

  float r = sqrt(clamp(v, 0.0, 1.0)) * 0.5 * uDotScale;
  float a = 1.0 - smoothstep(r - uAA, r + uAA, length(local));
  if (a < 0.004) discard;

  // crimson 只染 < 4% 的格子，其余全是墨色
  float accent = step(0.962, hash21(id * 1.7 + uSeed + 13.0));
  gl_FragColor = vec4(mix(uInk, uCrimson, accent), a * uOpacity);
}
`
