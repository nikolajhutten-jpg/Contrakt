/**
 * Core AI extraction service.
 * Converts uploaded contract files to text, then calls the Claude API to
 * extract structured contract properties per §12.3 and §12.4.
 */
import Anthropic from "@anthropic-ai/sdk";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import type { ExtractionOutput, ConfidenceRatings, ConfidenceLevel } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── §12.3 System prompt ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a contract data extraction assistant.

Return ONLY a valid JSON object — no prose, no markdown, no explanation.
Use null for any field you cannot find or are not confident about — never invent values.
Express dates in ISO 8601 format (YYYY-MM-DD).
Express durations and periods as integers.

The JSON object must have exactly these fields:
{
  "vendor_name": string | null,
  "vendor_contact_name": string | null,
  "vendor_contact_email": string | null,
  "internal_group_entity": string | null,
  "start_date": "YYYY-MM-DD" | null,
  "end_date": "YYYY-MM-DD" | null,
  "duration_months": integer | null,
  "term_type": "fixed" | "indefinite" | null,
  "auto_renewal": boolean | null,
  "renewal_period_months": integer | null,
  "renewal_notice_period_value": integer | null,
  "renewal_notice_period_unit": "months" | "days" | null,
  "confidence": {
    "vendor_name": "high" | "medium" | "low",
    "start_date": "high" | "medium" | "low",
    "end_date": "high" | "medium" | "low",
    "term_type": "high" | "medium" | "low",
    "auto_renewal": "high" | "medium" | "low",
    "renewal_notice_period_value": "high" | "medium" | "low"
  }
}`;

// ─── Text conversion ─────────────────────────────────────────────────────────

/** Converts a PDF buffer to plain text. Throws if the file has no text layer. */
async function pdfToText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  if (!result.text.trim()) {
    throw new Error("No text layer found — the PDF may be a scanned image.");
  }
  return result.text;
}

/** Converts a DOCX buffer to plain text. */
async function docxToText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Converts a contract file buffer to plain text.
 * §12.6: Throws if text cannot be extracted (e.g. scanned image PDF).
 */
export async function convertToText(
  buffer: Buffer,
  fileFormat: string,
): Promise<string> {
  if (fileFormat === "pdf") return pdfToText(buffer);
  if (fileFormat === "docx") return docxToText(buffer);
  throw new Error(`Unsupported format: ${fileFormat}`);
}

// ─── Claude API call ──────────────────────────────────────────────────────────

interface RawExtractionResponse {
  vendor_name: string | null;
  vendor_contact_name: string | null;
  vendor_contact_email: string | null;
  internal_group_entity: string | null;
  start_date: string | null;
  end_date: string | null;
  duration_months: number | null;
  term_type: string | null;
  auto_renewal: boolean | null;
  renewal_period_months: number | null;
  renewal_notice_period_value: number | null;
  renewal_notice_period_unit: string | null;
  confidence: {
    vendor_name: ConfidenceLevel;
    start_date: ConfidenceLevel;
    end_date: ConfidenceLevel;
    term_type: ConfidenceLevel;
    auto_renewal: ConfidenceLevel;
    renewal_notice_period_value: ConfidenceLevel;
  };
}

/**
 * Calls the Claude API with the §12.3 system prompt and returns structured
 * extraction output with per-field confidence ratings per §12.4.
 * §12.6: Returns handleExtractionFailure() on malformed JSON or API error.
 */
export async function extractContractProperties(
  text: string,
): Promise<{ extracted: ExtractionOutput; confidence: ConfidenceRatings }> {
  let rawJson: string;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Extract contract properties from the following document text:\n\n${text}`,
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type");
    rawJson = block.text.trim();
  } catch {
    return handleExtractionFailure();
  }

  try {
    const parsed = JSON.parse(rawJson) as RawExtractionResponse;
    const { confidence: conf, ...fields } = parsed;
    const extracted: ExtractionOutput = {
      vendor_name: fields.vendor_name,
      vendor_contact_name: fields.vendor_contact_name,
      vendor_contact_email: fields.vendor_contact_email,
      internal_group_entity: fields.internal_group_entity,
      start_date: fields.start_date,
      end_date: fields.end_date,
      duration_months: typeof fields.duration_months === "number" ? fields.duration_months : null,
      term_type: fields.term_type === "fixed" || fields.term_type === "indefinite" ? fields.term_type : null,
      auto_renewal: typeof fields.auto_renewal === "boolean" ? fields.auto_renewal : null,
      renewal_period_months: typeof fields.renewal_period_months === "number" ? fields.renewal_period_months : null,
      renewal_notice_period_value: typeof fields.renewal_notice_period_value === "number" ? fields.renewal_notice_period_value : null,
      renewal_notice_period_unit: fields.renewal_notice_period_unit === "months" || fields.renewal_notice_period_unit === "days" ? fields.renewal_notice_period_unit : null,
    };
    const confidence: ConfidenceRatings = {
      vendor_name: conf?.vendor_name ?? "low",
      start_date: conf?.start_date ?? "low",
      end_date: conf?.end_date ?? "low",
      term_type: conf?.term_type ?? "low",
      auto_renewal: conf?.auto_renewal ?? "low",
      renewal_notice_period_value: conf?.renewal_notice_period_value ?? "low",
    };
    return { extracted, confidence };
  } catch {
    // §12.6 — malformed JSON from Claude
    return handleExtractionFailure();
  }
}

// ─── §12.6 Failure fallback ───────────────────────────────────────────────────

const low: ConfidenceLevel = "low";

/** Returns all-null fields with all-low confidence per §12.6. */
export function handleExtractionFailure(): {
  extracted: ExtractionOutput;
  confidence: ConfidenceRatings;
} {
  return {
    extracted: {
      vendor_name: null, vendor_contact_name: null, vendor_contact_email: null,
      internal_group_entity: null, start_date: null, end_date: null,
      duration_months: null, term_type: null, auto_renewal: null,
      renewal_period_months: null, renewal_notice_period_value: null,
      renewal_notice_period_unit: null,
    },
    confidence: {
      vendor_name: low, start_date: low, end_date: low,
      term_type: low, auto_renewal: low, renewal_notice_period_value: low,
    },
  };
}
