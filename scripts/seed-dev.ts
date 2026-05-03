import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Development seed script.
 *
 * Inserts a local dev tenant and admin user into the database so the app's
 * local dev bypass has real rows to query.
 *
 * Usage:
 *   npm run seed:dev
 *
 * The script is idempotent — running it multiple times is safe.
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DEV_TENANT_ID = "local-dev-tenant";
const DEV_CLERK_ID  = "local-dev-user";
const DEV_USER_ID   = "local-dev-user";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("ERROR: DATABASE_URL is not set.");
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString });
  const db = new PrismaClient({ adapter });

  try {
    // ── Tenant ───────────────────────────────────────────────────────────────
    const existingTenant = await db.tenant.findUnique({
      where: { id: DEV_TENANT_ID },
    });

    if (existingTenant) {
      console.log(`✓ Tenant already exists (id: ${DEV_TENANT_ID})`);
    } else {
      await db.tenant.create({
        data: {
          id:        DEV_TENANT_ID,
          name:      "Dev Tenant",
          slug:      "dev-tenant",
          gcsBucket: "dev-bucket",
        },
      });
      console.log(`✓ Created tenant (id: ${DEV_TENANT_ID})`);
    }

    // ── User ─────────────────────────────────────────────────────────────────
    const existingUser = await db.user.findUnique({
      where: { clerkId: DEV_CLERK_ID },
    });

    if (existingUser) {
      console.log(`✓ User already exists (clerkId: ${DEV_CLERK_ID})`);
    } else {
      await db.user.create({
        data: {
          id:       DEV_USER_ID,
          tenantId: DEV_TENANT_ID,
          clerkId:  DEV_CLERK_ID,
          name:     "Dev User",
          email:    "dev@localhost.com",
          role:     "admin",
        },
      });
      console.log(`✓ Created user (clerkId: ${DEV_CLERK_ID})`);
    }

    console.log("\nDone. You can now run `npm run dev`.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
