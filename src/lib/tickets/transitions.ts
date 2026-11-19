import type { Role, TicketStatus } from "../db/schema";

export const STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];

/**
 * Brief lifecycle:
 *   open → in_progress → resolved → closed
 *   resolved → in_progress (agent/admin)
 *   closed → open (admin only)
 * Any other transition → 422.
 */
const MAP: Record<TicketStatus, { to: TicketStatus; roles: Role[] }[]> = {
  open: [{ to: "in_progress", roles: ["admin", "agent"] }],
  in_progress: [{ to: "resolved", roles: ["admin", "agent"] }],
  resolved: [
    { to: "closed", roles: ["admin", "agent"] },
    { to: "in_progress", roles: ["admin", "agent"] },
  ],
  closed: [{ to: "open", roles: ["admin"] }],
};

export function allowed(from: TicketStatus, role: Role): TicketStatus[] {
  return MAP[from].filter((r) => r.roles.includes(role)).map((r) => r.to);
}

export function canTransition(from: TicketStatus, to: TicketStatus, role: Role): boolean {
  return allowed(from, role).includes(to);
}