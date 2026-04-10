import { NextRequest } from "next/server";
import { resolveAuthContext } from "@/lib/auth/session";
import { getDocumentById } from "@/lib/db/documents";
import { ok, notFound, handleError } from "@/lib/api/response";

type RouteContext = { params: Promise<{ docId: string }> };

/**
 * GET /api/documents/[docId]/url
 * Returns a short-lived signed URL for viewing a contract document.
 *
 * GCS signing is not yet wired up — this returns a placeholder URL
 * that will be replaced with a real signed GCS URL once GCS is connected.
 * The document record is still fetched and tenant-scoped to validate access.
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

    // TODO: replace with real GCS signed URL generation
    // e.g. Storage.bucket(tenant.gcsBucket).file(doc.filePath).getSignedUrl(...)
    const url = `/api/documents/${docId}/placeholder`;

    return ok({ url, expiresInSeconds: 3600 });
  } catch (error) {
    return handleError(error);
  }
}
