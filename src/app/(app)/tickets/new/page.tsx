import { redirect } from "next/navigation";
import { NewTicketForm } from "@/components/features/new-ticket-form";
import { getSessionUser } from "@/lib/auth/session";

export const instant = false;

export default async function NewTicketPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-50">New ticket</h1>
      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <NewTicketForm />
      </div>
    </div>
  );
}