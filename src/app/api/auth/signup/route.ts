import { NextRequest } from "next/server";
import { createTenant } from "@/lib/db/tenants";
import { createUser } from "@/lib/db/users";
import { created, badRequest, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";

/** Converts a company name into a URL-safe slug. */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * POST /api/auth/signup
 *
 * Stage 1 + 2 of the onboarding flow (§13.2 + §13.3).
 * No authentication required — this is the initial sign-up endpoint.
 *
 * What this does:
 *   1. Creates a Tenant record in the database.
 *   2. Creates the admin User record linked to the tenant.
 *   3. Marks a placeholder GCS bucket name (provisioning is mocked).
 *   4. Returns the new tenant and user IDs.
 *
 * TODO (production wiring):
 *   - Wire up a Clerk webhook (svix) to receive user.created events and use
 *     the Clerk user ID as clerkId instead of the placeholder.
 *   - Provision a real GCS bucket: Storage.createBucket(`contrakt-${slug}-documents`)
 *     and lock it to the tenant's service account.
 *   - Seed a default notification alert template (2 months before renewal notice
 *     deadline, via email) once a contract management flow exists for global defaults.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null) {
      return badRequest("Body must be JSON.");
    }

    const b = body as Record<string, unknown>;

    if (typeof b.companyName !== "string" || !b.companyName.trim())
      return badRequest("companyName is required.");
    if (typeof b.name !== "string" || !b.name.trim())
      return badRequest("name is required.");
    if (typeof b.email !== "string" || !b.email.trim())
      return badRequest("email is required.");
    if (typeof b.password !== "string" || b.password.length < 8)
      return badRequest("password must be at least 8 characters.");

    const companyName = b.companyName.trim();
    const name = b.name.trim();
    const email = b.email.trim().toLowerCase();

    const slug = toSlug(companyName) || crypto.randomUUID().slice(0, 8);
    // TODO: check slug uniqueness and append a suffix if already taken
    const gcsBucket = `contrakt-${slug}-documents`;
    // TODO: replace with real GCS bucket provisioning

    // §15.4: 14-day free trial begins at signup
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const tenant = await createTenant({ name: companyName, slug, gcsBucket, trialEndsAt });

    // TODO: replace placeholder with real Clerk user ID from webhook
    const clerkId = `signup:${crypto.randomUUID()}`;

    const user = await createUser({
      tenantId: tenant.id,
      clerkId,
      name,
      email,
      role: UserRole.Admin,
    });

    // TODO: trigger SendGrid verification email here
    // await sendVerificationEmail({ to: email, tenantId: tenant.id });

    return created({ tenantId: tenant.id, userId: user.id });
  } catch (error) {
    return handleError(error);
  }
}
