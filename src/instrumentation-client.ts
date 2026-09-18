import * as Sentry from "@sentry/nextjs";

// NEXT_PUBLIC_SENTRY_DSN unset -> disabled, safe no-op (same reasoning as
// sentry.server.config.ts). Must be NEXT_PUBLIC_-prefixed since this file
// runs in the browser.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
