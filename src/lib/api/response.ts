import { NextResponse } from "next/server";
import type { ApiError } from "@/types";

export function ok<T>(data: T): NextResponse {
  return NextResponse.json({ data }, { status: 200 });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ data }, { status: 201 });
}

export function notFound(message = "Not found"): NextResponse {
  return NextResponse.json({ error: message } satisfies ApiError, {
    status: 404,
  });
}

export function forbidden(message = "Insufficient permissions"): NextResponse {
  return NextResponse.json({ error: message } satisfies ApiError, {
    status: 403,
  });
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message } satisfies ApiError, {
    status: 400,
  });
}

/**
 * Converts a thrown error into a NextResponse.
 * Auth helpers throw Error objects with a `status` property attached —
 * this handler reads that property to preserve the intended HTTP status.
 */
export function handleError(error: unknown): NextResponse {
  if (error instanceof Error) {
    const status =
      "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    const message =
      status < 500 ? error.message : "Something went wrong. Please try again.";
    return NextResponse.json({ error: message } satisfies ApiError, {
      status,
    });
  }
  return NextResponse.json(
    { error: "Something went wrong. Please try again." } satisfies ApiError,
    { status: 500 },
  );
}
