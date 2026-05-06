import { headers } from "next/headers";
import { Webhook } from "svix";
import { createTenant } from "@/lib/db/tenants";
import { createUser, getUserByClerkId, getUserByEmail, updateUser, deactivateUser } from "@/lib/db/users";
import { UserRole } from "@/types";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    deleted?: boolean;
    email_addresses?: { email_address: string; id: string }[];
    primary_email_address_id?: string;
    first_name?: string | null;
    last_name?: string | null;
  };
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request): Promise<Response> {
  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId        = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();

  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    wh.verify(payload, {
      "svix-id":        svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const event = JSON.parse(payload) as ClerkWebhookEvent;

  const { id: clerkId } = event.data;

  // Handle user.deleted — remove the DB record so the clerkId doesn't linger
  // as a ghost. The DB row was already deleted on admin deactivation in most
  // cases; this covers deletions made directly from the Clerk dashboard.
  if (event.type === "user.deleted") {
    const user = await getUserByClerkId(clerkId);
    if (user) {
      await deactivateUser(user.id, user.tenantId);
    }
    return new Response("OK", { status: 200 });
  }

  if (event.type !== "user.created") {
    return new Response("OK", { status: 200 });
  }

  // Idempotency: skip if user already exists by Clerk ID
  const existingByClerkId = await getUserByClerkId(clerkId);
  if (existingByClerkId) {
    return new Response("OK", { status: 200 });
  }

  const { email_addresses, primary_email_address_id, first_name, last_name } = event.data;

  const primaryEmail = email_addresses?.find(e => e.id === primary_email_address_id)
    ?? email_addresses?.[0];
  const email = primaryEmail?.email_address ?? "";

  const name = [first_name, last_name].filter(Boolean).join(" ") || email.split("@")[0];

  // Check if this email already exists in the DB.
  const existingByEmail = await getUserByEmail(email);
  if (existingByEmail) {
    if (existingByEmail.clerkId.startsWith("invite:")) {
      // Invited user completing signup — replace placeholder clerkId.
      await updateUser(existingByEmail.id, existingByEmail.tenantId, { clerkId });
    }
    // Otherwise: a deactivated user re-signed up with the same email.
    // Do not provision a new tenant — just return 200.
    return new Response("OK", { status: 200 });
  }

  // New signup: provision a fresh tenant for this user.
  const baseSlug = toSlug(name) || "workspace";
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
  const gcsBucket = `contrakt-${slug}-documents`;

  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const tenant = await createTenant({ name, slug, gcsBucket, trialEndsAt });

  await createUser({
    tenantId: tenant.id,
    clerkId,
    name,
    email,
    role: UserRole.Admin,
  });

  return new Response("OK", { status: 200 });
}
