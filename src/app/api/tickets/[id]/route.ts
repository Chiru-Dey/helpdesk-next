import { NextResponse } from "next/server";
import { getRequestInfo, requireAuth } from "@/lib/auth/session";
import { errorResponse, serviceError, validationError } from "@/lib/http";
import { updateTicketSchema } from "@/lib/schemas/tickets";
import { getTicketDetail, updateTicket } from "@/lib/tickets/service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseTicketId(id: string): number | null {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const guard = await requireAuth();
  if (!guard.ok) {
    return guard.response;
  }

  const { id } = await context.params;
  const ticketId = parseTicketId(id);
  if (ticketId === null) {
    return errorResponse(400, "validation_error", "Invalid ticket id.");
  }

  try {
    const ticket = await getTicketDetail(guard.user, ticketId);
    return NextResponse.json({ data: ticket });
  } catch (error) {
    return serviceError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const guard = await requireAuth();
  if (!guard.ok) {
    return guard.response;
  }

  const { id } = await context.params;
  const ticketId = parseTicketId(id);
  if (ticketId === null) {
    return errorResponse(400, "validation_error", "Invalid ticket id.");
  }

  const parsed = updateTicketSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const requestInfo = await getRequestInfo();
    const ticket = await updateTicket(
      guard.user,
      ticketId,
      parsed.data,
      requestInfo,
    );
    return NextResponse.json({ data: ticket });
  } catch (error) {
    return serviceError(error);
  }
}