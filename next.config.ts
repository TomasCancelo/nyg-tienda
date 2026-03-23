import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thqmpndhlqknwactxcik.supabase.co",
      },
    ],
  },
};

export default nextConfig;
