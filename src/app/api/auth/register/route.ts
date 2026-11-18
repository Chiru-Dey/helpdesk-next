import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/passwords";
import { getRequestInfo, issueSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { errorResponse, validationError } from "@/lib/http";
import { users } from "@/lib/schema";
import { registerSchema } from "@/lib/schemas/auth";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return errorResponse(
      409,
      "conflict",
      "An account with this email already exists.",
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const inserted = await db
    .insert(users)
    .values({
      role: "customer",
      email,
      passwordHash,
      displayName: parsed.data.display_name,
    })
    .$returningId();
  const userId = inserted[0].id;

  const requestInfo = await getRequestInfo();
  await recordAudit({
    actorId: userId,
    action: "auth.register",
    entityType: "user",
    entityId: String(userId),
    ipAddress: requestInfo.ipAddress,
  });

  const body = NextResponse.json(
    {
      data: {
        id: userId,
        role: "customer",
        email,
        display_name: parsed.data.display_name,
      },
    },
    { status: 201 },
  );
  await issueSession(userId, "customer", email, body, requestInfo);
  return body;
}