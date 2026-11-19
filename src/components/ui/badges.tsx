import type { TicketPriority, TicketStatus } from "@/lib/db/schema";

const S: Record<TicketStatus, string> = {
  open: "border-sky-800 bg-sky-500/15 text-sky-300",
  in_progress: "border-amber-800 bg-amber-500/15 text-amber-300",
  resolved: "border-emerald-800 bg-emerald-500/15 text-emerald-300",
  closed: "border-slate-700 bg-slate-500/15 text-slate-300",
};
const P: Record<TicketPriority, string> = {
  low: "border-slate-700 bg-slate-500/15 text-slate-300",
  medium: "border-sky-800 bg-sky-500/15 text-sky-300",
  high: "border-orange-800 bg-orange-500/15 text-orange-300",
  urgent: "border-red-800 bg-red-500/15 text-red-300",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${S[status]}`}>{status.replace("_", " ")}</span>;
}
export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${P[priority]}`}>{priority}</span>;
}