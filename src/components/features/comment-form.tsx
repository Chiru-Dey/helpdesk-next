"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CommentForm({ ticketId }: { ticketId: number }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      setError(b?.error?.message ?? "Failed.");
      setBusy(false);
      return;
    }
    setBody("");
    setBusy(false);
    // Force cache bypass with timestamp
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      {error && <p className="text-sm text-red-300">{error}</p>}
      <textarea
        required
        rows={3}
        placeholder="Write a reply..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
      >
        {busy ? "Posting..." : "Post comment"}
      </button>
    </form>
  );
}