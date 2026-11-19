import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { fromApiError, fromZodError } from "@/lib/api/respond";
import { requireRole } from "@/lib/auth/guards";
import { createUser, listUsers } from "@/lib/services/users";
import { createUserSchema } from "@/lib/validation";

export async function GET() {
  const guard = await requireRole("admin");
  if (!guard.ok) return guard.res;
  try {
    const items = await listUsers(guard.user);
    return NextResponse.json({ items });
  } catch (e) { return fromApiError(e); }
}

export async function POST(request: Request) {
  const guard = await requireRole("admin");
  if (!guard.ok) return guard.res;
  const parsed = createUserSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    const user = await createUser(guard.user, parsed.data);
    revalidateTag("users", "max");
    revalidatePath("/admin/users");
    return NextResponse.json(user, { status: 201 });
  } catch (e) { return fromApiError(e); }
}