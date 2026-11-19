import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listUsers } from "@/lib/services/users";

export const instant = false;

export default async function AdminUsersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");
  const items = await listUsers(user);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-50">Users</h1>
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-xs uppercase text-slate-400">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Active</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-950">
            {items.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-slate-200">{u.name}</td>
                <td className="px-4 py-3 text-slate-300">{u.email}</td>
                <td className="px-4 py-3 text-slate-300">{u.role}</td>
                <td className="px-4 py-3">{u.is_active ? <span className="text-emerald-400">Yes</span> : <span className="text-red-400">No</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}