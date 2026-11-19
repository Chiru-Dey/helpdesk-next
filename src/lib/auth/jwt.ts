import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { refreshTokens, type Role } from "../db/schema";

export const ACCESS_TTL = 15 * 60;
export const REFRESH_TTL = 30 * 24 * 60 * 60;

export interface AccessClaims {
  sub: string;
  role: Role;
  email: string;
  name: string;
}

const ROLES: Role[] = ["admin", "agent", "customer"];

function accessSecret(): Uint8Array {
  const s = process.env.JWT_ACCESS_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_ACCESS_SECRET missing or too short.");
  return new TextEncoder().encode(s);
}

export async function signAccess(c: AccessClaims): Promise<string> {
  return new SignJWT({ role: c.role, email: c.email, name: c.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(c.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ACCESS_TTL)
    .sign(accessSecret());
}

export async function verifyAccess(token: string): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret());
    if (
      typeof payload.sub !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      !ROLES.includes(payload.role as Role)
    ) return null;
    return { sub: payload.sub, role: payload.role as Role, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

function sha256(v: string): string {
  return createHash("sha256").update(v).digest("hex");
}

export async function createRefresh(userId: number): Promise<string> {
  const token = randomBytes(48).toString("base64url");
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + REFRESH_TTL * 1000),
  });
  return token;
}

export type RotateResult =
  | { status: "rotated"; userId: number; token: string }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "reuse_detected"; userId: number };

export async function rotateRefresh(presented: string): Promise<RotateResult> {
  const rows = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, sha256(presented)))
    .limit(1);
  const cur = rows[0];
  if (!cur) return { status: "invalid" };

  if (cur.revokedAt !== null) {
    // Reuse → revoke ALL sessions for this user
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, cur.userId), isNull(refreshTokens.revokedAt)));
    return { status: "reuse_detected", userId: cur.userId };
  }

  if (cur.expiresAt.getTime() < Date.now()) return { status: "expired" };

  const newToken = await createRefresh(cur.userId);
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, cur.id));
  return { status: "rotated", userId: cur.userId, token: newToken };
}

export async function revokeByHash(presented: string): Promise<number | null> {
  const rows = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, sha256(presented)))
    .limit(1);
  const cur = rows[0];
  if (!cur || cur.revokedAt !== null) return null;
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, cur.id));
  return cur.userId;
}