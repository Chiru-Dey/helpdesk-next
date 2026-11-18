import { redirect } from "next/navigation";
import { NewTicketForm } from "@/components/new-ticket-form";
import { TopNav } from "@/components/top-nav";
import { getCurrentUser } from "@/lib/auth/session";

export const instant = false;

export default async function NewTicketPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const isStaff = user.role === "admin" || user.role === "agent";
  return (
    <main className="min-h-screen bg-slate-950">
      <TopNav user={user} />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-50">New ticket</h1>
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <NewTicketForm isStaff={isStaff} />
        </div>
      </div>
    </main>
  );
}