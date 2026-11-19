import { NextResponse } from "next/server";
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { tickets, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/mailer";
import { dailyDigestEmail } from "@/lib/email/templates";

export async function GET(request: Request) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all agents and admins
    const staff = await db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.isActive, true))
      .then((rows) => rows.filter((r) => r.role === "agent" || r.role === "admin"));

    // Get counts
    const [openCount, unassignedCount, urgentCount] = await Promise.all([
      db.select({ total: count() }).from(tickets).where(eq(tickets.status, "open")),
      db.select({ total: count() }).from(tickets).where(and(eq(tickets.status, "open"), isNull(tickets.assigneeId))),
      db.select({ total: count() }).from(tickets).where(and(eq(tickets.status, "open"), eq(tickets.priority, "urgent"))),
    ]);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Send digest to each staff member
    for (const member of staff) {
      const { subject, html } = dailyDigestEmail({
        recipientName: member.name,
        openCount: openCount[0]?.total ?? 0,
        unassignedCount: unassignedCount[0]?.total ?? 0,
        urgentCount: urgentCount[0]?.total ?? 0,
        url: `${appUrl}/dashboard`,
      });
      await sendEmail(member.email, subject, html);
    }

    return NextResponse.json({
      success: true,
      sentTo: staff.length,
      counts: {
        open: openCount[0]?.total ?? 0,
        unassigned: unassignedCount[0]?.total ?? 0,
        urgent: urgentCount[0]?.total ?? 0,
      },
    });
  } catch (error) {
    console.error("[cron] Daily digest failed:", error);
    return NextResponse.json({ error: "Digest failed" }, { status: 500 });
  }
}