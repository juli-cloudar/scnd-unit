import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // output: 'export' wurde entfernt, damit API-Routen dynamisch bleiben
};

export default nextConfig;


