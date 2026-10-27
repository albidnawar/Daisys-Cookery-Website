import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Netlify sets COMMIT_REF (the deploy's git SHA) at build time — without
  // this, a browser tab left open across a deploy can issue a client-side
  // navigation (a Link click, router.refresh()) carrying stale,
  // version-skewed RSC data the new server build doesn't recognize, which
  // surfaces as "InvariantError: Expected RSC response, got text/plain".
  // Setting deploymentId lets the client detect that mismatch and fall
  // back to a full page reload instead of crashing. See
  // node_modules/next/dist/docs/.../deploymentId.md.
  deploymentId: process.env.COMMIT_REF,
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
