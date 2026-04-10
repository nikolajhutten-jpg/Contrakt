import { NextRequest } from "next/server";
import { resolveAuthContext } from "@/lib/auth/session";
import { getVendorsByTenant, createVendor } from "@/lib/db/vendors";
import { ok, created, badRequest, handleError } from "@/lib/api/response";

// GET /api/vendors — list all vendors for the tenant
export async function GET(): Promise<Response> {
  try {
    const { tenantId } = await resolveAuthContext();
    const vendors = await getVendorsByTenant(tenantId);
    return ok(vendors);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/vendors — create a new vendor (all authenticated users)
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { tenantId } = await resolveAuthContext();

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
