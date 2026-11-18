import type { TicketPriority, TicketStatus } from "@/lib/schema";

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "border-sky-800 bg-sky-500/15 text-sky-300",
  in_progress: "border-amber-800 bg-amber-500/15 text-amber-300",
  waiting_customer: "border-violet-800 bg-violet-500/15 text-violet-300",
  resolved: "border-emerald-800 bg-emerald-500/15 text-emerald-300",
  closed: "border-slate-700 bg-slate-500/15 text-slate-300",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting_customer: "Waiting on customer",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: "border-slate-700 bg-slate-500/15 text-slate-300",
  medium: "border-sky-800 bg-sky-500/15 text-sky-300",
  high: "border-orange-800 bg-orange-500/15 text-orange-300",
  urgent: "border-red-800 bg-red-500/15 text-red-300",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs ${PRIORITY_STYLES[priority]}`}
    >
      {priority.replace("_", " ")}
    </span>
  );
}