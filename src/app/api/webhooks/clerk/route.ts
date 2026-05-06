import { headers } from "next/headers";
import { Webhook } from "svix";
import { createTenant } from "@/lib/db/tenants";
import { createUser, getUserByClerkId, getUserByEmail, updateUser } from "@/lib/db/users";
import { UserRole } from "@/types";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses: { email_address: string; id: string }[];
    primary_email_address_id: string;
    first_name: string | null;
    last_name: string | null;
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

  if (event.type !== "user.created") {
    return new Response("OK", { status: 200 });
  }

  const { id: clerkId, email_addresses, primary_email_address_id, first_name, last_name } = event.data;

  // Idempotency: skip if user already exists by Clerk ID
  const existingByClerkId = await getUserByClerkId(clerkId);
  if (existingByClerkId) {
    return new Response("OK", { status: 200 });
  }

  const primaryEmail = email_addresses.find(e => e.id === primary_email_address_id)
    ?? email_addresses[0];
  const email = primaryEmail?.email_address ?? "";

  const name = [first_name, last_name].filter(Boolean).join(" ") || email.split("@")[0];

  // If a DB user with this email was pre-created by an admin invite, update
  // its placeholder clerkId to the real one instead of provisioning a new tenant.
  const invitedUser = await getUserByEmail(email);
  if (invitedUser && invitedUser.clerkId.startsWith("invite:")) {
    await updateUser(invitedUser.id, invitedUser.tenantId, { clerkId });
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
