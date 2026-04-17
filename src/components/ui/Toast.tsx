"use client";

import { createContext, useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "warning";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

export interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "error") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, variant }]);
      // Auto-dismiss after 4 seconds (§14.6)
      timers.current.set(id, setTimeout(() => dismiss(id), 4000));
    },
    [dismiss],
  );

  // Clear all timers on unmount
  useEffect(() => {
    const map = timers.current;
    return () => map.forEach(clearTimeout);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: "fixed",
          bottom: "16px",
          right: "16px",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <ToastBadge key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Toast UI ─────────────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, React.CSSProperties> = {
  success: { color: "#1a7f4b" },
  error:   { color: "#c0392b" },
  warning: { color: "#b45309" },
};

const ICONS: Record<ToastVariant, string> = {
  success: "✓",
  error:   "✕",
  warning: "!",
};

interface ToastBadgeProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

function ToastBadge({ toast, onDismiss }: ToastBadgeProps) {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 14px",
        borderRadius: "12px",
        background: "#ffffff",
        border: "0.5px solid rgba(0,0,0,0.1)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        fontSize: "13px",
        maxWidth: "320px",
        pointerEvents: "auto",
        ...VARIANT_STYLES[toast.variant],
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: "16px",
          height: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: "currentColor",
          color: "#ffffff",
          fontSize: "10px",
          fontWeight: 700,
        }}
      >
        {ICONS[toast.variant]}
      </span>
      <span style={{ flex: 1, color: "#171717" }}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        style={{
          marginLeft: "4px",
          opacity: 0.4,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          lineHeight: 1,
          color: "#171717",
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
