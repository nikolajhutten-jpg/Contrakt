"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMyProfile } from "@/lib/api/users";
import type { User } from "@/types";

interface ProfileFormProps {
  user: User;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [slackUserId, setSlackUserId] = useState(user.slackUserId ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateMyProfile({
          name: name.trim(),
          email: email.trim(),
          slackUserId: slackUserId.trim() || null,
        });
        setSaved(true);
        router.refresh();
      } catch {
        setError("Failed to save profile. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-5">
      {/* Identity */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Identity</h2>
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Display name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Slack */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Slack</h2>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Slack user ID</label>
          <input
            type="text"
            value={slackUserId}
            onChange={(e) => setSlackUserId(e.target.value)}
            placeholder="U012AB3CD (optional)"
            className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder-gray-400"
          />
          <p className="text-xs text-gray-400">
            Used for personal Slack DM alerts. Find yours in your Slack profile.
          </p>
        </div>
      </div>

      {/* Notification preferences */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-1">
          Notification preferences
        </h2>
        <p className="text-xs text-gray-400 mb-0">
          Alert channels (email, Slack, or both) are configured per contract in
          the Alerts tab on each contract's detail page.
        </p>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {saved && <p className="text-xs text-green-600">Profile saved.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-1.5 text-sm font-medium text-white bg-gray-900 rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
