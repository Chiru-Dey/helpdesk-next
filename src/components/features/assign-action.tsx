"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface StaffMember { id: number; name: string; role: string }

export function AssignAction({ ticketId, currentAssignee }: { ticketId: number; currentAssignee: number | null }) {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users", { headers: { "Content-Type": "application/json" } })
      .then((r) => r.ok ? r.json() : null)
      .then((b) => { if (b?.items) setStaff(b.items.filter((u: StaffMember) => u.role === "agent" || u.role === "admin")); });
  }, []);

  async function assign(id: number | null) {
    setBusy(true); setError(null);
    const res = await fetch(`/api/tickets/${ticketId}/assign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignee_id: id }) });
    if (!res.ok) { const b = await res.json().catch(() => null); setError(b?.error?.message ?? "Failed."); }
    setBusy(false); router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h2 className="text-sm font-semibold text-slate-200">Assign</h2>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      <select className="mt-3 block w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100" disabled={busy} value={currentAssignee ?? ""} onChange={(e) => assign(e.target.value === "" ? null : Number(e.target.value))}>
        <option value="">Unassigned</option>
        {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
      </select>
    </div>
  );
}