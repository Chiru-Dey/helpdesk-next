import "dotenv/config";
import { hash } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db } from "../src/lib/db/client";
import { categories, comments, tickets, users } from "../src/lib/db/schema";

async function ensureUser(name: string, email: string, password: string, role: "admin" | "agent" | "customer"): Promise<number> {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) { console.log(`- ${email} exists (id=${existing[0].id})`); return existing[0].id; }
  const inserted = await db.insert(users).values({ name, email, passwordHash: await hash(password, 10), role }).$returningId();
  console.log(`- created ${role}: ${email} (id=${inserted[0].id})`);
  return inserted[0].id;
}

async function ensureCategories(): Promise<number[]> {
  const names = ["Billing", "Technical", "Account", "General"];
  const ids: number[] = [];
  for (const name of names) {
    const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.name, name)).limit(1);
    if (existing[0]) { ids.push(existing[0].id); continue; }
    const inserted = await db.insert(categories).values({ name, description: `${name} support` }).$returningId();
    ids.push(inserted[0].id);
    console.log(`- created category: ${name}`);
  }
  return ids;
}

async function main() {
  console.log("Seeding...");
  const adminId = await ensureUser("Ada Admin", "admin@example.com", "password123", "admin");
  const agentId = await ensureUser("Avery Agent", "agent@example.com", "password123", "agent");
  const custId = await ensureUser("Casey Customer", "customer@example.com", "password123", "customer");
  const catIds = await ensureCategories();

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(tickets);
  if (Number(count) > 0) { console.log("- tickets exist, skipping."); return; }

  const statuses = ["open", "in_progress", "resolved", "closed"] as const;
  const priorities = ["low", "medium", "high", "urgent"] as const;
  const rows = [];
  for (let i = 0; i < 10; i++) {
    rows.push({
      subject: `Demo ticket ${i + 1}: ${["Password reset", "Invoice issue", "Feature request", "Bug report", "Integration help", "Payment failed", "UI glitch", "Data export", "API error", "Onboarding"][i]}`,
      description: `This is the description for demo ticket ${i + 1}. It contains enough text to pass validation.`,
      status: statuses[i % 4],
      priority: priorities[i % 4],
      customerId: custId,
      assigneeId: i % 3 === 0 ? null : agentId,
      categoryId: catIds[i % 4],
      resolvedAt: statuses[i % 4] === "resolved" || statuses[i % 4] === "closed" ? new Date() : null,
    });
  }
  const inserted = await db.insert(tickets).values(rows).$returningId();
  console.log(`- created ${inserted.length} tickets`);

  await db.insert(comments).values([
    { ticketId: inserted[0].id, authorId: custId, body: "Happy to provide more details." },
    { ticketId: inserted[1].id, authorId: agentId, body: "Looking into this now." },
    { ticketId: inserted[2].id, authorId: adminId, body: "Escalated to engineering." },
  ]);
  console.log("- created 3 comments");
  console.log("\nCredentials:");
  console.log("  admin@example.com / password123");
  console.log("  agent@example.com / password123");
  console.log("  customer@example.com / password123");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });