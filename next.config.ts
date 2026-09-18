import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

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

// org/project/authToken read from SENTRY_ORG / SENTRY_PROJECT /
// SENTRY_AUTH_TOKEN — unset until the Sentry account exists, in which case
// the plugin skips source-map upload with a warning rather than failing
// the build (same "fail open" posture as sentry.*.config.ts's dsn).
export default withSentryConfig(nextConfig, {
  silent: true,
  widenClientFileUpload: true,
});
