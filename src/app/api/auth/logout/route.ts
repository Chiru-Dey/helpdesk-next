import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { recordAudit } from "@/lib/audit";
import {
  REFRESH_COOKIE,
  clearSessionCookies,
} from "@/lib/auth/session";
import { revokeRefreshToken } from "@/lib/auth/tokens";

export async function POST() {
  const store = await cookies();
  const presented = store.get(REFRESH_COOKIE)?.value;

  if (presented) {
    const revoked = await revokeRefreshToken(presented);
    if (revoked) {
      await recordAudit({
        actorId: revoked.userId,
        action: "auth.logout",
        entityType: "user",
        entityId: String(revoked.userId),
      });
    }
  }

  const body = NextResponse.json({ data: { logged_out: true } });
  clearSessionCookies(body);
  return body;
}