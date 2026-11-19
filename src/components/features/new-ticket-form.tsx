"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
export function NewTicketForm({ isStaff }: { isStaff: boolean }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    const res = await fetch("/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, description, priority }) });
    if (!res.ok) { const b = await res.json().catch(() => null); setError(b?.error?.message ?? "Failed."); setBusy(false); return; }
    const b = await res.json(); router.push(`/tickets/${b.id}`); router.refresh();
  }
  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      {error && <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">{error}</p>}
      <label className="block text-sm text-slate-300">Subject<input type="text" required minLength={3} value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500" /></label>
      <label className="block text-sm text-slate-300">Description<textarea required minLength={10} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500" /></label>
      <label className="block text-sm text-slate-300">Priority<select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
      <button type="submit" disabled={busy} className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-60">{busy ? "Creating..." : "Create ticket"}</button>
    </form>
  );
}