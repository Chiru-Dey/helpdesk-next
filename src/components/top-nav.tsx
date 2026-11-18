import Link from "next/link";
import type { User } from "@/lib/schema";
import { LogoutButton } from "./logout-button";

export function TopNav({ user }: { user: User }) {
  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/tickets" className="text-lg font-bold text-slate-50">
            HelpDesk
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link href="/tickets" className="hover:text-white">
              Tickets
            </Link>
            {user.role === "customer" ? (
              <Link href="/tickets/new" className="hover:text-white">
                New ticket
              </Link>
            ) : null}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <span className="hidden sm:inline">{user.displayName}</span>
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs uppercase tracking-wide text-emerald-300">
            {user.role}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}