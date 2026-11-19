import { after, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { fromApiError } from "@/lib/api/respond";
import { requireRole } from "@/lib/auth/guards";
import { assignTicket } from "@/lib/services/tickets";
import { ticketAssignedEmail } from "@/lib/email/templates";

interface Ctx { params: Promise<{ id: string }> }

export async function POST(req: Request, ctx: Ctx) {
  const guard = await requireRole("admin");
  if (!guard.ok) return guard.res;
  const { id } = await ctx.params;

  try {
    const ticket = await assignTicket(guard.user, Number(id), await req.json());
    revalidateTag("tickets", "max");

    if (ticket.assignee_id && ticket.assignee_name) {
      after(async () => {
        ticketAssignedEmail({
          ticketNumber: ticket.id.toString(),
          subject: ticket.subject,
          customerName: ticket.customer_name,
          url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/tickets/${ticket.id}`,
        });
        console.log(`[after] Would email assignee ${ticket.assignee_name} about ticket ${ticket.id}`);
      });
    }

    return NextResponse.json(ticket);
  } catch (e) {
    return fromApiError(e);
  }
}