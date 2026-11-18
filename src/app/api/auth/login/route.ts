import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import { verifyPasswordTimingSafe } from "@/lib/auth/passwords";
import { getRequestInfo, issueSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { errorResponse, validationError } from "@/lib/http";
import { users } from "@/lib/schema";
import { loginSchema } from "@/lib/schemas/auth";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const email = parsed.data.email.toLowerCase();
  const requestInfo = await getRequestInfo();

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const user = rows[0];

  const passwordValid = await verifyPasswordTimingSafe(
    parsed.data.password,
    user?.passwordHash ?? null,
  );
  if (!user || !passwordValid) {
    await recordAudit({
      actorId: user?.id ?? null,
      action: "auth.login_failed",
      entityType: "user",
      entityId: user ? String(user.id) : email,
      metadata: { reason: "invalid_credentials" },
      ipAddress: requestInfo.ipAddress,
    });
    return errorResponse(401, "unauthenticated", "Invalid email or password.");
  }

  if (!user.isActive) {
    return errorResponse(403, "forbidden", "This account is disabled.");
  }

  await recordAudit({
    actorId: user.id,
    action: "auth.login",
    entityType: "user",
    entityId: String(user.id),
    ipAddress: requestInfo.ipAddress,
  });

  const body = NextResponse.json({
    data: {
      id: user.id,
      role: user.role,
      email: user.email,
      display_name: user.displayName,
    },
  });
  await issueSession(user.id, user.role, user.email, body, requestInfo);
  return body;
}