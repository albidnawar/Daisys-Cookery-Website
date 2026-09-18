import * as Sentry from "@sentry/nextjs";

// SENTRY_DSN unset (e.g. before the free Sentry account exists) -> the SDK
// stays disabled and this is a safe no-op. See the surge-readiness plan:
// this exists so an API-route/Server-Component failure during a surge is
// noticed proactively instead of via a customer complaint.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
});
