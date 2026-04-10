/**
 * Client-side API helpers for contract operations.
 * Called from client components (not API routes).
 */

/** POST /api/contracts/[id]/confirm-action — marks action taken, resets to Active. */
export async function confirmAction(contractId: string): Promise<void> {
  const res = await fetch(`/api/contracts/${contractId}/confirm-action`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Failed to confirm action. Please try again.");
  }
}
