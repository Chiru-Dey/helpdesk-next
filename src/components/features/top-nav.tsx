import Link from "next/link";
import type { SessionUser } from "@/lib/auth/session";
import { LogoutButton } from "./logout-button";

export function TopNav({ user }: { user: SessionUser }) {
  return (
    <header className="border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" prefetch={true} className="text-lg font-bold text-slate-50">HelpDesk</Link>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link href="/tickets" prefetch={true} className="hover:text-white">Tickets</Link>
            {user.role !== "customer" && <Link href="/dashboard" prefetch={true} className="hover:text-white">Dashboard</Link>}
            {user.role === "customer" && <Link href="/tickets/new" prefetch={true} className="hover:text-white">New ticket</Link>}
            {user.role === "admin" && <Link href="/admin/users" prefetch={true} className="hover:text-white">Users</Link>}
            {user.role === "admin" && <Link href="/admin/categories" prefetch={true} className="hover:text-white">Categories</Link>}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <span className="hidden sm:inline">{user.name}</span>
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs uppercase text-emerald-300">{user.role}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}