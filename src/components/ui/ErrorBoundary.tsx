"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import * as Sentry from "@sentry/nextjs";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * React class error boundary.
 * Catches rendering errors in the child subtree and renders a clean fallback
 * instead of a blank crash screen. Clicking "Try again" clears the error
 * state and re-renders the children.
 *
 * Note: error boundaries do not catch errors inside event handlers or
 * async code — those cases are handled individually at the call site.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "384px", padding: "0 32px", textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <svg
              style={{ width: "20px", height: "20px", color: "rgba(0,0,0,0.3)" }}
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
          <h2 style={{ fontSize: "14px", fontWeight: 500, color: "#171717", marginBottom: "4px" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", marginBottom: "20px", maxWidth: "280px" }}>
            Something went wrong. Please try again.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              fontSize: "13px",
              fontWeight: 500,
              padding: "7px 16px",
              background: "#1a7f4b",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
