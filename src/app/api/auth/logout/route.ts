import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revokeByHash } from "@/lib/auth/jwt";
import { REFRESH_COOKIE, clearCookies } from "@/lib/auth/session";

export async function POST() {
  const store = await cookies();
  const presented = store.get(REFRESH_COOKIE)?.value;
  if (presented) await revokeByHash(presented);
  const body = NextResponse.json({ logged_out: true });
  clearCookies(body);
  return body;
}