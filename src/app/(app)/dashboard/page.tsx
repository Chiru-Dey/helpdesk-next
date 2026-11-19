import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getDashboard } from "@/lib/services/dashboard";

export const instant = false;

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role === "customer") redirect("/tickets");

  const data = await getDashboard(user);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-50">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(["open", "in_progress", "resolved", "closed"] as const).map((s) => (
          <div key={s} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400">{s.replace("_", " ")}</p>
            <p className="mt-1 text-3xl font-bold text-slate-50">{data.by_status[s]}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Resolved today</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{data.resolved_today}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Unassigned open</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{data.unassigned_open}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Urgent</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{data.by_priority.urgent}</p>
        </div>
      </div>
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-200">Recent tickets</h2>
        <div className="mt-3 space-y-2">
          {data.recent.map((t) => (
            <a key={t.id} href={`/tickets/${t.id}`} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200 hover:border-slate-600">
              <span>{t.subject}</span>
              <span className="text-xs text-slate-400">{t.status} · {t.priority}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}