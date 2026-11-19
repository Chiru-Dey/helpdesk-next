import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import type { Role } from "../db/schema";
import {
  ACCESS_TTL,
  REFRESH_TTL,
  createRefresh,
  signAccess,
  verifyAccess,
} from "./jwt";

export const ACCESS_COOKIE = "hd_access";
export const REFRESH_COOKIE = "hd_refresh";

export interface SessionUser {
  id: number;
  role: Role;
  email: string;
  name: string;
}

function cookieOpts(maxAge: number, path: string, sameSite: "lax" | "strict") {
  return { httpOnly: true, sameSite, secure: process.env.NODE_ENV === "production", path, maxAge };
}

export async function issueSession(
  user: SessionUser,
  res: NextResponse,
): Promise<void> {
  const access = await signAccess({
    sub: String(user.id),
    role: user.role,
    email: user.email,
    name: user.name,
  });
  const refresh = await createRefresh(user.id);
  res.cookies.set(ACCESS_COOKIE, access, cookieOpts(ACCESS_TTL, "/", "lax"));
  res.cookies.set(REFRESH_COOKIE, refresh, cookieOpts(REFRESH_TTL, "/api/auth", "strict"));
}

export function clearCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, "", { ...cookieOpts(ACCESS_TTL, "/", "lax"), maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...cookieOpts(REFRESH_TTL, "/api/auth", "strict"), maxAge: 0 });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  // 1. Bearer header (PowerShell / API clients)
  const h = await headers();
  const bearer = h.get("authorization");
  let token: string | null = null;
  if (bearer?.startsWith("Bearer ")) {
    token = bearer.slice(7);
  } else {
    // 2. Cookie
    const c = await cookies();
    token = c.get(ACCESS_COOKIE)?.value ?? null;
  }
  if (!token) return null;
  const claims = await verifyAccess(token);
  if (!claims) return null;
  const id = Number(claims.sub);
  if (!Number.isInteger(id)) return null;
  return { id, role: claims.role, email: claims.email, name: claims.name };
}