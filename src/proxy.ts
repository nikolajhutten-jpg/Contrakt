import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth/config";
import { checkRateLimit } from "@/lib/security/rateLimit";
import type { RateLimitTier } from "@/lib/security/rateLimit";

// ─── Tier routing ─────────────────────────────────────────────────────────────

/**
 * Assigns a rate limit tier to an API pathname + HTTP method.
 *
 * Rules (evaluated top-to-bottom, first match wins):
 *   1. Auth sign-up and any other write auth endpoints → strict  (5/min)
 *   2. All GET requests to /api/                       → relaxed (200/min)
 *   3. Everything else                                 → standard (60/min)
 *
 * /api/auth/login, /api/auth/logout, /api/auth/callback are handled
 * entirely by Auth0 middleware before this function is ever reached.
 */
function getTier(pathname: string, method: string): RateLimitTier {
  // Auth mutation endpoints get the strictest limit
  if (pathname === "/api/auth/signup") return "strict";
  if (pathname.startsWith("/api/auth/"))  return "strict";

  // Read-only requests get a generous limit
  if (method === "GET") return "relaxed";

  return "standard";
}

/** Extracts the best-available client IP from the request headers. */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ??
    "anonymous"
  );
}

// ─── Proxy ────────────────────────────────────────────────────────────────────

/**
 * In Auth0 SDK v4 this proxy serves a dual purpose:
 *
 * 1. Auth route handling — requests to /api/auth/login, /api/auth/logout, and
 *    /api/auth/callback are intercepted here and handled entirely by Auth0.
 *    No separate route handler file is needed.
 *
 * 2. Session rolling — the proxy refreshes expiring sessions on every
 *    request so users are not logged out unexpectedly.
 *
 * Rate limiting is applied to all /api/ routes before Auth0 sees the request.
 * Limiting uses Upstash Redis (sliding window). When Redis is not configured
 * the check is skipped and all requests pass through.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ── Rate limiting ──────────────────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const tier = getTier(pathname, request.method);
    const ip   = getClientIp(request);
    const { success, reset } = await checkRateLimit(ip, tier);

    if (!success) {
      const retryAfter = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type":  "application/json",
            "Retry-After":   String(retryAfter),
            "X-RateLimit-Reset": String(reset),
          },
        },
      );
    }
  }

  // ── Auth0 ──────────────────────────────────────────────────────────────────
  // Auth0 handles /api/auth/* routes and rolls sessions on all other routes.
  if (pathname === "/api/auth/callback") {
    const cookieNames = request.cookies.getAll().map((c) => c.name);
    console.log("[DEBUG] callback cookie names:", JSON.stringify(cookieNames));
    console.log("[DEBUG] x-forwarded-host:", request.headers.get("x-forwarded-host"));
    console.log("[DEBUG] x-forwarded-proto:", request.headers.get("x-forwarded-proto"));
  }
  return auth0.middleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static files.
     * The broad matcher is required for Auth0 rolling sessions to work.
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
