import { NextResponse } from "next/server";
import { ApiError } from "../api/errors";
import type { Role } from "../db/schema";
import { getSessionUser, type SessionUser } from "./session";

export type Guard =
  | { ok: true; user: SessionUser }
  | { ok: false; res: NextResponse };

function toResponse(e: ApiError): NextResponse {
  const body: { error: { code: string; message: string; details?: unknown } } = {
    error: { code: e.code, message: e.message },
  };
  if (e.details !== undefined) body.error.details = e.details;
  return NextResponse.json(body, { status: e.status });
}

export async function requireAuth(): Promise<Guard> {
  const user = await getSessionUser();
  if (!user) {
    return {
      ok: false,
      res: toResponse(new ApiError(401, "unauthenticated", "Authentication required.")),
    };
  }
  return { ok: true, user };
}

export async function requireRole(...roles: Role[]): Promise<Guard> {
  const base = await requireAuth();
  if (!base.ok) return base;
  if (!roles.includes(base.user.role)) {
    return {
      ok: false,
      res: toResponse(new ApiError(403, "forbidden", "You do not have permission.")),
    };
  }
  return base;
}