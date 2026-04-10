import { NextRequest } from "next/server";
import { resolveAuthContext, requireRole } from "@/lib/auth/session";
import {
  getVendorWithContracts,
  updateVendor,
} from "@/lib/db/vendors";
import { ok, notFound, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";
import type { UpdateVendorData } from "@/lib/db/vendors";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/vendors/[id] — vendor detail with linked contracts (all users)
export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { tenantId } = await resolveAuthContext();
    const { id } = await params;

    const vendor = await getVendorWithContracts(id, tenantId);
    if (!vendor) return notFound("Vendor not found.");

    return ok(vendor);
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/vendors/[id] — update vendor details (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);
    const { id } = await params;

    const vendor = await getVendorWithContracts(id, tenantId);
    if (!vendor) return notFound("Vendor not found.");

    const body: unknown = await request.json();
    const patch = parseUpdateInput(body);

    const updated = await updateVendor(id, tenantId, patch);
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

// ─── Input parsing ─────────────────────────────────────────────────────────

function parseUpdateInput(body: unknown): UpdateVendorData {
  if (typeof body !== "object" || body === null) return {};
  const b = body as Record<string, unknown>;
  const patch: UpdateVendorData = {};

  if (typeof b.name === "string" && b.name.trim() !== "") {
    patch.name = b.name.trim();
  }
  if (typeof b.contactName === "string" || b.contactName === null) {
    patch.contactName = b.contactName as string | null;
  }
  if (typeof b.contactEmail === "string" || b.contactEmail === null) {
    patch.contactEmail = b.contactEmail as string | null;
  }

  return patch;
}
