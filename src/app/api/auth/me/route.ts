import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";

export async function GET() {
  const guard = await requireAuth();
  if (!guard.ok) {
    return guard.response;
  }
  const user = guard.user;
  return NextResponse.json({
    data: {
      id: user.id,
      role: user.role,
      email: user.email,
      display_name: user.displayName,
      created_at: user.createdAt.toISOString(),
    },
  });
}