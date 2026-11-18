import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { getCurrentUser } from "@/lib/auth/session";

export const instant = false;

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/tickets");
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-2xl font-bold text-slate-50">Create account</h1>
        <p className="mt-1 text-sm text-slate-400">
          New accounts start with the customer role.
        </p>
        <RegisterForm />
      </div>
    </main>
  );
}