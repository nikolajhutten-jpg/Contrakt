"use client";

import { useState, useTransition } from "react";
import { signup } from "@/lib/api/auth";

type FormState = "idle" | "submitting" | "success" | "error";

const FIELD_LABEL: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 500,
  color: "#171717",
  marginBottom: "4px",
};

export default function SignupForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const [fields, setFields] = useState({
    companyName: "",
    name: "",
    email: "",
    password: "",
  });

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setState("submitting");

    startTransition(async () => {
      try {
        await signup(fields);
        setState("success");
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Something went wrong.",
        );
        setState("error");
      }
    });
  }

  if (state === "success") {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#e6f4ec", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <svg style={{ width: "24px", height: "24px", color: "#1a7f4b" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#171717", marginBottom: "8px" }}>
          Check your email
        </h2>
        <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.5)", marginBottom: "24px" }}>
          We&apos;ve sent a verification link to{" "}
          <span style={{ fontWeight: 500, color: "#171717" }}>{fields.email}</span>.
          Click the link to verify your account and continue to workspace setup.
        </p>
        {/* TODO: remove this dev shortcut once Auth0 email verification is wired */}
        <a
          href="/setup"
          style={{
            display: "inline-block",
            fontSize: "13px",
            fontWeight: 500,
            padding: "7px 16px",
            background: "#1a7f4b",
            color: "#ffffff",
            borderRadius: "8px",
            textDecoration: "none",
            letterSpacing: "-0.01em",
          }}
        >
          Continue to setup (dev)
        </a>
      </div>
    );
  }

  const busy = state === "submitting" || isPending;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={FIELD_LABEL}>Company name</label>
        <input
          type="text"
          required
          value={fields.companyName}
          onChange={set("companyName")}
          placeholder="Acme Corp"
          disabled={busy}
        />
      </div>

      <div>
        <label style={FIELD_LABEL}>Full name</label>
        <input
          type="text"
          required
          value={fields.name}
          onChange={set("name")}
          placeholder="Jane Smith"
          disabled={busy}
        />
      </div>

      <div>
        <label style={FIELD_LABEL}>Work email</label>
        <input
          type="email"
          required
          value={fields.email}
          onChange={set("email")}
          placeholder="jane@acme.com"
          disabled={busy}
        />
      </div>

      <div>
        <label style={FIELD_LABEL}>Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={fields.password}
          onChange={set("password")}
          placeholder="Min. 8 characters"
          disabled={busy}
        />
      </div>

      {state === "error" && (
        <p style={{ fontSize: "13px", color: "#c0392b" }}>{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        style={{
          width: "100%",
          fontSize: "13px",
          fontWeight: 500,
          padding: "8px 16px",
          background: "#1a7f4b",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          cursor: busy ? "default" : "pointer",
          opacity: busy ? 0.5 : 1,
          letterSpacing: "-0.01em",
        }}
      >
        {busy ? "Creating account…" : "Create account"}
      </button>

      <p style={{ fontSize: "12px", color: "rgba(0,0,0,0.4)", textAlign: "center" }}>
        Already have an account?{" "}
        <a href="/api/auth/login" style={{ color: "#1a7f4b", textDecoration: "underline" }}>
          Sign in
        </a>
      </p>
    </form>
  );
}
