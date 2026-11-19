"use cache";

import { asc, count, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { cacheTag } from "next/cache";
import { notFound } from "../api/errors";
import { buildMeta, offset, type PaginationInput } from "../api/pagination";
import type { SessionUser } from "../auth/session";
import { db } from "../db/client";
import { comments, tickets, users } from "../db/schema";
import { commentListSchema, createCommentSchema } from "../validation";

const authorAlias = alias(users, "comment_author");

export interface CommentItem {
  id: number;
  ticket_id: number;
  author_id: number;
  author_name: string;
  body: string;
  created_at: string;
}

function canSee(
  user: SessionUser,
  t: { customerId: number; assigneeId: number | null },
): boolean {
  if (user.role === "admin") return true;
  if (user.role === "customer") return t.customerId === user.id;
  return t.assigneeId === user.id || t.assigneeId === null;
}

export async function listComments(
  user: SessionUser,
  ticketId: number,
  raw: Record<string, string | undefined>,
) {
  cacheTag(`comments:${ticketId}`);

  const tRow = await db
    .select({ customerId: tickets.customerId, assigneeId: tickets.assigneeId })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);
  if (!tRow[0] || !canSee(user, tRow[0])) throw notFound("Ticket not found.");

  const q = commentListSchema.parse(raw);
  const pag: PaginationInput = { page: q.page, per_page: q.per_page };

  const [totalRows, rows] = await Promise.all([
    db.select({ total: count() }).from(comments).where(eq(comments.ticketId, ticketId)),
    db
      .select({
        id: comments.id,
        ticketId: comments.ticketId,
        authorId: comments.authorId,
        body: comments.body,
        createdAt: comments.createdAt,
        authorName: authorAlias.name,
      })
      .from(comments)
      .innerJoin(authorAlias, eq(authorAlias.id, comments.authorId))
      .where(eq(comments.ticketId, ticketId))
      .orderBy(asc(comments.createdAt))
      .limit(pag.per_page)
      .offset(offset(pag)),
  ]);

  const total = totalRows[0]?.total ?? 0;
  const items: CommentItem[] = rows.map((r) => ({
    id: r.id,
    ticket_id: r.ticketId,
    author_id: r.authorId,
    author_name: r.authorName,
    body: r.body,
    created_at: r.createdAt.toISOString(),
  }));

  return { items, meta: buildMeta(total, pag) };
}

export async function addComment(
  user: SessionUser,
  ticketId: number,
  body: unknown,
): Promise<CommentItem> {
  const input = createCommentSchema.parse(body);
  const tRow = await db
    .select({
      customerId: tickets.customerId,
      assigneeId: tickets.assigneeId,
      status: tickets.status,
    })
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);
  if (!tRow[0] || !canSee(user, tRow[0])) throw notFound("Ticket not found.");
  if (tRow[0].status === "closed") throw notFound("Ticket is closed.");

  const inserted = await db
    .insert(comments)
    .values({ ticketId, authorId: user.id, body: input.body })
    .$returningId();

  // revalidateTag removed — moved to route handler

  const rows = await db
    .select({
      id: comments.id,
      ticketId: comments.ticketId,
      authorId: comments.authorId,
      body: comments.body,
      createdAt: comments.createdAt,
      authorName: authorAlias.name,
    })
    .from(comments)
    .innerJoin(authorAlias, eq(authorAlias.id, comments.authorId))
    .where(eq(comments.id, inserted[0].id))
    .limit(1);
  const r = rows[0];
  return {
    id: r.id,
    ticket_id: r.ticketId,
    author_id: r.authorId,
    author_name: r.authorName,
    body: r.body,
    created_at: r.createdAt.toISOString(),
  };
}