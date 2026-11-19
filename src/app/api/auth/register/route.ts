import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { fromZodError } from "@/lib/api/respond";
import { hashPassword } from "@/lib/auth/password";
import { issueSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fromZodError(parsed.error);

  const email = parsed.data.email.toLowerCase();
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (exists[0]) {
    return NextResponse.json({ error: { code: "conflict", message: "Email already registered." } }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const inserted = await db.insert(users).values({
    name: parsed.data.name,
    email,
    passwordHash,
    role: "customer",
  }).$returningId();

  const body = NextResponse.json(
    { id: inserted[0].id, name: parsed.data.name, email, role: "customer" },
    { status: 201 },
  );
  await issueSession({ id: inserted[0].id, role: "customer", email, name: parsed.data.name }, body);
  return body;
}