import { NextRequest } from "next/server";
import { resolveAuthContext, requireRole } from "@/lib/auth/session";
import {
  getContractById,
  updateContract,
  deleteContract,
} from "@/lib/db/contracts";
import {
  calculateDurationMonths,
  calculateNoticeDeadline,
} from "@/lib/services/contracts";
import { ok, notFound, forbidden, handleError } from "@/lib/api/response";
import { UserRole } from "@/types";
import type { UpdateContractInput, PeriodUnit } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/contracts/[id] — fetch single contract (role-gated read)
export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { localUser, tenantId } = await resolveAuthContext();
    const { id } = await params;

    const contract = await getContractById(id, tenantId);
    if (!contract) return notFound("Contract not found.");

    if (!canRead(localUser.role, localUser.id, localUser.departmentId, contract)) {
      return forbidden();
    }

    return ok(contract);
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/contracts/[id] — update contract (business owner or admin)
export async function PATCH(
  request: NextRequest,
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

    // Business owners may only edit contracts they own
    if (
      localUser.role === UserRole.BusinessOwner &&
      !contract.owners.some((o) => o.userId === localUser.id)
    ) {
      return forbidden();
    }

    const body: unknown = await request.json();
    const patch = parseUpdateInput(body, contract);

    const updated = await updateContract(id, tenantId, patch);
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/contracts/[id] — admin only
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { tenantId } = await requireRole([UserRole.Admin]);
    const { id } = await params;

    const contract = await getContractById(id, tenantId);
    if (!contract) return notFound("Contract not found.");

    await deleteContract(id, tenantId);
    return ok({ id });
  } catch (error) {
    return handleError(error);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function canRead(
  role: string,
  userId: string,
  departmentId: string | null,
  contract: { owners: { userId: string }[]; departmentId: string },
): boolean {
  if (role === UserRole.Admin) return true;
  if (role === UserRole.DepartmentOwner) {
    return contract.departmentId === departmentId;
  }
  return contract.owners.some((o) => o.userId === userId);
}

function parseUpdateInput(
  body: unknown,
  existing: { startDate: Date; endDate: Date },
): import("@/lib/db/contracts").UpdateContractData {
  if (typeof body !== "object" || body === null) return {};
  const b = body as Record<string, unknown>;

  const patch: import("@/lib/db/contracts").UpdateContractData = {};

  if (typeof b.vendorId === "string") patch.vendorId = b.vendorId;
  if (typeof b.departmentId === "string") patch.departmentId = b.departmentId;
  if (typeof b.groupEntityId === "string" || b.groupEntityId === null)
    patch.groupEntityId = b.groupEntityId as string | null;
  if (typeof b.termType === "string")
    patch.termType = b.termType as import("@/types").TermType;
  if (typeof b.autoRenewal === "boolean") patch.autoRenewal = b.autoRenewal;
  if (Array.isArray(b.ownerIds)) patch.ownerIds = b.ownerIds as string[];
  if (typeof b.renewalPeriodMonths === "number" || b.renewalPeriodMonths === null)
    patch.renewalPeriodMonths = b.renewalPeriodMonths as number | null;
  if (typeof b.renewalNoticePeriodValue === "number" || b.renewalNoticePeriodValue === null)
    patch.renewalNoticePeriodValue = b.renewalNoticePeriodValue as number | null;
  if (typeof b.renewalNoticePeriodUnit === "string" || b.renewalNoticePeriodUnit === null)
    patch.renewalNoticePeriodUnit = b.renewalNoticePeriodUnit as PeriodUnit | null;

  // Resolve final Date values (parse strings from JSON, fall back to existing)
  const startDate =
    typeof b.startDate === "string" ? new Date(b.startDate) : existing.startDate;
  const endDate =
    typeof b.endDate === "string" ? new Date(b.endDate) : existing.endDate;

  if (typeof b.startDate === "string") patch.startDate = startDate;
  if (typeof b.endDate === "string") patch.endDate = endDate;

  // Recalculate derived fields whenever dates or notice period change
  if (typeof b.startDate === "string" || typeof b.endDate === "string") {
    patch.durationMonths = calculateDurationMonths(startDate, endDate);
  }
  if (
    typeof b.endDate === "string" ||
    "renewalNoticePeriodValue" in b ||
    "renewalNoticePeriodUnit" in b
  ) {
    patch.renewalNoticeDeadline = calculateNoticeDeadline(
      endDate,
      patch.renewalNoticePeriodValue ?? null,
      patch.renewalNoticePeriodUnit ?? null,
    );
  }

  return patch;
}
