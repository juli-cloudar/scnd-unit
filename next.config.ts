import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // output: 'export',  ← diese Zeile entfernen
};

export default nextConfig;

