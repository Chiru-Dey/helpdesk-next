import { NextResponse } from "next/server";
import { fromApiError } from "@/lib/api/respond";
import { requireRole } from "@/lib/auth/guards";
import { assignTicket } from "@/lib/services/tickets";

interface Ctx { params: Promise<{ id: string }> }

export async function POST(req: Request, ctx: Ctx) {
  const guard = await requireRole("admin");
  if (!guard.ok) return guard.res;
  const { id } = await ctx.params;
  try { return NextResponse.json(await assignTicket(guard.user, Number(id), await req.json())); }
  catch (e) { return fromApiError(e); }
}