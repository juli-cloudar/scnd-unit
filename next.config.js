/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.2.55'],
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
