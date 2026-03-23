import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'export', // ❌ diese Zeile muss entfernt oder auskommentiert werden
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['192.168.2.55'],
};

export default nextConfig;
