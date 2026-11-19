import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { UserManagement } from "./user-management";

export const instant = false;

export default async function AdminUsersPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    redirect("/tickets");
  }

  const allUsers = await db.select().from(users).orderBy(users.name);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-white">User Management</h1>
      <UserManagement initialUsers={allUsers} />
    </div>
  );
}