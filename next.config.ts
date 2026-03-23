import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.2.55'],
  images: { unoptimized: true },
};

export default nextConfig;
