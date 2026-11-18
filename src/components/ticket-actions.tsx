"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Role, TicketStatus } from "@/lib/schema";
import { allowedTransitions } from "@/lib/tickets/state-machine";

interface Props {
  ticketId: number;
  status: TicketStatus;
  role: Role;
  assigneeId: number | null;
}

interface UserOption {
  id: number;
  role: string;
  display_name: string;
}

export function TicketActions({ ticketId, status, role, assigneeId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<UserOption[]>([]);
  const isStaff = role === "admin" || role === "agent";

  useEffect(() => {
    if (!isStaff) {
      return;
    }
    let cancelled = false;
    void fetch("/api/users")
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => {
        if (!cancelled && body) {
          setStaff(
            (body.data as UserOption[]).filter(
              (member) => member.role === "agent" || member.role === "admin",
            ),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isStaff]);

  async function patch(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const parsed = await response.json().catch(() => null);
      setError(parsed?.error?.message ?? "Update failed.");
      setBusy(false);
      return;
    }
    setBusy(false);
    router.refresh();
  }

  const transitions = allowedTransitions(status, role);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <h2 className="text-sm font-semibold text-slate-200">Actions</h2>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {transitions.length === 0 ? (
          <p className="text-sm text-slate-400">
            No transitions available for your role in this status.
          </p>
        ) : null}
        {transitions.map((to) => (
          <button
            key={to}
            type="button"
            disabled={busy}
            onClick={() => void patch({ status: to })}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-100 transition hover:border-emerald-500 disabled:opacity-60"
          >
            Mark {to.replace(/_/g, " ")}
          </button>
        ))}
      </div>
      {isStaff ? (
        <label className="mt-4 block text-sm text-slate-300">
          Assignee
          <select
            className="mt-1 block rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100"
            defaultValue={assigneeId === null ? "" : String(assigneeId)}
            disabled={busy}
            onChange={(event) => {
              const value = event.target.value;
              void patch({
                assignee_id: value === "" ? null : Number(value),
              });
            }}
          >
            <option value="">Unassigned</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.display_name} ({member.role})
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}