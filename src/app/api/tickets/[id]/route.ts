import { NextResponse } from "next/server";
import { fromApiError } from "@/lib/api/respond";
import { requireAuth } from "@/lib/auth/guards";
import { deleteTicket, getTicket, patchTicket } from "@/lib/services/tickets";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.res;
  const { id } = await ctx.params;
  try { return NextResponse.json(await getTicket(guard.user, Number(id))); }
  catch (e) { return fromApiError(e); }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.res;
  const { id } = await ctx.params;
  try { return NextResponse.json(await patchTicket(guard.user, Number(id), await req.json())); }
  catch (e) { return fromApiError(e); }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.res;
  const { id } = await ctx.params;
  try { await deleteTicket(guard.user, Number(id)); return NextResponse.json({ deleted: true }); }
  catch (e) { return fromApiError(e); }
}