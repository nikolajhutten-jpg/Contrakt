/**
 * Auth0 SDK v4 — this file is intentionally empty.
 *
 * In Auth0 SDK v3 a catch-all route handler at this path was required to handle
 * login, logout, and callback requests. In v4 that responsibility moved to
 * src/middleware.ts, which intercepts /api/auth/login, /api/auth/logout, and
 * /api/auth/callback before they reach any route handler.
 *
 * The Auth0Client in src/lib/auth/config.ts is configured with:
 *   routes: { login: "/api/auth/login", logout: "/api/auth/logout", callback: "/api/auth/callback" }
 *
 * Those paths are handled by the middleware. This file exists only to document
 * the v3 → v4 migration and to keep the directory structure recognisable.
 *
 * Do NOT add GET/POST exports here — requests to /api/auth/* will never reach
 * this handler while the middleware is active.
 */

// Required to satisfy the TypeScript module checker (TS2306).
export {};
