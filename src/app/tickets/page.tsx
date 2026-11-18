import { redirect } from "next/navigation";
import { TicketTable } from "@/components/ticket-table";
import { TopNav } from "@/components/top-nav";
import { getCurrentUser } from "@/lib/auth/session";
import { listTicketsQuerySchema } from "@/lib/schemas/tickets";
import { listTickets } from "@/lib/tickets/service";

export const instant = false;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TicketsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const raw = await searchParams;
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") {
      flat[key] = value;
    }
  }
  const parsed = listTicketsQuerySchema.safeParse(flat);
  const query = parsed.success
    ? parsed.data
    : { page: 1, page_size: 20, status: undefined, priority: undefined };

  const { items, total } = await listTickets(user, query);

  return (
    <main className="min-h-screen bg-slate-950">
      <TopNav user={user} />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-50">Tickets</h1>
          <form method="get" action="/tickets" className="flex flex-wrap items-end gap-3">
            <label className="text-sm text-slate-300">
              Status
              <select
                name="status"
                defaultValue={query.status ?? ""}
                className="mt-1 block rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100"
              >
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="waiting_customer">Waiting on customer</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <label className="text-sm text-slate-300">
              Priority
              <select
                name="priority"
                defaultValue={query.priority ?? ""}
                className="mt-1 block rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100"
              >
                <option value="">All</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-500"
            >
              Filter
            </button>
          </form>
        </div>
        <TicketTable
          items={items}
          page={query.page}
          pageSize={query.page_size}
          total={total}
          status={query.status}
          priority={query.priority}
        />
      </div>
    </main>
  );
}