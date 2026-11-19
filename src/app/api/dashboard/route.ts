import { NextResponse } from "next/server";
import { fromApiError } from "@/lib/api/respond";
import { requireRole } from "@/lib/auth/guards";
import { getDashboard } from "@/lib/services/dashboard";

export async function GET() {
  const guard = await requireRole("agent", "admin");
  if (!guard.ok) return guard.res;
  try { return NextResponse.json(await getDashboard(guard.user)); }
  catch (e) { return fromApiError(e); }
}