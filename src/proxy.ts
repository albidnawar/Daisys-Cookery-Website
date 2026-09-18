import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Netlify Functions are stateless per-invocation with no reliable shared
// in-memory state across instances, so the counters themselves live in
// Upstash Redis (a separate free-tier service, HTTP-based, fits a
// serverless proxy) rather than anything kept in this module — that would
// silently do nothing under real concurrent load. See the surge-readiness
// plan for why these three specific endpoints and why Upstash over a
// Supabase-table-based limiter (this doesn't add load to the primary DB
// during exactly the moment it's under the most pressure).
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// A booking flow naturally makes a few /api/slots/hold calls as a
// customer changes their date/slot selection, so it gets more headroom
// than /api/orders, which a real visitor hits once per checkout.
const LIMITS: Record<string, { requests: number; window: `${number} m` }> = {
  "/api/slots/hold": { requests: 10, window: "1 m" },
  "/api/orders": { requests: 5, window: "1 m" },
  "/api/draft-order": { requests: 20, window: "1 m" },
};

const limiters = new Map<string, Ratelimit>();

function getLimiter(pathname: string): Ratelimit | null {
  if (!redis) return null;
  const config = LIMITS[pathname];
  if (!config) return null;

  let limiter = limiters.get(pathname);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      prefix: `ratelimit:${pathname}`,
    });
    limiters.set(pathname, limiter);
  }
  return limiter;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-nf-client-connection-ip") ?? "unknown";
}

// Refreshes the Supabase auth session cookie on every request so Server
// Components always see an up-to-date session without each one having to
// handle token refresh itself.
export async function proxy(request: NextRequest) {
  // Checked first, and short-circuits before the Supabase session-refresh
  // work below, so a request already being rejected for abuse doesn't
  // also pay for an auth round-trip — the whole point of rate limiting is
  // rejecting cheaply before expensive work, which matters most under
  // exactly the traffic surge this exists for.
  const limiter = getLimiter(request.nextUrl.pathname);
  if (limiter) {
    const ip = getClientIp(request);
    const { success, limit, remaining, reset } = await limiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests — please slow down and try again shortly." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.max(0, Math.ceil((reset - Date.now()) / 1000)).toString(),
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
          },
        },
      );
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|patterns/).*)"],
};
