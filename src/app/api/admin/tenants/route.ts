import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getAllTenants } from "@/lib/db/tenants";
import { env } from "@/env";

async function verifySuperadmin(): Promise<string | null> {
  const user = await currentUser();
  const email = user?.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId,
  )?.emailAddress;
  return email === env.SUPERADMIN_EMAIL ? email : null;
}

export async function GET(): Promise<NextResponse> {
  const email = await verifySuperadmin();
  if (!email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tenants = await getAllTenants();
  return NextResponse.json({ data: tenants });
}
