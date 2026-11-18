import type { Role, TicketStatus } from "../schema";

export interface TransitionRule {
  to: TicketStatus;
  roles: Role[];
}

export const ALL_STATUSES: TicketStatus[] = [
  "open",
  "in_progress",
  "waiting_customer",
  "resolved",
  "closed",
];

export const TICKET_TRANSITIONS: Record<TicketStatus, TransitionRule[]> = {
  open: [
    { to: "in_progress", roles: ["admin", "agent"] },
    { to: "closed", roles: ["admin", "customer"] },
  ],
  in_progress: [
    { to: "waiting_customer", roles: ["admin", "agent"] },
    { to: "resolved", roles: ["admin", "agent"] },
    { to: "open", roles: ["admin", "agent"] },
  ],
  waiting_customer: [
    { to: "in_progress", roles: ["admin", "agent", "customer"] },
  ],
  resolved: [
    { to: "closed", roles: ["admin", "customer"] },
    { to: "open", roles: ["admin", "customer"] },
  ],
  closed: [{ to: "open", roles: ["admin"] }],
};

export function allowedTransitions(
  status: TicketStatus,
  role: Role,
): TicketStatus[] {
  return TICKET_TRANSITIONS[status]
    .filter((rule) => rule.roles.includes(role))
    .map((rule) => rule.to);
}

export function canTransition(
  status: TicketStatus,
  to: TicketStatus,
  role: Role,
): boolean {
  return allowedTransitions(status, role).includes(to);
}