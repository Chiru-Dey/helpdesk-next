import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Support Portal
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-50">
          HelpDesk
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Customer-support ticketing with Admin, Agent and Customer roles,
          protected by a strict ticket state machine.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/login"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500"
          >
            Create account
          </Link>
          <a
            href="/api/health"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500"
          >
            API health
          </a>
        </div>
      </div>
    </main>
  );
}