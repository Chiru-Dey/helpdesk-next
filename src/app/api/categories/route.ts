import { NextResponse } from "next/server";
import { fromApiError, fromZodError } from "@/lib/api/respond";
import { requireAuth, requireRole } from "@/lib/auth/guards";
import { createCategory, listCategories } from "@/lib/services/categories";
import { createCategorySchema } from "@/lib/validation";

export async function GET() {
  const guard = await requireAuth();
  if (!guard.ok) return guard.res;
  try { return NextResponse.json({ items: await listCategories() }); }
  catch (e) { return fromApiError(e); }
}

export async function POST(request: Request) {
  const guard = await requireRole("admin");
  if (!guard.ok) return guard.res;
  const parsed = createCategorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fromZodError(parsed.error);
  try { return NextResponse.json(await createCategory(guard.user, parsed.data), { status: 201 }); }
  catch (e) { return fromApiError(e); }
}