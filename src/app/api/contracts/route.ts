import { NextRequest } from "next/server";
import { resolveAuthContext } from "@/lib/auth/session";
import {
  getContractsByTenant,
  getContractsByOwner,
  getContractsByDepartmentOrOwner,
  createContract,
} from "@/lib/db/contracts";
import { buildCreateContractData } from "@/lib/services/contracts";
import { checkContractLimit } from "@/lib/services/planLimits";
import { ok, created, badRequest, forbidden, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";
import type { CreateContractInput } from "@/types";

// GET /api/contracts — list contracts, filtered by the caller's role
export async function GET(): Promise<Response> {
  try {
    const { localUser, tenantId } = await resolveAuthContext();

    let contracts: Awaited<ReturnType<typeof getContractsByTenant>>;
    if (localUser.role === UserRole.Admin) {
      contracts = await getContractsByTenant(tenantId);
    } else if (localUser.role === UserRole.DepartmentOwner) {
      if (!localUser.departmentId) {
        contracts = await getContractsByOwner(localUser.id, tenantId);
      } else {
        contracts = await getContractsByDepartmentOrOwner(
          localUser.departmentId,
          localUser.id,
          tenantId,
        );
      }
    } else {
      // BusinessOwner — own contracts only
      contracts = await getContractsByOwner(localUser.id, tenantId);
    }

    return ok(contracts);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/contracts — create a new contract (Admin only)
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const { localUser, tenant, tenantId } = await resolveAuthContext();

    if (localUser.role !== UserRole.Admin) return forbidden();

    const limitCheck = await checkContractLimit(tenantId, tenant.plan);
    if (!limitCheck.allowed) return forbidden(limitCheck.message);

    const body: unknown = await request.json();
    const input = parseCreateInput(body);
    if (typeof input === "string") return badRequest(input);

    // §14.5: auto_renewal requires a renewal period
    if (input.autoRenewal && !input.renewalPeriodMonths) {
      return badRequest(
        "Renewal period (months) is required when auto-renewal is enabled.",
      );
    }

    const data = buildCreateContractData(input, tenantId);
    const contract = await createContract(data);
    return created(contract);
  } catch (error) {
    return handleError(error);
  }
}

// ─── Input parsing ─────────────────────────────────────────────────────────

function parseCreateInput(
  body: unknown,
): CreateContractInput | string {
  if (typeof body !== "object" || body === null) {
    return "Request body must be a JSON object.";
  }
  const b = body as Record<string, unknown>;

  if (typeof b.contractName !== "string" || b.contractName.trim() === "") return "contractName is required.";
  if (typeof b.vendorId !== "string") return "vendorId is required.";
  if (typeof b.departmentId !== "string") return "departmentId is required.";
  if (typeof b.startDate !== "string") return "startDate is required.";
  if (typeof b.endDate !== "string") return "endDate is required.";
  if (typeof b.termType !== "string") return "termType is required.";
  if (typeof b.autoRenewal !== "boolean") return "autoRenewal is required.";
  if (!Array.isArray(b.ownerIds)) return "ownerIds must be an array.";

  return {
    contractName: b.contractName,
    vendorId: b.vendorId,
    departmentId: b.departmentId,
    groupEntityId: typeof b.groupEntityId === "string" ? b.groupEntityId : null,
    startDate: b.startDate,
    endDate: b.endDate,
    termType: b.termType as CreateContractInput["termType"],
    autoRenewal: b.autoRenewal,
    renewalPeriodMonths:
      typeof b.renewalPeriodMonths === "number" ? b.renewalPeriodMonths : null,
    renewalNoticePeriodValue:
      typeof b.renewalNoticePeriodValue === "number"
        ? b.renewalNoticePeriodValue
        : null,
    renewalNoticePeriodUnit:
      typeof b.renewalNoticePeriodUnit === "string"
        ? (b.renewalNoticePeriodUnit as CreateContractInput["renewalNoticePeriodUnit"])
        : null,
    ownerIds: b.ownerIds as string[],
  };
}
