import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['images.unsplash.com', 'ui-avatars.com', 'randomuser.me'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  experimental: {
    serverMinification: false,
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
