import { db } from "@/lib/db/client";
import type { ExtractionResult, ExtractionOutput, ConfidenceRatings } from "@/types";

export interface SaveExtractionResultData {
  tenantId: string;
  documentId: string;
  extractedData: ExtractionOutput;
  confidence: ConfidenceRatings;
}

/**
 * Persists an extraction result to the database, linked to a specific document.
 * Called after the document record has been created (requires a valid documentId).
 */
export async function saveExtractionResult(
  data: SaveExtractionResultData,
): Promise<ExtractionResult> {
  const row = await db.extractionResult.create({
    data: {
      tenantId: data.tenantId,
      documentId: data.documentId,
      extractedData: data.extractedData as object,
      confidence: data.confidence as object,
    },
  });
  return {
    ...row,
    extractedData: row.extractedData as unknown as ExtractionOutput,
    confidence: row.confidence as unknown as ConfidenceRatings,
  };
}

/**
 * Retrieves the extraction result for a given document.
 * Tenant-scoped — returns null if not found or if tenant does not match.
 */
export async function getExtractionResultByDocument(
  documentId: string,
  tenantId: string,
): Promise<ExtractionResult | null> {
  const row = await db.extractionResult.findFirst({
    where: { documentId, tenantId },
  });
  if (!row) return null;
  return {
    ...row,
    extractedData: row.extractedData as unknown as ExtractionOutput,
    confidence: row.confidence as unknown as ConfidenceRatings,
  };
}
