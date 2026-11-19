import Link from "next/link";
import type { PaginationMeta } from "@/lib/api/pagination";
import type { TicketItem } from "@/lib/services/tickets";
import { PriorityBadge, StatusBadge } from "../ui/badges";

interface Props { items: TicketItem[]; meta: PaginationMeta; filters: Record<string, string> }

function pageHref(page: number, filters: Record<string, string>): string {
  const p = new URLSearchParams();
  p.set("page", String(page));
  p.set("per_page", String(meta_per(filters)));
  for (const k of ["status", "priority", "search"]) if (filters[k]) p.set(k, filters[k]);
  return `/tickets?${p}`;
}
function meta_per(f: Record<string, string>): number { return Number(f.per_page) || 20; }

export function TicketTable({ items, meta, filters }: Props) {
  if (items.length === 0) return <p className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">No tickets found.</p>;
  return (
    <div className="mt-6">
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase text-slate-400"><tr><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Assignee</th><th className="px-4 py-3">Created</th></tr></thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950">
            {items.map((t) => (
              <tr key={t.id} className="hover:bg-slate-900/60">
                <td className="px-4 py-3"><Link href={`/tickets/${t.id}`} prefetch={true} className="text-slate-100 hover:text-emerald-300">{t.subject}</Link></td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                <td className="px-4 py-3 text-slate-300">{t.customer_name}</td>
                <td className="px-4 py-3 text-slate-300">{t.assignee_name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-400">{t.created_at.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>Page {meta.page} of {meta.pages} · {meta.total} total</span>
        <span className="flex gap-2">
          {meta.page > 1 && <Link href={pageHref(meta.page - 1, filters)} prefetch={true} className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-200 hover:border-slate-500">Prev</Link>}
          {meta.page < meta.pages && <Link href={pageHref(meta.page + 1, filters)} prefetch={true} className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-200 hover:border-slate-500">Next</Link>}
        </span>
      </div>
    </div>
  );
}