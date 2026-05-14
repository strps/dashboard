import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { timeEntry } from "@/lib/db/schema";

import { activityExistsForUser } from "./activities";
import { verifySession } from "./session";

export interface OpenEntry {
  activityId: string;
  startedAt: number;
}

export async function getOpenEntry(): Promise<OpenEntry | null> {
  const { userId } = await verifySession();
  const [row] = await db
    .select({
      activityId: timeEntry.activityId,
      startedAt: timeEntry.startedAt,
    })
    .from(timeEntry)
    .where(and(eq(timeEntry.userId, userId), isNull(timeEntry.endedAt)))
    .limit(1);
  if (!row) return null;
  return { activityId: row.activityId, startedAt: row.startedAt.getTime() };
}

export async function startEntry(activityId: string): Promise<OpenEntry> {
  const { userId } = await verifySession();
  if (!(await activityExistsForUser(userId, activityId))) {
    throw new Error("Activity not found");
  }

  return await db.transaction(async (tx) => {
    await tx
      .update(timeEntry)
      .set({ endedAt: new Date() })
      .where(and(eq(timeEntry.userId, userId), isNull(timeEntry.endedAt)));

    const [inserted] = await tx
      .insert(timeEntry)
      .values({
        id: crypto.randomUUID(),
        userId,
        activityId,
      })
      .returning();

    return {
      activityId: inserted.activityId,
      startedAt: inserted.startedAt.getTime(),
    };
  });
}

export async function stopEntry(): Promise<void> {
  const { userId } = await verifySession();
  await db
    .update(timeEntry)
    .set({ endedAt: new Date() })
    .where(and(eq(timeEntry.userId, userId), isNull(timeEntry.endedAt)));
}

export interface ClosedEntry {
  id: string;
  activityId: string;
  startedAt: number;
  endedAt: number;
}

export async function listEntries({
  limit = 50,
}: { limit?: number } = {}): Promise<ClosedEntry[]> {
  const { userId } = await verifySession();
  const rows = await db
    .select({
      id: timeEntry.id,
      activityId: timeEntry.activityId,
      startedAt: timeEntry.startedAt,
      endedAt: timeEntry.endedAt,
    })
    .from(timeEntry)
    .where(eq(timeEntry.userId, userId))
    .orderBy(desc(timeEntry.startedAt))
    .limit(limit);

  return rows
    .filter((r) => r.endedAt !== null)
    .map((r) => ({
      id: r.id,
      activityId: r.activityId,
      startedAt: r.startedAt.getTime(),
      endedAt: r.endedAt!.getTime(),
    }));
}
