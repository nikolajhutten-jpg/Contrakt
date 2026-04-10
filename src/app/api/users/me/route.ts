import { NextRequest } from "next/server";
import { resolveAuthContext } from "@/lib/auth/session";
import { updateUser } from "@/lib/db/users";
import { ok, badRequest, handleError } from "@/lib/api/response";
import type { UpdateUserInput } from "@/lib/db/users";

// PATCH /api/users/me — update own profile and notification preferences
export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const { localUser, tenantId } = await resolveAuthContext();

    const body: unknown = await request.json();
    const patch = parsePatch(body);
    if (typeof patch === "string") return badRequest(patch);

    const updated = await updateUser(localUser.id, tenantId, patch);
    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

function parsePatch(body: unknown): UpdateUserInput | string {
  if (typeof body !== "object" || body === null) return "Body must be JSON.";
  const b = body as Record<string, unknown>;
  const patch: UpdateUserInput = {};

  if ("name" in b) {
    if (typeof b.name !== "string" || b.name.trim() === "")
      return "name must be a non-empty string.";
    patch.name = b.name.trim();
  }
  if ("email" in b) {
    if (typeof b.email !== "string" || b.email.trim() === "")
      return "email must be a non-empty string.";
    patch.email = b.email.trim();
  }
  if ("slackUserId" in b) {
    if (typeof b.slackUserId !== "string" && b.slackUserId !== null)
      return "slackUserId must be a string or null.";
    patch.slackUserId = b.slackUserId as string | null;
  }

  return patch;
}
