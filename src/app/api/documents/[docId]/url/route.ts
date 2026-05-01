import { NextRequest } from "next/server";
import { resolveAuthContext } from "@/lib/auth/session";
import { getDocumentById } from "@/lib/db/documents";
import { getSignedUrl } from "@/lib/storage/r2";
import { ok, notFound, handleError } from "@/lib/api/response";

const EXPIRES_IN = 3600; // 1 hour

type RouteContext = { params: Promise<{ docId: string }> };

/**
 * GET /api/documents/[docId]/url
 * Returns a short-lived presigned R2 URL for viewing a contract document.
 * The document record is fetched and tenant-scoped to validate access.
 */
export async function GET(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { tenantId } = await resolveAuthContext();
    const { docId } = await params;

    const doc = await getDocumentById(docId, tenantId);
    if (!doc) return notFound("Document not found.");

    const url = await getSignedUrl(doc.filePath, EXPIRES_IN);

    return ok({ url, expiresInSeconds: EXPIRES_IN });
  } catch (error) {
    return handleError(error);
  }
}
