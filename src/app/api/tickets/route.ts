import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { getRequestInfo } from "@/lib/auth/session";
import { listResponse, serviceError, validationError } from "@/lib/http";
import {
  createTicketSchema,
  listTicketsQuerySchema,
} from "@/lib/schemas/tickets";
import { createTicket, listTickets } from "@/lib/tickets/service";

export async function GET(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) {
    return guard.response;
  }

  const url = new URL(request.url);
  const parsed = listTicketsQuerySchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { items, total } = await listTickets(guard.user, parsed.data);
  return listResponse(items, parsed.data.page, parsed.data.page_size, total);
}

export async function POST(request: Request) {
  const guard = await requireAuth();
  if (!guard.ok) {
    return guard.response;
  }

  const parsed = createTicketSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const requestInfo = await getRequestInfo();
    const ticket = await createTicket(parsed.data, guard.user, requestInfo);
    return NextResponse.json({ data: ticket }, { status: 201 });
  } catch (error) {
    return serviceError(error);
  }
}