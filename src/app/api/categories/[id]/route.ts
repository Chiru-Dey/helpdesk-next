import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { fromApiError, fromZodError } from "@/lib/api/respond";
import { requireRole } from "@/lib/auth/guards";
import { deleteCategory, patchCategory } from "@/lib/services/categories";
import { updateCategorySchema } from "@/lib/validation";

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requireRole("admin");
  if (!guard.ok) return guard.res;
  const { id } = await ctx.params;
  const parsed = updateCategorySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    const cat = await patchCategory(guard.user, Number(id), parsed.data);
    revalidateTag("categories", "max");
    return NextResponse.json(cat);
  }
  catch (e) { return fromApiError(e); }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const guard = await requireRole("admin");
  if (!guard.ok) return guard.res;
  const { id } = await ctx.params;
  try {
    await deleteCategory(guard.user, Number(id));
    revalidateTag("categories", "max");
    return NextResponse.json({ deleted: true });
  }
  catch (e) { return fromApiError(e); }
}
