import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";
import { CategoryManagement } from "./category-management";

export default async function AdminCategoriesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    redirect("/tickets");
  }

  const allCategories = await db.select().from(categories).orderBy(categories.name);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Category Management</h1>
      <CategoryManagement initialCategories={allCategories} />
    </div>
  );
}