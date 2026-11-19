import { after, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { fromApiError } from "@/lib/api/respond";
import { requireRole } from "@/lib/auth/guards";
import { changeStatus } from "@/lib/services/tickets";
import { ticketStatusChangedEmail } from "@/lib/email/templates";

interface Ctx { params: Promise<{ id: string }> }

export async function POST(req: Request, ctx: Ctx) {
  const guard = await requireRole("agent", "admin");
  if (!guard.ok) return guard.res;
  const { id } = await ctx.params;

  try {
    const body = await req.json();

    const { getTicket } = await import("@/lib/services/tickets");
    const currentTicket = await getTicket(guard.user, Number(id));

    const ticket = await changeStatus(guard.user, Number(id), body);
    revalidateTag("tickets", "max");

    if (currentTicket.status !== ticket.status) {
      after(async () => {
        ticketStatusChangedEmail({
          ticketNumber: ticket.id.toString(),
          subject: ticket.subject,
          oldStatus: currentTicket.status,
          newStatus: ticket.status,
          url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tickets/${ticket.id}`,
        });
        console.log(`[after] Would email customer about ticket ${ticket.id} status change`);
      });
    }

    return NextResponse.json(ticket);
  } catch (e) {
    return fromApiError(e);
  }
}