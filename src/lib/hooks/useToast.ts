"use client";

import { useContext } from "react";
import { ToastContext } from "@/components/ui/Toast";
import type { ToastContextValue } from "@/components/ui/Toast";

/**
 * Hook for triggering toast notifications from client components.
 * Must be rendered inside a <ToastProvider>.
 *
 * Defaults to the "error" variant, which shows the §14.6 generic error message.
 *
 * @example
 * const { showToast } = useToast();
 * showToast("Something went wrong. Please try again.");          // error (default)
 * showToast("Settings saved.", "success");
 * showToast("You appear to be offline.", "warning");
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>.");
  }
  return ctx;
}
