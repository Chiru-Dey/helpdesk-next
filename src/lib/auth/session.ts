import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { errorResponse } from "../http";
import { users, type Role, type User } from "../schema";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  createRefreshToken,
  signAccessToken,
  verifyAccessToken,
  type RequestInfo,
} from "./tokens";

export const ACCESS_COOKIE = "hd_access";
export const REFRESH_COOKIE = "hd_refresh";

export function cookieOptionsPublic(
  maxAge: number,
  path: string,
  sameSite: "lax" | "strict",
) {
  return {
    httpOnly: true,
    sameSite,
    secure: process.env.NODE_ENV === "production",
    path,
    maxAge,
  };
}

export async function getRequestInfo(): Promise<RequestInfo> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ipAddress = forwarded
    ? forwarded.split(",")[0]?.trim() ?? null
    : headerStore.get("x-real-ip");
  return { userAgent: headerStore.get("user-agent"), ipAddress };
}

export async function issueSession(
  userId: number,
  role: Role,
  email: string,
  response: NextResponse,
  requestInfo: RequestInfo,
): Promise<void> {
  const accessToken = await signAccessToken({
    sub: String(userId),
    role,
    email,
  });
  const refresh = await createRefreshToken(userId, null, requestInfo);
  response.cookies.set(
    ACCESS_COOKIE,
    accessToken,
    cookieOptionsPublic(ACCESS_TOKEN_TTL_SECONDS, "/", "lax"),
  );
  response.cookies.set(
    REFRESH_COOKIE,
    refresh.token,
    cookieOptionsPublic(REFRESH_TOKEN_TTL_SECONDS, "/api/auth", "strict"),
  );
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE, "", {
    ...cookieOptionsPublic(ACCESS_TOKEN_TTL_SECONDS, "/", "lax"),
    maxAge: 0,
  });
  response.cookies.set(REFRESH_COOKIE, "", {
    ...cookieOptionsPublic(REFRESH_TOKEN_TTL_SECONDS, "/api/auth", "strict"),
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return null;
  }
  const payload = await verifyAccessToken(accessToken);
  if (!payload) {
    return null;
  }
  const userId = Number(payload.sub);
  if (!Number.isInteger(userId)) {
    return null;
  }
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const user = rows[0];
  if (!user || !user.isActive) {
    return null;
  }
  return user;
}

export type GuardResult =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse };

export async function requireAuth(): Promise<GuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: errorResponse(401, "unauthenticated", "Authentication required."),
    };
  }
  return { ok: true, user };
}

export async function requireRole(...roles: Role[]): Promise<GuardResult> {
  const base = await requireAuth();
  if (!base.ok) {
    return base;
  }
  if (!roles.includes(base.user.role)) {
    return {
      ok: false,
      response: errorResponse(
        403,
        "forbidden",
        "You do not have permission to perform this action.",
      ),
    };
  }
  return base;
}