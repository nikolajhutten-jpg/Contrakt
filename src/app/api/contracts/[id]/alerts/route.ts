import { NextRequest } from "next/server";
import { resolveAuthContext } from "@/lib/auth/session";
import { getContractById } from "@/lib/db/contracts";
import { getAlertsByContract, createAlert } from "@/lib/db/alerts";
import {
  ok,
  created,
  notFound,
  forbidden,
  badRequest,
  handleError,
} from "@/lib/api/response";
import {
  UserRole,
  PeriodUnit,
  AlertTriggerReference,
  AlertChannel,
} from "@/types";
import type { CreateAlertInput } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/contracts/[id]/alerts — all authenticated users
export async function GET(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { tenantId } = await resolveAuthContext();
    const { id } = await params;

    const contract = await getContractById(id, tenantId);
    if (!contract) return notFound("Contract not found.");

    const alerts = await getAlertsByContract(id, tenantId);
    return ok(alerts);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/contracts/[id]/alerts — business owner or admin only
export async function POST(
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

    if (
      localUser.role === UserRole.BusinessOwner &&
      !contract.owners.some((o) => o.userId === localUser.id)
    ) {
      return forbidden();
    }

    const body: unknown = await request.json();
    const input = parseInput(body);
    if (typeof input === "string") return badRequest(input);

    const alert = await createAlert({
      tenantId,
      contractId: id,
      triggerValue: input.triggerValue,
      triggerUnit: input.triggerUnit,
      triggerReference: input.triggerReference,
      channels: input.channels,
    });

    return created(alert);
  } catch (error) {
    return handleError(error);
  }
}

const VALID_UNITS = Object.values(PeriodUnit) as string[];
const VALID_REFS = Object.values(AlertTriggerReference) as string[];
const VALID_CHANNELS = Object.values(AlertChannel) as string[];

function parseInput(body: unknown): CreateAlertInput | string {
  if (typeof body !== "object" || body === null) return "Body must be JSON.";
  const b = body as Record<string, unknown>;

  if (typeof b.triggerValue !== "number" || b.triggerValue < 1)
    return "triggerValue must be a positive number.";
  if (typeof b.triggerUnit !== "string" || !VALID_UNITS.includes(b.triggerUnit))
    return `triggerUnit must be one of: ${VALID_UNITS.join(", ")}.`;
  if (
    typeof b.triggerReference !== "string" ||
    !VALID_REFS.includes(b.triggerReference)
  )
    return `triggerReference must be one of: ${VALID_REFS.join(", ")}.`;
  if (
    !Array.isArray(b.channels) ||
    b.channels.length === 0 ||
    !(b.channels as string[]).every((c) => VALID_CHANNELS.includes(c))
  )
    return `channels must be a non-empty array of: ${VALID_CHANNELS.join(", ")}.`;

  return {
    triggerValue: b.triggerValue,
    triggerUnit: b.triggerUnit as PeriodUnit,
    triggerReference: b.triggerReference as AlertTriggerReference,
    channels: b.channels as AlertChannel[],
  };
}
