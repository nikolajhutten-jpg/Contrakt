"use client";

import { useState, useTransition } from "react";
import { signup } from "@/lib/api/auth";

type FormState = "idle" | "submitting" | "success" | "error";

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
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Check your email
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          We've sent a verification link to{" "}
          <span className="font-medium text-gray-700">{fields.email}</span>.
          Click the link to verify your account and continue to workspace setup.
        </p>
        {/* TODO: remove this dev shortcut once Auth0 email verification is wired */}
        <a
          href="/setup"
          className="inline-block px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors"
        >
          Continue to setup (dev)
        </a>
      </div>
    );
  }

  const busy = state === "submitting" || isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company name
        </label>
        <input
          type="text"
          required
          value={fields.companyName}
          onChange={set("companyName")}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
          placeholder="Acme Corp"
          disabled={busy}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full name
        </label>
        <input
          type="text"
          required
          value={fields.name}
          onChange={set("name")}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
          placeholder="Jane Smith"
          disabled={busy}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Work email
        </label>
        <input
          type="email"
          required
          value={fields.email}
          onChange={set("email")}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
          placeholder="jane@acme.com"
          disabled={busy}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={fields.password}
          onChange={set("password")}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
          placeholder="Min. 8 characters"
          disabled={busy}
        />
      </div>

      {state === "error" && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full bg-gray-900 text-white text-sm font-medium py-2 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {busy ? "Creating account…" : "Create account"}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Already have an account?{" "}
        <a href="/api/auth/login" className="underline">
          Sign in
        </a>
      </p>
    </form>
  );
}
