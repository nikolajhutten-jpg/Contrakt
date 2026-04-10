"use client";

import Button from "@/components/ui/Button";

interface EmptyStateProps {
  heading: string;
  subtext: string;
  actionLabel: string;
  onAction: () => void;
}

/**
 * Full-page empty state shown when a list has no items (§14.6).
 * Never shows a blank screen — always provides a clear call-to-action.
 */
export default function EmptyState({
  heading,
  subtext,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Illustrated placeholder — a simple geometric shape keeps it clean */}
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
      </div>

      <h3 className="text-base font-medium text-gray-900">{heading}</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-xs">{subtext}</p>

      <div className="mt-5">
        <Button onClick={onAction}>{actionLabel}</Button>
      </div>
    </div>
  );
}
