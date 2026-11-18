import "dotenv/config";
import { hash } from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { comments, tickets, users } from "../lib/schema";

interface SeedUser {
  role: "admin" | "agent" | "customer";
  email: string;
  password: string;
  displayName: string;
}

function envOr(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

const seedUsers: SeedUser[] = [
  {
    role: "admin",
    email: envOr("SEED_ADMIN_EMAIL", "admin@helpdesk.local"),
    password: envOr("SEED_ADMIN_PASSWORD", "Admin1234!"),
    displayName: "Ada Admin",
  },
  {
    role: "agent",
    email: envOr("SEED_AGENT_EMAIL", "agent@helpdesk.local"),
    password: envOr("SEED_AGENT_PASSWORD", "Agent1234!"),
    displayName: "Avery Agent",
  },
  {
    role: "customer",
    email: envOr("SEED_CUSTOMER_EMAIL", "customer@helpdesk.local"),
    password: envOr("SEED_CUSTOMER_PASSWORD", "Customer1234!"),
    displayName: "Casey Customer",
  },
];

async function ensureUser(seed: SeedUser): Promise<number> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, seed.email))
    .limit(1);

  if (existing.length > 0) {
    console.log(`- user already exists: ${seed.email} (id=${existing[0].id})`);
    return existing[0].id;
  }

  const passwordHash = await hash(seed.password, 10);
  const inserted = await db
    .insert(users)
    .values({
      role: seed.role,
      email: seed.email,
      passwordHash,
      displayName: seed.displayName,
    })
    .$returningId();

  console.log(
    `- created user: ${seed.email} (id=${inserted[0].id}, role=${seed.role})`,
  );
  return inserted[0].id;
}

async function ensureTickets(ids: {
  admin: number;
  agent: number;
  customer: number;
}): Promise<void> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tickets);

  if (Number(count) > 0) {
    console.log(
      `- tickets already present (${Number(count)}), skipping ticket seed.`,
    );
    return;
  }

  const ticketRows = await db
    .insert(tickets)
    .values([
      {
        number: "HD-000001",
        subject: "Cannot reset my password",
        description:
          "The reset email never arrives. I checked spam as well. Please help.",
        status: "open",
        priority: "high",
        customerId: ids.customer,
      },
      {
        number: "HD-000002",
        subject: "Invoice PDF shows wrong VAT number",
        description:
          "Our VAT number changed last month; the March invoice still shows the old one.",
        status: "in_progress",
        priority: "medium",
        customerId: ids.customer,
        assigneeId: ids.agent,
      },
      {
        number: "HD-000003",
        subject: "Feature request: dark mode for the portal",
        description: "Would love a dark theme for the customer portal.",
        status: "resolved",
        priority: "low",
        customerId: ids.customer,
        assigneeId: ids.agent,
        resolvedAt: new Date(),
      },
    ])
    .$returningId();

  console.log(`- created ${ticketRows.length} tickets`);

  await db.insert(comments).values([
    {
      ticketId: ticketRows[0].id,
      authorId: ids.customer,
      body: "Happy to provide logs or screenshots if that helps.",
      isInternal: false,
    },
    {
      ticketId: ticketRows[1].id,
      authorId: ids.agent,
      body: "Checked with finance: VAT registry update pending, ETA 2 business days.",
      isInternal: true,
    },
    {
      ticketId: ticketRows[2].id,
      authorId: ids.agent,
      body: "Dark mode shipped in the 2026-10 release. Marking as resolved.",
      isInternal: false,
    },
  ]);

  console.log("- created 3 comments");
}

async function main(): Promise<void> {
  console.log("Seeding database...");

  const userIds = {
    admin: await ensureUser(seedUsers[0]),
    agent: await ensureUser(seedUsers[1]),
    customer: await ensureUser(seedUsers[2]),
  };

  await ensureTickets(userIds);

  console.log("Seed complete.");
  console.log("Login credentials:");
  for (const seed of seedUsers) {
    console.log(`  ${seed.role.padEnd(8)} ${seed.email} / ${seed.password}`);
  }
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});