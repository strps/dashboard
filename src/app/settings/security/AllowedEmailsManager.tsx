"use client";

import { useState, useTransition } from "react";
import { Trash2, ShieldCheck, Shield } from "lucide-react";

import type { AllowedEmailRecord } from "@/lib/dal/allowedEmails";

import {
  addAllowedEmailAction,
  removeAllowedEmailAction,
  setAllowedEmailAdminAction,
} from "../actions";

interface Props {
  initialEmails: AllowedEmailRecord[];
}

export function AllowedEmailsManager({ initialEmails }: Props) {
  const [emails, setEmails] = useState(initialEmails);
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const value = email.trim().toLowerCase();
    if (!value || !value.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    startTransition(async () => {
      try {
        const row = await addAllowedEmailAction(value, isAdmin);
        setEmails((prev) => {
          const without = prev.filter((p) => p.email !== row.email);
          return [...without, row];
        });
        setEmail("");
        setIsAdmin(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add email.");
      }
    });
  }

  function onRemove(target: string) {
    startTransition(async () => {
      await removeAllowedEmailAction(target);
      setEmails((prev) => prev.filter((p) => p.email !== target));
    });
  }

  function onToggleAdmin(target: string, next: boolean) {
    setEmails((prev) =>
      prev.map((p) => (p.email === target ? { ...p, isAdmin: next } : p)),
    );
    startTransition(async () => {
      try {
        await setAllowedEmailAdminAction(target, next);
      } catch {
        setEmails((prev) =>
          prev.map((p) =>
            p.email === target ? { ...p, isAdmin: !next } : p,
          ),
        );
      }
    });
  }

  return (
    <div className="space-y-5">
      <form
        onSubmit={onAdd}
        className="flex flex-col gap-3 p-4 rounded-lg border border-white/10 bg-white/[0.02]"
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            placeholder="person@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
            className="flex-1 px-3 py-2 rounded-md bg-white/5 border border-white/10 placeholder-white/30 text-sm focus:outline-none focus:border-white/30"
          />
          <label className="flex items-center gap-2 text-xs text-white/70 px-2">
            <input
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              disabled={pending}
              className="accent-white"
            />
            Admin
          </label>
          <button
            type="submit"
            disabled={pending}
            className="px-4 py-2 rounded-md bg-white text-neutral-950 text-sm font-medium disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>

      <div className="rounded-lg border border-white/10 overflow-hidden">
        {emails.length === 0 ? (
          <div className="px-4 py-6 text-xs text-white/40">
            No emails on the allowlist yet.
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {emails.map((row) => (
              <li
                key={row.email}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <span className="flex-1 text-sm text-white/80 truncate">
                  {row.email}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleAdmin(row.email, !row.isAdmin)}
                  disabled={pending}
                  title={row.isAdmin ? "Revoke admin" : "Grant admin"}
                  className={[
                    "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors",
                    row.isAdmin
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white/70 hover:bg-white/5",
                  ].join(" ")}
                >
                  {row.isAdmin ? (
                    <ShieldCheck size={12} />
                  ) : (
                    <Shield size={12} />
                  )}
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(row.email)}
                  disabled={pending}
                  title="Remove from allowlist"
                  className="p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
