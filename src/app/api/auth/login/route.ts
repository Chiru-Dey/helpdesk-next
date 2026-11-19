import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { fromZodError } from "@/lib/api/respond";
import { verifyTimingSafe } from "@/lib/auth/password";
import { issueSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fromZodError(parsed.error);

  const email = parsed.data.email.toLowerCase();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];

  const valid = await verifyTimingSafe(parsed.data.password, user?.passwordHash ?? null);
  if (!user || !valid) {
    return NextResponse.json({ error: { code: "unauthenticated", message: "Invalid email or password." } }, { status: 401 });
  }
  if (!user.isActive) {
    return NextResponse.json({ error: { code: "forbidden", message: "Account disabled." } }, { status: 403 });
  }

  const body = NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  await issueSession({ id: user.id, role: user.role, email: user.email, name: user.name }, body);
  return body;
}