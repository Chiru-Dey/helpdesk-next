"use cache";

import { eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { ApiError, conflict, forbidden, notFound } from "../api/errors";
import { hashPassword } from "../auth/password";
import type { SessionUser } from "../auth/session";
import { db } from "../db/client";
import { tickets, users } from "../db/schema";
import { createUserSchema, updateUserSchema } from "../validation";

export interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

function map(u: typeof users.$inferSelect): UserItem {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    is_active: u.isActive,
    created_at: u.createdAt.toISOString(),
  };
}

function assertAdmin(user: SessionUser): void {
  if (user.role !== "admin") throw forbidden("Admin access required.");
}

export async function listUsers(user: SessionUser): Promise<UserItem[]> {
  cacheTag("users");
  assertAdmin(user);
  const rows = await db.select().from(users).orderBy(users.name);
  return rows.map(map);
}

export async function getUser(user: SessionUser, id: number): Promise<UserItem> {
  assertAdmin(user);
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!rows[0]) throw notFound("User not found.");
  return map(rows[0]);
}

export async function createUser(admin: SessionUser, body: unknown): Promise<UserItem> {
  assertAdmin(admin);
  const input = createUserSchema.parse(body);
  const email = input.email.toLowerCase();
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (exists[0]) throw conflict("Email already registered.");
  const passwordHash = await hashPassword(input.password);
  const inserted = await db
    .insert(users)
    .values({ name: input.name, email, passwordHash, role: input.role })
    .$returningId();
  // revalidateTag removed — moved to route handler
  return getUser(admin, inserted[0].id);
}

export async function patchUser(admin: SessionUser, id: number, body: unknown): Promise<UserItem> {
  assertAdmin(admin);
  const input = updateUserSchema.parse(body);
  const existing = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing[0]) throw notFound("User not found.");

  const set: Partial<typeof users.$inferInsert> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.email !== undefined) set.email = input.email.toLowerCase();
  if (input.role !== undefined) set.role = input.role;
  if (input.is_active !== undefined) set.isActive = input.is_active;
  if (input.password !== undefined) set.passwordHash = await hashPassword(input.password);

  if (Object.keys(set).length === 0) throw new ApiError(400, "validation_error", "No changes.");
  await db.update(users).set(set).where(eq(users.id, id));
  // revalidateTag removed — moved to route handler
  return getUser(admin, id);
}

export async function deleteUser(admin: SessionUser, id: number): Promise<void> {
  assertAdmin(admin);
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
  if (!existing[0]) throw notFound("User not found.");
  const ticketExists = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.customerId, id))
    .limit(1);
  if (ticketExists[0]) {
    await db.update(users).set({ isActive: false }).where(eq(users.id, id));
    // revalidateTag removed — moved to route handler
    return;
  }
  await db.delete(users).where(eq(users.id, id));
  // revalidateTag removed — moved to route handler
}