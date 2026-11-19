"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Role, TicketStatus } from "@/lib/db/schema";
import { allowed } from "@/lib/tickets/transitions";

export function StatusActions({ ticketId, status, role }: { ticketId: number; status: TicketStatus; role: Role }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = allowed(status, role);
  async function transition(to: TicketStatus) {
    setBusy(true); setError(null);
    const res = await fetch(`/api/tickets/${ticketId}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: to }) });
    if (!res.ok) { const b = await res.json().catch(() => null); setError(b?.error?.message ?? "Failed."); setBusy(false); return; }
    setBusy(false); router.refresh();
  }
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h2 className="text-sm font-semibold text-slate-200">Status</h2>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.length === 0 && <p className="text-sm text-slate-400">No transitions available.</p>}
        {options.map((to) => (
          <button key={to} type="button" disabled={busy} onClick={() => transition(to)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-100 hover:border-emerald-500 disabled:opacity-60">→ {to.replace("_", " ")}</button>
        ))}
      </div>
    </div>
  );
}