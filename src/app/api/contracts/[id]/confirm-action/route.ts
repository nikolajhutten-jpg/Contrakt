import { NextRequest } from "next/server";
import { resolveAuthContext } from "@/lib/auth/session";
import { getContractById, updateContract } from "@/lib/db/contracts";
import { ok, notFound, forbidden, handleError } from "@/lib/api/response";
import { UserRole, ContractStatus } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/contracts/[id]/confirm-action
 * Marks a contract's "Action Required" status as resolved.
 * Accessible by business owners (own contracts) and admins.
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { localUser, tenantId } = await resolveAuthContext();
    const { id } = await params;

    if (
      localUser.role !== UserRole.Admin &&
      localUser.role !== UserRole.BusinessOwner
    ) {
      return forbidden();
    }

    const contract = await getContractById(id, tenantId);
    if (!contract) return notFound("Contract not found.");

    // Business owners may only act on contracts they own
    if (
      localUser.role === UserRole.BusinessOwner &&
      !contract.owners.some((o) => o.userId === localUser.id)
    ) {
      return forbidden();
    }

    if (contract.status !== ContractStatus.ActionRequired) {
      return ok(contract); // idempotent — already resolved
    }

    const updated = await updateContract(id, tenantId, {
      actionConfirmed: true,
      actionConfirmedAt: new Date(),
      status: ContractStatus.Active,
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
