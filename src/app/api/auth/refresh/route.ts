import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ACCESS_TTL, REFRESH_TTL, rotateRefresh, signAccess } from "@/lib/auth/jwt";
import { ACCESS_COOKIE, REFRESH_COOKIE, clearCookies } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

function cookieOpts(maxAge: number, path: string, sameSite: "lax" | "strict") {
  return { httpOnly: true, sameSite, secure: process.env.NODE_ENV === "production", path, maxAge };
}

export async function POST() {
  const store = await cookies();
  const presented = store.get(REFRESH_COOKIE)?.value;
  if (!presented) {
    return NextResponse.json({ error: { code: "unauthenticated", message: "No refresh token." } }, { status: 401 });
  }

  const result = await rotateRefresh(presented);

  if (result.status === "reuse_detected" || result.status === "invalid" || result.status === "expired") {
    const msg = result.status === "reuse_detected" ? "Session revoked due to token reuse." : "Session expired.";
    const body = NextResponse.json({ error: { code: "unauthenticated", message: msg } }, { status: 401 });
    clearCookies(body);
    return body;
  }

  const rows = await db.select().from(users).where(eq(users.id, result.userId)).limit(1);
  const user = rows[0];
  if (!user || !user.isActive) {
    const body = NextResponse.json({ error: { code: "unauthenticated", message: "Account disabled." } }, { status: 401 });
    clearCookies(body);
    return body;
  }

  const access = await signAccess({ sub: String(user.id), role: user.role, email: user.email, name: user.name });
  const body = NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  body.cookies.set(ACCESS_COOKIE, access, cookieOpts(ACCESS_TTL, "/", "lax"));
  body.cookies.set(REFRESH_COOKIE, result.token, cookieOpts(REFRESH_TTL, "/api/auth", "strict"));
  return body;
}