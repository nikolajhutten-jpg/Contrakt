/**
 * Security headers applied to every response via next.config.ts.
 *
 * Content-Security-Policy notes:
 *   - 'unsafe-inline' in script-src is required by Next.js's hydration scripts.
 *     TODO: replace with nonce-based CSP before go-live for stronger security.
 *   - storage.googleapis.com and *.r2.cloudflarestorage.com are allowed in
 *     connect-src, frame-src, and img-src for signed-URL document loading.
 *   - No Stripe or Slack domains are needed in client CSP — those integrations
 *     are server-to-server only.
 */

// In development, React's error overlay and fast-refresh use eval internally.
// 'unsafe-eval' is only added to script-src in that environment.
const scriptSrc =
  process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com"
    : "script-src 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com";

const CSP = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' until nonce-based CSP is wired up.
  // 'unsafe-eval' is added only in development for React's error overlay.
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com https://*.eu.r2.cloudflarestorage.com",
  // GCS signed URLs for document fetching; Clerk for auth API calls; R2 for Cloudflare-hosted documents
  "connect-src 'self' https://storage.googleapis.com https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://*.r2.cloudflarestorage.com https://*.eu.r2.cloudflarestorage.com",
  // PDF iframe viewer loads signed URLs and base64 data URLs in an iframe
  "frame-src 'self' data: blob: https://storage.googleapis.com https://challenges.cloudflare.com https://*.r2.cloudflarestorage.com https://*.eu.r2.cloudflarestorage.com",
  // Prevents this app from being embedded in iframes (clickjacking defence)
  "frame-ancestors 'none'",
  // blob: required for PDF.js workers loaded from blob URLs in the upload preview
  "worker-src 'self' blob:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]
  .join("; ");

export interface SecurityHeader {
  key: string;
  value: string;
}

/**
 * Returns the full set of security response headers.
 * Consumed by next.config.ts → headers() and can be spread into any
 * NextResponse in middleware if per-route overrides are ever needed.
 */
export function getSecurityHeaders(): SecurityHeader[] {
  return [
    // Prevent this page from being framed — belt-and-suspenders with CSP
    { key: "X-Frame-Options",           value: "DENY" },
    // Prevent MIME-type sniffing
    { key: "X-Content-Type-Options",    value: "nosniff" },
    // Send full origin on same-origin requests; origin-only on cross-origin
    { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
    // Restrictive CSP — see notes at the top of this file
    { key: "Content-Security-Policy",   value: CSP },
    // Disable browser APIs that this app does not use
    {
      key:   "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
    },
  ];
}
