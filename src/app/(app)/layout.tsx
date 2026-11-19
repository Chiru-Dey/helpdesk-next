import { redirect } from "next/navigation";
import { TopNav } from "@/components/features/top-nav";
import { getSessionUser } from "@/lib/auth/session";

export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <main className="min-h-screen bg-slate-950">
      <TopNav user={user} />
      {children}
    </main>
  );
}