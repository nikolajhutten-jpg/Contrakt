import { NextRequest } from "next/server";
import { resolveAuthContext } from "@/lib/auth/session";
import { getContractById } from "@/lib/db/contracts";
import { getAlertById, updateAlert, deleteAlert } from "@/lib/db/alerts";
import { ok, notFound, forbidden, badRequest, handleError } from "@/lib/api/response";
import {
  UserRole,
  PeriodUnit,
  AlertTriggerReference,
  AlertChannel,
} from "@/types";
import type { UpdateAlertInput } from "@/types";

type RouteContext = { params: Promise<{ id: string; alertId: string }> };

// PATCH /api/contracts/[id]/alerts/[alertId] — business owner or admin only
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { localUser, tenantId } = await resolveAuthContext();
    const { id, alertId } = await params;

    if (
      localUser.role !== UserRole.Admin &&
      localUser.role !== UserRole.BusinessOwner
    ) {
      return forbidden();
    }

    const contract = await getContractById(id, tenantId);
    if (!contract) return notFound("Contract not found.");

    if (
      localUser.role === UserRole.BusinessOwner &&
      !contract.owners.some((o) => o.userId === localUser.id)
    ) {
      return forbidden();
    }

    const alert = await getAlertById(alertId, id, tenantId);
    if (!alert) return notFound("Alert not found.");

    const body: unknown = await request.json();
    const patch = parsePatch(body);
    if (typeof patch === "string") return badRequest(patch);

    const updated = await updateAlert(alertId, id, tenantId, patch);
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/contracts/[id]/alerts/[alertId] — business owner or admin only
export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { localUser, tenantId } = await resolveAuthContext();
    const { id, alertId } = await params;

    if (
      localUser.role !== UserRole.Admin &&
      localUser.role !== UserRole.BusinessOwner
    ) {
      return forbidden();
    }

    const contract = await getContractById(id, tenantId);
    if (!contract) return notFound("Contract not found.");

    if (
      localUser.role === UserRole.BusinessOwner &&
      !contract.owners.some((o) => o.userId === localUser.id)
    ) {
      return forbidden();
    }

    const alert = await getAlertById(alertId, id, tenantId);
    if (!alert) return notFound("Alert not found.");

    await deleteAlert(alertId, id, tenantId);
    return ok({ id: alertId });
  } catch (error) {
    return handleError(error);
  }
}

const VALID_UNITS = Object.values(PeriodUnit) as string[];
const VALID_REFS = Object.values(AlertTriggerReference) as string[];
const VALID_CHANNELS = Object.values(AlertChannel) as string[];

function parsePatch(body: unknown): UpdateAlertInput | string {
  if (typeof body !== "object" || body === null) return "Body must be JSON.";
  const b = body as Record<string, unknown>;
  const patch: UpdateAlertInput = {};

  if ("triggerValue" in b) {
    if (typeof b.triggerValue !== "number" || b.triggerValue < 1)
      return "triggerValue must be a positive number.";
    patch.triggerValue = b.triggerValue;
  }
  if ("triggerUnit" in b) {
    if (typeof b.triggerUnit !== "string" || !VALID_UNITS.includes(b.triggerUnit))
      return `triggerUnit must be one of: ${VALID_UNITS.join(", ")}.`;
    patch.triggerUnit = b.triggerUnit as PeriodUnit;
  }
  if ("triggerReference" in b) {
    if (
      typeof b.triggerReference !== "string" ||
      !VALID_REFS.includes(b.triggerReference)
    )
      return `triggerReference must be one of: ${VALID_REFS.join(", ")}.`;
    patch.triggerReference = b.triggerReference as AlertTriggerReference;
  }
  if ("channels" in b) {
    if (
      !Array.isArray(b.channels) ||
      b.channels.length === 0 ||
      !(b.channels as string[]).every((c) => VALID_CHANNELS.includes(c))
    )
      return `channels must be a non-empty array of: ${VALID_CHANNELS.join(", ")}.`;
    patch.channels = b.channels as AlertChannel[];
  }

  return patch;
}
