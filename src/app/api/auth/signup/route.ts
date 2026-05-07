/**
 * POST /api/auth/signup — RETIRED
 *
 * This endpoint has been removed. Tenant and user provisioning is now handled
 * exclusively by the Clerk webhook at POST /api/webhooks/clerk (user.created event).
 */
export async function POST(): Promise<Response> {
  return new Response(
    JSON.stringify({
      error: "Gone",
      message: "This endpoint has been retired. User provisioning is handled by the Clerk webhook.",
    }),
    { status: 410, headers: { "Content-Type": "application/json" } },
  );
}
