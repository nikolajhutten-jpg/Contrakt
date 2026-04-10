"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

interface ErrorPageProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

/**
 * Root-level Next.js error page (§14.6).
 * Shown when an uncaught exception escapes a page or layout component.
 * The "Try again" button re-renders the segment via unstable_retry.
 *
 */
export default function ErrorPage({ error, unstable_retry }: ErrorPageProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-8 text-center bg-gray-50">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        Something went wrong. Please try again.
      </p>
      <button
        onClick={unstable_retry}
        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
