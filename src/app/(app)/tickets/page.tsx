import { redirect } from "next/navigation";
import { TicketTable } from "@/components/features/ticket-table";
import { getSessionUser } from "@/lib/auth/session";
import { listTickets } from "@/lib/services/tickets";

export const instant = false;

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TicketsPage({ searchParams }: Props) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const raw = await searchParams;
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") flat[k] = v;
  }

  const { items, meta } = await listTickets(user, flat);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-50">Tickets</h1>
        <form method="get" action="/tickets" className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-slate-300">Search
            <input name="search" defaultValue={flat.search ?? ""} className="mt-1 block rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100" />
          </label>
          <label className="text-sm text-slate-300">Status
            <select name="status" defaultValue={flat.status ?? ""} className="mt-1 block rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100">
              <option value="">All</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
            </select>
          </label>
          <label className="text-sm text-slate-300">Priority
            <select name="priority" defaultValue={flat.priority ?? ""} className="mt-1 block rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100">
              <option value="">All</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
            </select>
          </label>
          <button type="submit" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-500">Filter</button>
        </form>
      </div>
      <TicketTable items={items} meta={meta} filters={flat} />
    </div>
  );
}