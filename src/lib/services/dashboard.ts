import { and, count, eq, gte, isNull, lte } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { forbidden } from "../api/errors";
import type { SessionUser } from "../auth/session";
import { db } from "../db/client";
import { tickets, type TicketPriority, type TicketStatus } from "../db/schema";

export interface DashboardData {
  by_status: Record<TicketStatus, number>;
  by_priority: Record<TicketPriority, number>;
  resolved_today: number;
  unassigned_open: number;
  recent: {
    id: number;
    subject: string;
    status: TicketStatus;
    priority: TicketPriority;
    created_at: string;
  }[];
}

export async function getDashboard(user: SessionUser): Promise<DashboardData> {
  cacheTag("tickets");
  if (user.role === "customer") throw forbidden("Dashboard is for agents and admins.");

  const scope =
    user.role === "agent"
      ? and(eq(tickets.assigneeId, user.id), isNull(tickets.assigneeId))
      : undefined;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // ⚡ Promise.all: 5 independent reads → 1 parallel batch
  const [statusRows, prioRows, resolvedTodayRows, unassignedRows, recentRows] =
    await Promise.all([
      db
        .select({ status: tickets.status, total: count() })
        .from(tickets)
        .where(scope)
        .groupBy(tickets.status),

      db
        .select({ priority: tickets.priority, total: count() })
        .from(tickets)
        .where(scope)
        .groupBy(tickets.priority),

      db
        .select({ total: count() })
        .from(tickets)
        .where(
          and(
            eq(tickets.status, "resolved"),
            gte(tickets.resolvedAt, startOfDay),
            lte(tickets.resolvedAt, endOfDay),
            ...(scope ? [scope] : []),
          ),
        ),

      db
        .select({ total: count() })
        .from(tickets)
        .where(and(eq(tickets.status, "open"), isNull(tickets.assigneeId))),

      db
        .select({
          id: tickets.id,
          subject: tickets.subject,
          status: tickets.status,
          priority: tickets.priority,
          createdAt: tickets.createdAt,
        })
        .from(tickets)
        .where(scope)
        .orderBy(tickets.createdAt)
        .limit(5),
    ]);

  const by_status: Record<TicketStatus, number> = {
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  };
  for (const r of statusRows) by_status[r.status] = r.total;

  const by_priority: Record<TicketPriority, number> = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  };
  for (const r of prioRows) by_priority[r.priority] = r.total;

  return {
    by_status,
    by_priority,
    resolved_today: resolvedTodayRows[0]?.total ?? 0,
    unassigned_open: unassignedRows[0]?.total ?? 0,
    recent: recentRows.map((r) => ({
      id: r.id,
      subject: r.subject,
      status: r.status,
      priority: r.priority,
      created_at: r.createdAt.toISOString(),
    })),
  };
}