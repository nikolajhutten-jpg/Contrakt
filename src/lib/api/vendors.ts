/**
 * Client-side API helpers for vendor operations.
 * Called from client components (not API routes).
 */
import type { Vendor } from "@/types";
import type { UpdateVendorData } from "@/lib/db/vendors";

/** PATCH /api/vendors/[id] — updates vendor name and contact details. Admin only. */
export async function updateVendor(
  vendorId: string,
  data: UpdateVendorData,
): Promise<Vendor> {
  const res = await fetch(`/api/vendors/${vendorId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to update vendor. Please try again.");
  }
  return res.json() as Promise<Vendor>;
}
