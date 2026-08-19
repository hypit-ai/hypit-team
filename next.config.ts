import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'video.wjsphy.top',
        port: '',
        pathname: '/hypit-team/**',
        search: '',
      },
    ],
  },
  experimental: {
    // 首屏 JS 预算 ≤115KB gzip（蓝图 §5.6）：按需 tree-shake 大包
    optimizePackageImports: ['@react-three/drei', 'motion'],
  },
}

export default nextConfig
