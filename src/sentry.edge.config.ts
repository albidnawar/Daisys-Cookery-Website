import * as Sentry from "@sentry/nextjs";

// Covers any edge-runtime code (src/proxy.ts runs on the Node.js runtime
// by default in Next 16, so this mainly exists for completeness/any future
// route that opts into the edge runtime explicitly).
// See sentry.server.config.ts for why dsn is allowed to be unset.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
});
