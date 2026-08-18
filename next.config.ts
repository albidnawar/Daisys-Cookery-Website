import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Admin-uploaded cake/review/banner photos live in Supabase Storage
    // (see src/app/api/admin/upload/route.ts) — next/image refuses to
    // optimize a remote host unless it's explicitly allow-listed here.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
