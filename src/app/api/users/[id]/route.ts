import { NextResponse } from "next/server";
import { fromApiError, fromZodError } from "@/lib/api/respond";
import { requireRole } from "@/lib/auth/guards";
import { deleteUser, getUser, patchUser } from "@/lib/services/users";
import { updateUserSchema } from "@/lib/validation";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const guard = await requireRole("admin");
  if (!guard.ok) return guard.res;
  const { id } = await ctx.params;
  try { return NextResponse.json(await getUser(guard.user, Number(id))); }
  catch (e) { return fromApiError(e); }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requireRole("admin");
  if (!guard.ok) return guard.res;
  const { id } = await ctx.params;
  const parsed = updateUserSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fromZodError(parsed.error);
  try { return NextResponse.json(await patchUser(guard.user, Number(id), parsed.data)); }
  catch (e) { return fromApiError(e); }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const guard = await requireRole("admin");
  if (!guard.ok) return guard.res;
  const { id } = await ctx.params;
  try { await deleteUser(guard.user, Number(id)); return NextResponse.json({ deleted: true }); }
  catch (e) { return fromApiError(e); }
}