import { db } from "./db";
import { auditLogs } from "./schema";

export interface AuditEntry {
  actorId: number | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata ?? null,
      ipAddress: entry.ipAddress ?? null,
    });
  } catch (error) {
    console.error("Failed to write audit log entry:", error);
  }
}