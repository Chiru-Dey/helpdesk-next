import {
  bigint,
  boolean,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import type { AnyMySqlColumn } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  role: mysqlEnum("role", ["admin", "agent", "customer"])
    .notNull()
    .default("customer"),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
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
    number: varchar("number", { length: 20 }).notNull().unique(),
    subject: varchar("subject", { length: 200 }).notNull(),
    description: text("description").notNull(),
    status: mysqlEnum("status", [
      "open",
      "in_progress",
      "waiting_customer",
      "resolved",
      "closed",
    ])
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
    resolvedAt: timestamp("resolved_at", { mode: "date" }),
    closedAt: timestamp("closed_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .onUpdateNow(),
  },
  (table) => [
    index("tickets_customer_idx").on(table.customerId),
    index("tickets_assignee_idx").on(table.assigneeId),
    index("tickets_status_idx").on(table.status),
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
    isInternal: boolean("is_internal").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("comments_ticket_idx").on(table.ticketId)],
);

export const attachments = mysqlTable(
  "attachments",
  {
    id: int("id").autoincrement().primaryKey(),
    ticketId: int("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    commentId: int("comment_id").references(() => comments.id, {
      onDelete: "cascade",
    }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    storageKey: varchar("storage_key", { length: 512 }).notNull(),
    url: varchar("url", { length: 1024 }).notNull(),
    uploadedBy: int("uploaded_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("attachments_ticket_idx").on(table.ticketId)],
);

export const refreshTokens = mysqlTable(
  "refresh_tokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
    familyId: varchar("family_id", { length: 36 }).notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    revokedAt: timestamp("revoked_at", { mode: "date" }),
    replacedById: int("replaced_by_id").references(
      (): AnyMySqlColumn => refreshTokens.id,
      { onDelete: "set null" },
    ),
    userAgent: varchar("user_agent", { length: 512 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("refresh_tokens_user_idx").on(table.userId),
    index("refresh_tokens_family_idx").on(table.familyId),
  ],
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    actorId: int("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 80 }).notNull(),
    entityType: varchar("entity_type", { length: 40 }).notNull(),
    entityId: varchar("entity_id", { length: 40 }).notNull(),
    metadata: json("metadata"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_actor_idx").on(table.actorId),
  ],
);

export const emailLog = mysqlTable("email_log", {
  id: int("id").autoincrement().primaryKey(),
  toEmail: varchar("to_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 300 }).notNull(),
  status: mysqlEnum("status", ["queued", "sent", "failed"])
    .notNull()
    .default("queued"),
  providerMessageId: varchar("provider_message_id", { length: 255 }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { mode: "date" }),
});

export const usersRelations = relations(users, ({ many }) => ({
  customerTickets: many(tickets, { relationName: "customer" }),
  assignedTickets: many(tickets, { relationName: "assignee" }),
  comments: many(comments),
  refreshTokens: many(refreshTokens),
  auditEntries: many(auditLogs),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  customer: one(users, {
    fields: [tickets.customerId],
    references: [users.id],
    relationName: "customer",
  }),
  assignee: one(users, {
    fields: [tickets.assigneeId],
    references: [users.id],
    relationName: "assignee",
  }),
  comments: many(comments),
  attachments: many(attachments),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  ticket: one(tickets, {
    fields: [comments.ticketId],
    references: [tickets.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [attachments.ticketId],
    references: [tickets.id],
  }),
  comment: one(comments, {
    fields: [attachments.commentId],
    references: [comments.id],
  }),
  uploader: one(users, {
    fields: [attachments.uploadedBy],
    references: [users.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type EmailLogEntry = typeof emailLog.$inferSelect;
export type Role = User["role"];
export type TicketStatus = Ticket["status"];
export type TicketPriority = Ticket["priority"];