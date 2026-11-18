import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { refreshTokens, type Role } from "../schema";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

export interface RequestInfo {
  userAgent: string | null;
  ipAddress: string | null;
}

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  email: string;
}

const ROLES: Role[] = ["admin", "agent", "customer"];

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is not set or too short. Append a random 64+ char string to .env.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signAccessToken(
  payload: AccessTokenPayload,
): Promise<string> {
  return new SignJWT({ role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(
      Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SECONDS,
    )
    .sign(getSecret());
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.sub !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.email !== "string" ||
      !ROLES.includes(payload.role as Role)
    ) {
      return null;
    }
    return { sub: payload.sub, role: payload.role as Role, email: payload.email };
  } catch {
    return null;
  }
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createRefreshToken(
  userId: number,
  familyId: string | null,
  requestInfo: RequestInfo,
): Promise<{ id: number; token: string; familyId: string }> {
  const token = randomBytes(48).toString("base64url");
  const family = familyId ?? randomBytes(16).toString("hex");
  const inserted = await db
    .insert(refreshTokens)
    .values({
      userId,
      tokenHash: hashRefreshToken(token),
      familyId: family,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      userAgent: requestInfo.userAgent?.slice(0, 512) ?? null,
      ipAddress: requestInfo.ipAddress?.slice(0, 45) ?? null,
    })
    .$returningId();
  return { id: inserted[0].id, token, familyId: family };
}

export type RotateResult =
  | { status: "rotated"; userId: number; familyId: string; token: string }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "reuse_detected"; familyId: string };

export async function rotateRefreshToken(
  presented: string,
  requestInfo: RequestInfo,
): Promise<RotateResult> {
  const rows = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hashRefreshToken(presented)))
    .limit(1);
  const current = rows[0];

  if (!current) {
    return { status: "invalid" };
  }

  if (current.revokedAt !== null) {
    // A revoked token was presented again: possible theft. Kill the family.
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.familyId, current.familyId),
          isNull(refreshTokens.revokedAt),
        ),
      );
    return { status: "reuse_detected", familyId: current.familyId };
  }

  if (current.expiresAt.getTime() < Date.now()) {
    return { status: "expired" };
  }

  const replacement = await createRefreshToken(
    current.userId,
    current.familyId,
    requestInfo,
  );

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date(), replacedById: replacement.id })
    .where(eq(refreshTokens.id, current.id));

  return {
    status: "rotated",
    userId: current.userId,
    familyId: current.familyId,
    token: replacement.token,
  };
}

export async function revokeRefreshToken(
  presented: string,
): Promise<{ userId: number; familyId: string } | null> {
  const rows = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hashRefreshToken(presented)))
    .limit(1);
  const current = rows[0];
  if (!current || current.revokedAt !== null) {
    return null;
  }
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, current.id));
  return { userId: current.userId, familyId: current.familyId };
}