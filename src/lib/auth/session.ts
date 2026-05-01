import type { SessionData } from "@auth0/nextjs-auth0/types";
import { auth0, AUTH0_CLAIM_NS } from "@/lib/auth/config";
import { getUserByAuth0Id } from "@/lib/db/users";
import { UserRole, type User } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Auth0 session user extended with the custom claims our post-login Action injects.
 * The tenant_id claim is set from the Auth0 organization the user belongs to.
 * We use a plain type intersection to avoid extending a mapped type.
 */
type Auth0SessionUser = SessionData["user"] & { [key: string]: unknown };

/** Shape returned by requireAuth and requireRole for use in API routes */
export interface AuthContext {
  session: SessionData;
  tenantId: string;
  localUser: User;
}

// ─── Local dev bypass ─────────────────────────────────────────────────────────

const IS_DEV = process.env.NODE_ENV === "development";

/**
 * Auth0 `sub` used by the dev mock. Must match the record inserted by
 * scripts/seed-dev.ts so that DB queries resolve to a real row.
 */
export const DEV_AUTH0_ID  = "local-dev-user";
export const DEV_TENANT_ID = "local-dev-tenant";

/** Minimal mock used by all auth helpers when NODE_ENV === "development". */
const DEV_SESSION = {
  user: {
    sub:   DEV_AUTH0_ID,
    name:  "Dev User",
    email: "dev@localhost.com",
    [`${AUTH0_CLAIM_NS}/tenant_id`]: DEV_TENANT_ID,
  },
} as unknown as SessionData;

const DEV_LOCAL_USER: User = {
  id:           DEV_AUTH0_ID,
  tenantId:     DEV_TENANT_ID,
  auth0Id:      DEV_AUTH0_ID,
  name:         "Dev User",
  email:        "dev@localhost.com",
  role:         UserRole.Admin,
  departmentId: null,
  slackUserId:  null,
  createdAt:    new Date(0),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the raw Auth0 session, or null if the user is not authenticated.
 * In development, always returns the mock session.
 */
export async function getSession(): Promise<SessionData | null> {
  if (IS_DEV) return DEV_SESSION;
  return auth0.getSession();
}

/**
 * Returns the Auth0 session or throws a 401 error object if the user is not
 * authenticated. In development, always returns the mock session.
 */
export async function requireAuth(): Promise<SessionData> {
  if (IS_DEV) return DEV_SESSION;
  const session = await auth0.getSession();
  if (!session) {
    throw Object.assign(new Error("Authentication required"), { status: 401 });
  }
  return session;
}

/**
 * Extracts the internal tenant_id from the Auth0 session's custom claim.
 * In development, always returns DEV_TENANT_ID.
 */
export function getTenantFromSession(session: SessionData): string {
  if (IS_DEV) return DEV_TENANT_ID;
  const user = session.user as Auth0SessionUser;
  console.log("[DEBUG] session.user claims:", JSON.stringify(user, null, 2));
  const tenantId = user[`${AUTH0_CLAIM_NS}/tenant_id`];
  if (typeof tenantId !== "string" || tenantId === "") {
    throw Object.assign(
      new Error("Session is missing tenant claim — check Auth0 Action config"),
      { status: 401 },
    );
  }
  return tenantId;
}

/**
 * Resolves the full AuthContext: validates the session, extracts the tenant,
 * and returns the local user record.
 *
 * In development, returns a fully hardcoded mock context — no DB or Auth0
 * calls are made, so API routes work without running the seed script first.
 */
export async function resolveAuthContext(): Promise<AuthContext> {
  if (IS_DEV) {
    return { session: DEV_SESSION, tenantId: DEV_TENANT_ID, localUser: DEV_LOCAL_USER };
  }
  const session = await requireAuth();
  const tenantId = getTenantFromSession(session);
  const localUser = await getUserByAuth0Id(session.user.sub, tenantId);
  if (!localUser) {
    throw Object.assign(new Error("User record not found"), { status: 401 });
  }
  return { session, tenantId, localUser };
}

/**
 * Resolves the auth context and asserts that the caller's role is in the
 * list of allowed roles. Throws 403 if the role check fails.
 *
 * @example
 * const { localUser, tenantId } = await requireRole([UserRole.Admin]);
 */
export async function requireRole(
  allowedRoles: UserRole[],
): Promise<AuthContext> {
  const ctx = await resolveAuthContext();
  if (!allowedRoles.includes(ctx.localUser.role)) {
    throw Object.assign(
      new Error("Insufficient permissions"),
      { status: 403 },
    );
  }
  return ctx;
}
