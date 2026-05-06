import { NextRequest } from "next/server";
import { resolveAuthContext, requireRole } from "@/lib/auth/session";
import { getContractById } from "@/lib/db/contracts";
import {
  getDocumentsByContract,
  createDocument,
  getLatestRenewalVersion,
} from "@/lib/db/documents";
import {
  ok,
  created,
  notFound,
  badRequest,
  handleError,
} from "@/lib/api/response";
import { UserRole, DocumentType, FileFormat } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/contracts/[id]/documents
export async function GET(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { tenantId } = await resolveAuthContext();
    const { id } = await params;

    const contract = await getContractById(id, tenantId);
    if (!contract) return notFound("Contract not found.");

    const documents = await getDocumentsByContract(id, tenantId);
    return ok(documents);
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/contracts/[id]/documents — Admin only
export async function POST(
  request: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  try {
    const { localUser, tenantId } = await requireRole([UserRole.Admin]);
    const { id } = await params;

    const contract = await getContractById(id, tenantId);
    if (!contract) return notFound("Contract not found.");

    const body: unknown = await request.json();
    const input = parseInput(body);
    if (typeof input === "string") return badRequest(input);

    // Auto-increment version for renewals
    let version = 1;
    if (input.type === DocumentType.Renewal) {
      version = (await getLatestRenewalVersion(id, tenantId)) + 1;
    }

    const document = await createDocument({
      tenantId,
      contractId: id,
      type: input.type,
      version,
      fileName: input.fileName,
      filePath: input.filePath,
      fileFormat: input.fileFormat,
      uploadedById: localUser.id,
    });

    return created(document);
  } catch (error) {
    return handleError(error);
  }
}

type ParsedInput = {
  type: DocumentType;
  fileName: string;
  filePath: string;
  fileFormat: FileFormat;
};

const VALID_TYPES = Object.values(DocumentType) as string[];
const VALID_FORMATS = Object.values(FileFormat) as string[];

function parseInput(body: unknown): ParsedInput | string {
  if (typeof body !== "object" || body === null) return "Body must be JSON.";
  const b = body as Record<string, unknown>;
  if (typeof b.type !== "string" || !VALID_TYPES.includes(b.type))
    return `type must be one of: ${VALID_TYPES.join(", ")}.`;
  if (typeof b.fileName !== "string" || b.fileName.trim() === "")
    return "fileName is required.";
  if (typeof b.filePath !== "string" || b.filePath.trim() === "")
    return "filePath is required.";
  if (typeof b.fileFormat !== "string" || !VALID_FORMATS.includes(b.fileFormat))
    return `fileFormat must be one of: ${VALID_FORMATS.join(", ")}.`;
  return {
    type: b.type as DocumentType,
    fileName: b.fileName.trim(),
    filePath: b.filePath.trim(),
    fileFormat: b.fileFormat as FileFormat,
  };
}
