import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'img1.kakaocdn.net',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 't1.kakaocdn.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
