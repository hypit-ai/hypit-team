/**
 * THE IMPRESSION · 顶点着色器。
 *
 * 一个铺满画布的 [-1,1] 全屏四边形，**不乘任何矩阵**——
 * 场景与相机无关，永远严丝合缝贴在 canvas 的 rect 上，
 * 不可能因为相机/投影算错而漂到别的 section 上去（历史缺陷 #2）。
 */
export const impressionVert = /* glsl */ `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`
