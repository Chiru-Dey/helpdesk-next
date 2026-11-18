import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { recordAudit } from "../audit";
import type { RequestInfo } from "../auth/tokens";
import { db } from "../db";
import { ServiceError } from "../http";
import {
  comments,
  tickets,
  users,
  type TicketPriority,
  type TicketStatus,
  type User,
} from "../schema";
import type {
  CreateCommentInput,
  CreateTicketInput,
  ListTicketsQuery,
  UpdateTicketInput,
} from "../schemas/tickets";
import { allowedTransitions, canTransition } from "./state-machine";

const customerAlias = alias(users, "customer");
const assigneeAlias = alias(users, "assignee");
const authorAlias = alias(users, "author");

export interface TicketSummary {
  id: number;
  number: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  customer_id: number;
  assignee_id: number | null;
  customer_name: string;
  customer_email: string;
  assignee_name: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
}

export interface TicketDetail extends TicketSummary {
  description: string;
}

export interface CommentItem {
  id: number;
  ticket_id: number;
  author_id: number;
  author_name: string;
  author_role: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

function iso(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof Error && /duplicate entry/i.test(error.message);
}

export function canViewTicket(user: User, ticket: { customerId: number }): boolean {
  if (user.role === "customer") {
    return ticket.customerId === user.id;
  }
  return true;
}

function assertStaff(user: User): void {
  if (user.role === "customer") {
    throw new ServiceError(
      403,
      "forbidden",
      "This action requires agent or admin role.",
    );
  }
}

async function nextTicketNumber(): Promise<string> {
  const rows = await db
    .select({ number: tickets.number })
    .from(tickets)
    .orderBy(desc(tickets.number))
    .limit(1);
  const last = rows[0]?.number ?? null;
  const lastSequence = last === null ? 0 : parseInt(last.slice(3), 10);
  const next = (Number.isFinite(lastSequence) ? lastSequence : 0) + 1;
  return `HD-${String(next).padStart(6, "0")}`;
}

async function fetchTicketRow(ticketId: number) {
  const rows = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);
  const ticket = rows[0];
  if (!ticket) {
    throw new ServiceError(404, "not_found", "Ticket not found.");
  }
  return ticket;
}

export async function createTicket(
  input: CreateTicketInput,
  actor: User,
  requestInfo: RequestInfo,
): Promise<TicketDetail> {
  let customerId = actor.id;
  if (actor.role !== "customer" && input.customer_id !== undefined) {
    const rows = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, input.customer_id))
      .limit(1);
    const target = rows[0];
    if (!target || target.role !== "customer") {
      throw new ServiceError(
        400,
        "validation_error",
        "customer_id must reference an existing customer.",
      );
    }
    customerId = target.id;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const number = await nextTicketNumber();
    try {
      const inserted = await db
        .insert(tickets)
        .values({
          number,
          subject: input.subject,
          description: input.description,
          priority: input.priority ?? "medium",
          customerId,
        })
        .$returningId();

      await recordAudit({
        actorId: actor.id,
        action: "ticket.created",
        entityType: "ticket",
        entityId: String(inserted[0].id),
        metadata: { number },
        ipAddress: requestInfo.ipAddress,
      });

      return getTicketDetail(actor, inserted[0].id);
    } catch (error) {
      if (isDuplicateKeyError(error) && attempt < 2) {
        continue;
      }
      throw error;
    }
  }
  throw new ServiceError(
    500,
    "internal_error",
    "Could not allocate a ticket number.",
  );
}

export async function listTickets(
  user: User,
  query: ListTicketsQuery,
): Promise<{ items: TicketSummary[]; total: number }> {
  const conditions: SQL[] = [];
  if (user.role === "customer") {
    conditions.push(eq(tickets.customerId, user.id));
  }
  if (query.status !== undefined) {
    conditions.push(eq(tickets.status, query.status));
  }
  if (query.priority !== undefined) {
    conditions.push(eq(tickets.priority, query.priority));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalRows = await db
    .select({ total: count() })
    .from(tickets)
    .where(whereClause);
  const total = totalRows[0]?.total ?? 0;

  const rows = await db
    .select({
      id: tickets.id,
      number: tickets.number,
      subject: tickets.subject,
      status: tickets.status,
      priority: tickets.priority,
      customerId: tickets.customerId,
      assigneeId: tickets.assigneeId,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      resolvedAt: tickets.resolvedAt,
      closedAt: tickets.closedAt,
      customerName: customerAlias.displayName,
      customerEmail: customerAlias.email,
      assigneeName: assigneeAlias.displayName,
    })
    .from(tickets)
    .innerJoin(customerAlias, eq(customerAlias.id, tickets.customerId))
    .leftJoin(assigneeAlias, eq(assigneeAlias.id, tickets.assigneeId))
    .where(whereClause)
    .orderBy(desc(tickets.createdAt))
    .limit(query.page_size)
    .offset((query.page - 1) * query.page_size);

  const items: TicketSummary[] = rows.map((row) => ({
    id: row.id,
    number: row.number,
    subject: row.subject,
    status: row.status,
    priority: row.priority,
    customer_id: row.customerId,
    assignee_id: row.assigneeId,
    customer_name: row.customerName,
    customer_email: row.customerEmail,
    assignee_name: row.assigneeName,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    resolved_at: iso(row.resolvedAt),
    closed_at: iso(row.closedAt),
  }));

  return { items, total };
}

export async function getTicketDetail(
  user: User,
  ticketId: number,
): Promise<TicketDetail> {
  const rows = await db
    .select({
      id: tickets.id,
      number: tickets.number,
      subject: tickets.subject,
      description: tickets.description,
      status: tickets.status,
      priority: tickets.priority,
      customerId: tickets.customerId,
      assigneeId: tickets.assigneeId,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      resolvedAt: tickets.resolvedAt,
      closedAt: tickets.closedAt,
      customerName: customerAlias.displayName,
      customerEmail: customerAlias.email,
      assigneeName: assigneeAlias.displayName,
    })
    .from(tickets)
    .innerJoin(customerAlias, eq(customerAlias.id, tickets.customerId))
    .leftJoin(assigneeAlias, eq(assigneeAlias.id, tickets.assigneeId))
    .where(eq(tickets.id, ticketId))
    .limit(1);

  const row = rows[0];
  if (!row || !canViewTicket(user, { customerId: row.customerId })) {
    throw new ServiceError(404, "not_found", "Ticket not found.");
  }

  return {
    id: row.id,
    number: row.number,
    subject: row.subject,
    description: row.description,
    status: row.status,
    priority: row.priority,
    customer_id: row.customerId,
    assignee_id: row.assigneeId,
    customer_name: row.customerName,
    customer_email: row.customerEmail,
    assignee_name: row.assigneeName,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    resolved_at: iso(row.resolvedAt),
    closed_at: iso(row.closedAt),
  };
}

export async function updateTicket(
  user: User,
  ticketId: number,
  input: UpdateTicketInput,
  requestInfo: RequestInfo,
): Promise<TicketDetail> {
  const ticket = await fetchTicketRow(ticketId);
  if (!canViewTicket(user, ticket)) {
    throw new ServiceError(404, "not_found", "Ticket not found.");
  }

  if (
    ticket.status === "closed" &&
    (input.subject !== undefined ||
      input.description !== undefined ||
      input.priority !== undefined ||
      input.assignee_id !== undefined)
  ) {
    throw new ServiceError(
      409,
      "conflict",
      "Closed tickets cannot be edited. Reopen the ticket first.",
    );
  }

  const set: Partial<typeof tickets.$inferInsert> = {};

  if (input.subject !== undefined || input.description !== undefined) {
    const isOwner = user.role === "customer" && ticket.customerId === user.id;
    if (user.role === "customer" && !isOwner) {
      throw new ServiceError(
        403,
        "forbidden",
        "You can only edit your own tickets.",
      );
    }
    if (input.subject !== undefined) set.subject = input.subject;
    if (input.description !== undefined) set.description = input.description;
  }

  if (input.priority !== undefined) {
    assertStaff(user);
    set.priority = input.priority;
  }

  if (input.assignee_id !== undefined) {
    assertStaff(user);
    if (input.assignee_id === null) {
      set.assigneeId = null;
    } else {
      const rows = await db
        .select({
          id: users.id,
          role: users.role,
          isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.id, input.assignee_id))
        .limit(1);
      const assignee = rows[0];
      if (
        !assignee ||
        !assignee.isActive ||
        (assignee.role !== "agent" && assignee.role !== "admin")
      ) {
        throw new ServiceError(
          400,
          "validation_error",
          "assignee_id must reference an active agent or admin.",
        );
      }
      set.assigneeId = input.assignee_id;
    }
  }

  if (input.status !== undefined && input.status !== ticket.status) {
    if (!canTransition(ticket.status, input.status, user.role)) {
      throw new ServiceError(
        409,
        "conflict",
        `Transition from '${ticket.status}' to '${input.status}' is not allowed for role '${user.role}'.`,
        { allowed: allowedTransitions(ticket.status, user.role) },
      );
    }
    set.status = input.status;
    if (input.status === "resolved") set.resolvedAt = new Date();
    if (input.status === "closed") set.closedAt = new Date();
    if (input.status === "open") {
      set.resolvedAt = null;
      set.closedAt = null;
    }
  }

  if (Object.keys(set).length === 0) {
    throw new ServiceError(400, "validation_error", "No valid changes supplied.");
  }

  await db.update(tickets).set(set).where(eq(tickets.id, ticketId));

  if (set.status !== undefined) {
    await recordAudit({
      actorId: user.id,
      action: "ticket.status_changed",
      entityType: "ticket",
      entityId: String(ticketId),
      metadata: { from: ticket.status, to: set.status },
      ipAddress: requestInfo.ipAddress,
    });
  }
  if (input.assignee_id !== undefined) {
    await recordAudit({
      actorId: user.id,
      action: input.assignee_id === null ? "ticket.unassigned" : "ticket.assigned",
      entityType: "ticket",
      entityId: String(ticketId),
      metadata: { assignee_id: input.assignee_id },
      ipAddress: requestInfo.ipAddress,
    });
  }

  return getTicketDetail(user, ticketId);
}

export async function listComments(
  user: User,
  ticketId: number,
  query: { page: number; page_size: number },
): Promise<{ items: CommentItem[]; total: number }> {
  const ticket = await fetchTicketRow(ticketId);
  if (!canViewTicket(user, ticket)) {
    throw new ServiceError(404, "not_found", "Ticket not found.");
  }

  const conditions: SQL[] = [eq(comments.ticketId, ticketId)];
  if (user.role === "customer") {
    conditions.push(eq(comments.isInternal, false));
  }
  const whereClause = and(...conditions);

  const totalRows = await db
    .select({ total: count() })
    .from(comments)
    .where(whereClause);
  const total = totalRows[0]?.total ?? 0;

  const rows = await db
    .select({
      id: comments.id,
      ticketId: comments.ticketId,
      authorId: comments.authorId,
      body: comments.body,
      isInternal: comments.isInternal,
      createdAt: comments.createdAt,
      authorName: authorAlias.displayName,
      authorRole: authorAlias.role,
    })
    .from(comments)
    .innerJoin(authorAlias, eq(authorAlias.id, comments.authorId))
    .where(whereClause)
    .orderBy(comments.createdAt)
    .limit(query.page_size)
    .offset((query.page - 1) * query.page_size);

  const items: CommentItem[] = rows.map((row) => ({
    id: row.id,
    ticket_id: row.ticketId,
    author_id: row.authorId,
    author_name: row.authorName,
    author_role: row.authorRole,
    body: row.body,
    is_internal: row.isInternal,
    created_at: row.createdAt.toISOString(),
  }));

  return { items, total };
}

export async function addComment(
  user: User,
  ticketId: number,
  input: CreateCommentInput,
  requestInfo: RequestInfo,
): Promise<CommentItem> {
  const ticket = await fetchTicketRow(ticketId);
  if (!canViewTicket(user, ticket)) {
    throw new ServiceError(404, "not_found", "Ticket not found.");
  }
  if (ticket.status === "closed") {
    throw new ServiceError(
      409,
      "conflict",
      "Closed tickets cannot receive new comments.",
    );
  }
  const isInternal = input.is_internal ?? false;
  if (isInternal) {
    assertStaff(user);
  }

  const inserted = await db
    .insert(comments)
    .values({
      ticketId,
      authorId: user.id,
      body: input.body,
      isInternal,
    })
    .$returningId();

  const rows = await db
    .select({
      id: comments.id,
      ticketId: comments.ticketId,
      authorId: comments.authorId,
      body: comments.body,
      isInternal: comments.isInternal,
      createdAt: comments.createdAt,
      authorName: authorAlias.displayName,
      authorRole: authorAlias.role,
    })
    .from(comments)
    .innerJoin(authorAlias, eq(authorAlias.id, comments.authorId))
    .where(eq(comments.id, inserted[0].id))
    .limit(1);
  const row = rows[0];

  return {
    id: row.id,
    ticket_id: row.ticketId,
    author_id: row.authorId,
    author_name: row.authorName,
    author_role: row.authorRole,
    body: row.body,
    is_internal: row.isInternal,
    created_at: row.createdAt.toISOString(),
  };
}