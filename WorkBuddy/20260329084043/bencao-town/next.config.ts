import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 图片优化 - Cloudflare Workers 使用内置图片优化
  images: {
    unoptimized: true,
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
};

export default nextConfig;

// OpenNext Cloudflare 开发集成
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
