import type { NextConfig } from 'next';

// Ironbark is a client-only game: `next build` exports static files to out/.
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
