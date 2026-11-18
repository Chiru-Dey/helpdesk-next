import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

export async function GET() {
  const guard = await requireRole("admin", "agent");
  if (!guard.ok) {
    return guard.response;
  }
  const rows = await db
    .select({
      id: users.id,
      role: users.role,
      email: users.email,
      display_name: users.displayName,
    })
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(users.displayName);
  return NextResponse.json({ data: rows });
}