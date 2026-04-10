import { db } from "@/lib/db/client";
import type { Document, DocumentType, FileFormat } from "@/types";

export async function getDocumentsByContract(
  contractId: string,
  tenantId: string,
): Promise<Document[]> {
  return db.document.findMany({
    where: { contractId, tenantId },
    orderBy: { uploadedAt: "asc" },
  });
}

export async function getDocumentById(
  docId: string,
  tenantId: string,
): Promise<Document | null> {
  return db.document.findFirst({
    where: { id: docId, tenantId },
  });
}

export interface CreateDocumentData {
  tenantId: string;
  contractId: string;
  type: DocumentType;
  version: number;
  fileName: string;
  filePath: string;
  fileFormat: FileFormat;
  uploadedById: string;
}

export async function createDocument(
  data: CreateDocumentData,
): Promise<Document> {
  return db.document.create({ data });
}

export async function deleteDocument(
  docId: string,
  tenantId: string,
): Promise<void> {
  await db.document.delete({ where: { id: docId, tenantId } });
}

/**
 * Returns the highest version number for renewal documents on a contract,
 * or 0 if none exist. Used to auto-increment version on new renewals.
 */
export async function getLatestRenewalVersion(
  contractId: string,
  tenantId: string,
): Promise<number> {
  const result = await db.document.findFirst({
    where: { contractId, tenantId, type: "renewal" },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  return result?.version ?? 0;
}
