import { NextRequest } from "next/server";
import { resolveAuthContext, requireRole } from "@/lib/auth/session";
import {
  getVendorsByTenant,
  getVendorsByOwner,
  getVendorsByDepartmentOrOwner,
  createVendor,
} from "@/lib/db/vendors";
import { ok, created, badRequest, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";

// GET /api/vendors — list vendors scoped by the caller's role
export async function GET(): Promise<Response> {
  try {
    const { localUser, tenantId } = await resolveAuthContext();

    let vendors: Awaited<ReturnType<typeof getVendorsByTenant>>;
    if (localUser.role === UserRole.Admin) {
      vendors = await getVendorsByTenant(tenantId);
    } else if (localUser.role === UserRole.DepartmentOwner) {
      vendors = await getVendorsByDepartmentOrOwner(
        localUser.id,
        localUser.departmentId,
        tenantId,
      );
    } else {
      // BusinessOwner — only vendors with a contract they own
      vendors = await getVendorsByOwner(localUser.id, tenantId);
    }

    return ok(vendors);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/vendors — create a new vendor (Admin only)
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);

    const body: unknown = await request.json();
    const input = parseCreateInput(body);
    if (typeof input === "string") return badRequest(input);

    const vendor = await createVendor({
      tenantId,
      name: input.name,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
    });

    return created(vendor);
  } catch (error) {
    return handleError(error);
  }
}

// ─── Input parsing ─────────────────────────────────────────────────────────

type ParsedVendorInput = {
  name: string;
  contactName?: string;
  contactEmail?: string;
};

function parseCreateInput(body: unknown): ParsedVendorInput | string {
  if (typeof body !== "object" || body === null) {
    return "Request body must be a JSON object.";
  }
  const b = body as Record<string, unknown>;

  if (typeof b.name !== "string" || b.name.trim() === "") {
    return "name is required.";
  }

  return {
    name: b.name.trim(),
    contactName: typeof b.contactName === "string" ? b.contactName : undefined,
    contactEmail:
      typeof b.contactEmail === "string" ? b.contactEmail : undefined,
  };
}
