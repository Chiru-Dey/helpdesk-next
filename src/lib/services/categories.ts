"use cache";

import { eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { ApiError, conflict, forbidden, notFound } from "../api/errors";
import type { SessionUser } from "../auth/session";
import { db } from "../db/client";
import { categories } from "../db/schema";
import { createCategorySchema, updateCategorySchema } from "../validation";

export interface CategoryItem {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

function map(c: typeof categories.$inferSelect): CategoryItem {
  return { id: c.id, name: c.name, description: c.description, created_at: c.createdAt.toISOString() };
}

function assertAdmin(user: SessionUser): void {
  if (user.role !== "admin") throw forbidden("Admin access required.");
}

export async function listCategories(): Promise<CategoryItem[]> {
  cacheTag("categories");
  const rows = await db.select().from(categories).orderBy(categories.name);
  return rows.map(map);
}

export async function createCategory(user: SessionUser, body: unknown): Promise<CategoryItem> {
  assertAdmin(user);
  const input = createCategorySchema.parse(body);
  const exists = await db.select({ id: categories.id }).from(categories).where(eq(categories.name, input.name)).limit(1);
  if (exists[0]) throw conflict("Category name already exists.");
  const inserted = await db
    .insert(categories)
    .values({ name: input.name, description: input.description ?? null })
    .$returningId();
  // revalidateTag removed — moved to route handler
  const rows = await db.select().from(categories).where(eq(categories.id, inserted[0].id)).limit(1);
  return map(rows[0]);
}

export async function patchCategory(user: SessionUser, id: number, body: unknown): Promise<CategoryItem> {
  assertAdmin(user);
  const input = updateCategorySchema.parse(body);
  const existing = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  if (!existing[0]) throw notFound("Category not found.");
  const set: Partial<typeof categories.$inferInsert> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.description !== undefined) set.description = input.description;
  if (Object.keys(set).length === 0) throw new ApiError(400, "validation_error", "No changes.");
  await db.update(categories).set(set).where(eq(categories.id, id));
  // revalidateTag removed — moved to route handler
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return map(rows[0]);
}

export async function deleteCategory(user: SessionUser, id: number): Promise<void> {
  assertAdmin(user);
  const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, id)).limit(1);
  if (!existing[0]) throw notFound("Category not found.");
  await db.delete(categories).where(eq(categories.id, id));
  // revalidateTag removed — moved to route handler
}