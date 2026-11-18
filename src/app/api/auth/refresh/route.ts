import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { recordAudit } from "@/lib/audit";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  cookieOptionsPublic,
  getRequestInfo,
} from "@/lib/auth/session";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";
import { users } from "@/lib/schema";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  rotateRefreshToken,
  signAccessToken,
} from "@/lib/auth/tokens";

export async function POST() {
  const store = await cookies();
  const presented = store.get(REFRESH_COOKIE)?.value;
  const requestInfo = await getRequestInfo();

  if (!presented) {
    return errorResponse(401, "unauthenticated", "No refresh token provided.");
  }

  const result = await rotateRefreshToken(presented, requestInfo);

  if (result.status === "reuse_detected") {
    await recordAudit({
      actorId: null,
      action: "auth.refresh_reuse_detected",
      entityType: "refresh_token_family",
      entityId: result.familyId,
      metadata: { outcome: "family_revoked" },
      ipAddress: requestInfo.ipAddress,
    });
    const body = errorResponse(
      401,
      "unauthenticated",
      "Session revoked. Please sign in again.",
    );
    clearSessionCookies(body);
    return body;
  }

  if (result.status === "invalid" || result.status === "expired") {
    const body = errorResponse(
      401,
      "unauthenticated",
      "Session expired. Please sign in again.",
    );
    clearSessionCookies(body);
    return body;
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, result.userId))
    .limit(1);
  const user = rows[0];
  if (!user || !user.isActive) {
    const body = errorResponse(
      401,
      "unauthenticated",
      "Session revoked. Please sign in again.",
    );
    clearSessionCookies(body);
    return body;
  }

  const accessToken = await signAccessToken({
    sub: String(user.id),
    role: user.role,
    email: user.email,
  });

  const body = NextResponse.json({
    data: {
      id: user.id,
      role: user.role,
      email: user.email,
      display_name: user.displayName,
    },
  });
  body.cookies.set(
    ACCESS_COOKIE,
    accessToken,
    cookieOptionsPublic(ACCESS_TOKEN_TTL_SECONDS, "/", "lax"),
  );
  body.cookies.set(
    REFRESH_COOKIE,
    result.token,
    cookieOptionsPublic(REFRESH_TOKEN_TTL_SECONDS, "/api/auth", "strict"),
  );
  return body;
}