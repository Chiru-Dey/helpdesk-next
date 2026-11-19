import { revalidatePath, revalidateTag } from "next/cache"; // ← Add revalidatePath
import { NextResponse } from "next/server";
import { fromApiError } from "@/lib/api/respond";
import { requireAuth } from "@/lib/auth/guards";
import { createTicket, listTickets } from "@/lib/services/tickets";

export async function GET(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.res;
  const url = new URL(request.url);
  try {
    const { items, meta } = await listTickets(guard.user, Object.fromEntries(url.searchParams));
    return NextResponse.json({ items, ...meta });
  } catch (e) { return fromApiError(e); }
}

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) return guard.res;
  try {
    const ticket = await createTicket(guard.user, await request.json());
    revalidateTag("tickets", "max");
    revalidatePath("/tickets");
    return NextResponse.json(ticket, { status: 201 });
  } catch (e) { return fromApiError(e); }
}