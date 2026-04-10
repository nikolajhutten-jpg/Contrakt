import type { NextConfig } from "next";
import { getSecurityHeaders } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  /**
   * Apply security headers to every route (§ security hardening).
   * Headers are defined in src/lib/security/headers.ts so they can be
   * imported and tested independently of the Next.js config.
   *
   * The webhook route (/api/billing/webhook) intentionally receives the
   * same headers — Stripe ignores unknown response headers.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: getSecurityHeaders(),
      },
    ];
  },
};

export default nextConfig;
