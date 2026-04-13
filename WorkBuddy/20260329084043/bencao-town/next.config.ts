import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 图片优化 - Cloudflare Pages 兼容配置
  images: {
    unoptimized: true, // Cloudflare Pages 有自己的图片优化，禁用 Next.js 图片优化
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.googleapis.com',
      },
    ],
  },

  // PWA 相关头部
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // 重定向：旧路径兼容
  async redirects() {
    return [
      {
        source: '/auth/confirm',
        destination: '/auth/callback',
        permanent: true,
      },
    ];
  },

  // Cloudflare Pages 输出配置（可选，优化构建大小）
  output: 'standalone',
};

export default nextConfig;
