import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  users: {
    customerTickets: r.many.tickets({
      from: r.users.id,
      to: r.tickets.customerId,
      alias: "customer",
    }),
    assignedTickets: r.many.tickets({
      from: r.users.id,
      to: r.tickets.assigneeId,
      alias: "assignee",
    }),
    comments: r.many.comments(),
    refreshTokens: r.many.refreshTokens(),
  },
  categories: {
    tickets: r.many.tickets(),
  },
  tickets: {
    customer: r.one.users({
      from: r.tickets.customerId,
      to: r.users.id,
      alias: "customer",
    }),
    assignee: r.one.users({
      from: r.tickets.assigneeId,
      to: r.users.id,
      alias: "assignee",
    }),
    category: r.one.categories({
      from: r.tickets.categoryId,
      to: r.categories.id,
    }),
    comments: r.many.comments(),
  },
  comments: {
    ticket: r.one.tickets({
      from: r.comments.ticketId,
      to: r.tickets.id,
    }),
    author: r.one.users({
      from: r.comments.authorId,
      to: r.users.id,
    }),
  },
  refreshTokens: {
    user: r.one.users({
      from: r.refreshTokens.userId,
      to: r.users.id,
    }),
  },
}));