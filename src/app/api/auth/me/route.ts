import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: { code: "unauthenticated", message: "Authentication required." } }, { status: 401 });
  }
  const rows = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  const user = rows[0];
  if (!user || !user.isActive) {
    return NextResponse.json({ error: { code: "unauthenticated", message: "Authentication required." } }, { status: 401 });
  }
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.createdAt.toISOString() });
}