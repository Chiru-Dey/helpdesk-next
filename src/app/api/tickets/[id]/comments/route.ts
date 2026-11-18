import { NextResponse } from "next/server";
import { getRequestInfo, requireAuth } from "@/lib/auth/session";
import {
  errorResponse,
  listResponse,
  serviceError,
  validationError,
} from "@/lib/http";
import {
  createCommentSchema,
  listCommentsQuerySchema,
} from "@/lib/schemas/tickets";
import { addComment, listComments } from "@/lib/tickets/service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function parseTicketId(id: string): number | null {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(request: Request, context: RouteContext) {
  const guard = await requireAuth();
  if (!guard.ok) {
    return guard.response;
  }

  const { id } = await context.params;
  const ticketId = parseTicketId(id);
  if (ticketId === null) {
    return errorResponse(400, "validation_error", "Invalid ticket id.");
  }

  const url = new URL(request.url);
  const parsed = listCommentsQuerySchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const { items, total } = await listComments(
      guard.user,
      ticketId,
      parsed.data,
    );
    return listResponse(items, parsed.data.page, parsed.data.page_size, total);
  } catch (error) {
    return serviceError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const guard = await requireAuth();
  if (!guard.ok) {
    return guard.response;
  }

  const { id } = await context.params;
  const ticketId = parseTicketId(id);
  if (ticketId === null) {
    return errorResponse(400, "validation_error", "Invalid ticket id.");
  }

  const parsed = createCommentSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const requestInfo = await getRequestInfo();
    const comment = await addComment(
      guard.user,
      ticketId,
      parsed.data,
      requestInfo,
    );
    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    return serviceError(error);
  }
}