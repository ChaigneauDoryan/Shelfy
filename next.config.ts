import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'camrppywkhkihnrggzrv.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
