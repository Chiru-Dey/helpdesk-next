import { NextResponse } from "next/server";
import { fromApiError } from "@/lib/api/respond";
import { requireAuth } from "@/lib/auth/guards";
import { addComment, listComments } from "@/lib/services/comments";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(req: Request, ctx: Ctx) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.res;
  const { id } = await ctx.params;
  const url = new URL(req.url);
  try {
    const { items, meta } = await listComments(guard.user, Number(id), Object.fromEntries(url.searchParams));
    return NextResponse.json({ items, ...meta });
  } catch (e) { return fromApiError(e); }
}

export async function POST(req: Request, ctx: Ctx) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.res;
  const { id } = await ctx.params;
  try { return NextResponse.json(await addComment(guard.user, Number(id), await req.json()), { status: 201 }); }
  catch (e) { return fromApiError(e); }
}