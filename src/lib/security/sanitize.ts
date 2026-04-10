/**
 * Input sanitisation helpers.
 *
 * These are intentionally lightweight — no external library dependency.
 * They operate at the system boundary (user input arriving at API routes)
 * and are not a substitute for parameterised database queries, which Prisma
 * already enforces.
 */

// ─── Text ─────────────────────────────────────────────────────────────────────

/**
 * Strips HTML tags and trims surrounding whitespace.
 * Prevents stored-XSS when user-supplied strings are later rendered in the UI.
 *
 * @example sanitizeText("  <script>alert(1)</script>Hello  ") → "Hello"
 */
export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // strip all HTML tags
    .replace(/&[a-z#0-9]+;/gi, " ") // collapse HTML entities to spaces
    .trim();
}

// ─── Email ────────────────────────────────────────────────────────────────────

// RFC 5321 practical limit: 254 characters; local part up to 64 characters.
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

/**
 * Validates and normalises an email address.
 * Returns the lowercase-trimmed email if valid, or null if invalid.
 *
 * Validation is intentionally lenient — a strict regex rejects valid addresses.
 * Auth0 and SendGrid perform authoritative validation at send time.
 *
 * @example sanitizeEmail("  Jane@Example.COM  ") → "jane@example.com"
 * @example sanitizeEmail("not-an-email")         → null
 */
export function sanitizeEmail(input: string): string | null {
  const normalised = input.trim().toLowerCase();
  if (!EMAIL_RE.test(normalised)) return null;
  return normalised;
}

// ─── UUID ─────────────────────────────────────────────────────────────────────

// UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx (case-insensitive)
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns true if `input` is a well-formed UUID v4 string.
 * Use this to validate all `[id]` path parameters before passing them to
 * database queries, to prevent injection via malformed IDs.
 *
 * @example validateUUID("550e8400-e29b-41d4-a716-446655440000") → true
 * @example validateUUID("'; DROP TABLE users; --")              → false
 */
export function validateUUID(input: string): boolean {
  return UUID_RE.test(input.trim());
}
