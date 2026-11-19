import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { listCategories } from "@/lib/services/categories";

export const instant = false;

export default async function AdminCategoriesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");
  const items = await listCategories();
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-50">Categories</h1>
      <div className="mt-6 space-y-3">
        {items.map((c) => (
          <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="font-semibold text-slate-100">{c.name}</p>
            {c.description && <p className="mt-1 text-sm text-slate-400">{c.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}