"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CommentForm({
  ticketId,
  isStaff,
}: {
  ticketId: number;
  isStaff: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const response = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, is_internal: internal }),
    });
    if (!response.ok) {
      const parsed = await response.json().catch(() => null);
      setError(parsed?.error?.message ?? "Could not post comment.");
      setSubmitting(false);
      return;
    }
    setBody("");
    setInternal(false);
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-3">
      {error ? (
        <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      <textarea
        required
        rows={3}
        placeholder="Write a reply..."
        value={body}
        onChange={(event) => setBody(event.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
      />
      <div className="flex items-center justify-between gap-4">
        {isStaff ? (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={internal}
              onChange={(event) => setInternal(event.target.checked)}
              className="h-4 w-4 accent-amber-400"
            />
            Internal note (hidden from customer)
          </label>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {submitting ? "Posting..." : "Post comment"}
        </button>
      </div>
    </form>
  );
}