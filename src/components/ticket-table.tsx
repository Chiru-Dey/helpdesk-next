import Link from "next/link";
import type { TicketPriority, TicketStatus } from "@/lib/schema";
import type { TicketSummary } from "@/lib/tickets/service";
import { PriorityBadge, StatusBadge } from "./badges";

interface Props {
  items: TicketSummary[];
  page: number;
  pageSize: number;
  total: number;
  status?: TicketStatus;
  priority?: TicketPriority;
}

function hrefFor(page: number, props: Props): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(props.pageSize));
  if (props.status) params.set("status", props.status);
  if (props.priority) params.set("priority", props.priority);
  return `/tickets?${params.toString()}`;
}

export function TicketTable(props: Props) {
  const { items, page, pageSize, total } = props;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (items.length === 0) {
    return (
      <p className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
        No tickets found for this view.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950">
            {items.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-slate-900/60">
                <td className="px-4 py-3 font-mono text-xs text-slate-400">
                  {ticket.number}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="text-slate-100 hover:text-emerald-300"
                  >
                    {ticket.subject}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {ticket.customer_name}
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {ticket.assignee_name ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {ticket.created_at.slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>
          Page {page} of {totalPages} · {total} total
        </span>
        <span className="flex gap-2">
          {page > 1 ? (
            <Link
              href={hrefFor(page - 1, props)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-200 hover:border-slate-500"
            >
              Previous
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link
              href={hrefFor(page + 1, props)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-200 hover:border-slate-500"
            >
              Next
            </Link>
          ) : null}
        </span>
      </div>
    </div>
  );
}