import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "agent", "customer"])
    .notNull()
    .default("customer"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .onUpdateNow(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .onUpdateNow(),
});

export const tickets = mysqlTable(
  "tickets",
  {
    id: int("id").autoincrement().primaryKey(),
    subject: varchar("subject", { length: 200 }).notNull(),
    description: text("description").notNull(),
    status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"])
      .notNull()
      .default("open"),
    priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"])
      .notNull()
      .default("medium"),
    customerId: int("customer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    assigneeId: int("assignee_id").references(() => users.id, {
      onDelete: "set null",
    }),
    categoryId: int("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    index("tickets_customer_status_idx").on(table.customerId, table.status),
    index("tickets_assignee_status_idx").on(table.assigneeId, table.status),
    index("tickets_status_priority_idx").on(table.status, table.priority),
  ],
);

export const comments = mysqlTable(
  "comments",
  {
    id: int("id").autoincrement().primaryKey(),
    ticketId: int("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    authorId: int("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("comments_ticket_idx").on(table.ticketId)],
);

export const refreshTokens = mysqlTable("refresh_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  revokedAt: timestamp("revoked_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type Role = User["role"];
export type TicketStatus = Ticket["status"];
export type TicketPriority = Ticket["priority"];