"use cache";

import { and, count, desc, eq, isNull, like, or, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { cacheTag } from "next/cache";
import { ApiError, conflict, forbidden, notFound, unprocessable } from "../api/errors";
import { buildMeta, offset, type PaginationInput } from "../api/pagination";
import type { SessionUser } from "../auth/session";
import { db } from "../db/client";
import { categories, tickets, users, type TicketPriority, type TicketStatus } from "../db/schema";
import { allowed, canTransition } from "../tickets/transitions";
import {
  assignSchema,
  createTicketSchema,
  statusSchema,
  ticketListSchema,
  updateTicketSchema,
} from "../validation";

const customerAlias = alias(users, "customer");
const assigneeAlias = alias(users, "assignee");
const categoryAlias = alias(categories, "category");

export interface TicketItem {
  id: number;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  customer_id: number;
  customer_name: string;
  assignee_id: number | null;
  assignee_name: string | null;
  category_id: number | null;
  category_name: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

function iso(d: Date | null): string | null {
  return d ? d.toISOString() : null;
}

function mapRow(r: Record<string, unknown>): TicketItem {
  return {
    id: r.id as number,
    subject: r.subject as string,
    description: r.description as string,
    status: r.status as TicketStatus,
    priority: r.priority as TicketPriority,
    customer_id: r.customerId as number,
    customer_name: r.customerName as string,
    assignee_id: (r.assigneeId as number | null) ?? null,
    assignee_name: (r.assigneeName as string | null) ?? null,
    category_id: (r.categoryId as number | null) ?? null,
    category_name: (r.categoryName as string | null) ?? null,
    resolved_at: iso(r.resolvedAt as Date | null),
    created_at: (r.createdAt as Date).toISOString(),
    updated_at: (r.updatedAt as Date).toISOString(),
  };
}

const SELECT_FIELDS = {
  id: tickets.id,
  subject: tickets.subject,
  description: tickets.description,
  status: tickets.status,
  priority: tickets.priority,
  customerId: tickets.customerId,
  assigneeId: tickets.assigneeId,
  categoryId: tickets.categoryId,
  resolvedAt: tickets.resolvedAt,
  createdAt: tickets.createdAt,
  updatedAt: tickets.updatedAt,
  customerName: customerAlias.name,
  assigneeName: assigneeAlias.name,
  categoryName: categoryAlias.name,
} as const;

function baseQuery() {
  return db
    .select(SELECT_FIELDS)
    .from(tickets)
    .innerJoin(customerAlias, eq(customerAlias.id, tickets.customerId))
    .leftJoin(assigneeAlias, eq(assigneeAlias.id, tickets.assigneeId))
    .leftJoin(categoryAlias, eq(categoryAlias.id, tickets.categoryId));
}

export async function listTickets(
  user: SessionUser,
  raw: Record<string, string | undefined>,
) {
  cacheTag("tickets");
  const q = ticketListSchema.parse(raw);
  const conditions: SQL[] = [];

  if (user.role === "customer") {
    conditions.push(eq(tickets.customerId, user.id));
  } else if (user.role === "agent") {
    conditions.push(or(eq(tickets.assigneeId, user.id), isNull(tickets.assigneeId))!);
  }

  if (q.status) conditions.push(eq(tickets.status, q.status));
  if (q.priority) conditions.push(eq(tickets.priority, q.priority));
  if (q.search) {
    const term = `%${q.search}%`;
    conditions.push(or(like(tickets.subject, term), like(tickets.description, term))!);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const pag: PaginationInput = { page: q.page, per_page: q.per_page };

  const [totalRows, rows] = await Promise.all([
    db.select({ total: count() }).from(tickets).where(where),
    baseQuery()
      .where(where)
      .orderBy(desc(tickets.createdAt))
      .limit(pag.per_page)
      .offset(offset(pag)),
  ]);

  const total = totalRows[0]?.total ?? 0;
  return { items: rows.map(mapRow), meta: buildMeta(total, pag) };
}

export async function getTicket(user: SessionUser, id: number): Promise<TicketItem> {
  cacheTag("tickets");
  const rows = await baseQuery().where(eq(tickets.id, id)).limit(1);
  const row = rows[0];
  if (!row) throw notFound("Ticket not found.");
  if (user.role === "customer" && row.customerId !== user.id) throw notFound("Ticket not found.");
  if (user.role === "agent" && row.assigneeId !== user.id && row.assigneeId !== null) throw notFound("Ticket not found.");
  return mapRow(row);
}

export async function createTicket(user: SessionUser, body: unknown): Promise<TicketItem> {
  const input = createTicketSchema.parse(body);
  const inserted = await db
    .insert(tickets)
    .values({
      subject: input.subject,
      description: input.description,
      priority: input.priority ?? "medium",
      customerId: user.id,
      categoryId: input.category_id ?? null,
    })
    .$returningId();
  // revalidateTag removed — moved to route handler
  return getTicket(user, inserted[0].id);
}

export async function patchTicket(
  user: SessionUser,
  id: number,
  body: unknown,
): Promise<TicketItem> {
  const input = updateTicketSchema.parse(body);
  const existing = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  const t = existing[0];
  if (!t) throw notFound("Ticket not found.");

  if (user.role === "customer") {
    if (t.customerId !== user.id) throw forbidden("You can only edit your own tickets.");
    if (t.status !== "open") throw conflict("Customers can only edit tickets while open.");
    if (input.priority !== undefined || input.category_id !== undefined) {
      throw forbidden("Customers cannot change priority or category.");
    }
  }

  const set: Partial<typeof tickets.$inferInsert> = {};
  if (input.subject !== undefined) set.subject = input.subject;
  if (input.description !== undefined) set.description = input.description;
  if (input.priority !== undefined) set.priority = input.priority;
  if (input.category_id !== undefined) {
    if (input.category_id !== null) {
      const cat = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, input.category_id))
        .limit(1);
      if (!cat[0]) throw new ApiError(400, "validation_error", "Invalid category_id.");
    }
    set.categoryId = input.category_id;
  }

  if (Object.keys(set).length === 0) throw new ApiError(400, "validation_error", "No changes.");
  await db.update(tickets).set(set).where(eq(tickets.id, id));
  // revalidateTag removed — moved to route handler
  return getTicket(user, id);
}

export async function deleteTicket(user: SessionUser, id: number): Promise<void> {
  if (user.role !== "admin") throw forbidden("Only admins can delete tickets.");
  const existing = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.id, id)).limit(1);
  if (!existing[0]) throw notFound("Ticket not found.");
  await db.delete(tickets).where(eq(tickets.id, id));
  // revalidateTag removed — moved to route handler
}

export async function assignTicket(
  user: SessionUser,
  id: number,
  body: unknown,
): Promise<TicketItem> {
  if (user.role !== "admin") throw forbidden("Only admins can assign tickets.");
  const input = assignSchema.parse(body);
  const existing = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  if (!existing[0]) throw notFound("Ticket not found.");

  if (input.assignee_id !== null) {
    const target = await db
      .select({ id: users.id, role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, input.assignee_id))
      .limit(1);
    const u = target[0];
    if (!u || !u.isActive || (u.role !== "agent" && u.role !== "admin")) {
      throw new ApiError(400, "validation_error", "assignee must be an active agent or admin.");
    }
  }

  await db.update(tickets).set({ assigneeId: input.assignee_id }).where(eq(tickets.id, id));
  // revalidateTag removed — moved to route handler
  return getTicket(user, id);
}

export async function changeStatus(
  user: SessionUser,
  id: number,
  body: unknown,
): Promise<TicketItem> {
  if (user.role === "customer") throw forbidden("Customers cannot change ticket status.");
  const input = statusSchema.parse(body);
  const existing = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  const t = existing[0];
  if (!t) throw notFound("Ticket not found.");

  if (t.status === input.status) return getTicket(user, id);

  if (!canTransition(t.status, input.status, user.role)) {
    throw unprocessable(
      `Transition from '${t.status}' to '${input.status}' is not allowed for role '${user.role}'.`,
      { allowed: allowed(t.status, user.role) },
    );
  }

  const set: Partial<typeof tickets.$inferInsert> = { status: input.status };
  if (input.status === "resolved") set.resolvedAt = new Date();
  if (input.status === "open" || input.status === "in_progress") set.resolvedAt = null;

  await db.update(tickets).set(set).where(eq(tickets.id, id));
  // revalidateTag removed — moved to route handler
  return getTicket(user, id);
}