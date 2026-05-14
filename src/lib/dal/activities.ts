import "server-only";

import { and, asc, eq, inArray, max } from "drizzle-orm";

import { db } from "@/lib/db";
import { activity } from "@/lib/db/schema";

import { verifySession } from "./session";

export interface Activity {
  id: string;
  name: string;
  color: string;
  order: number;
}

function row(r: typeof activity.$inferSelect): Activity {
  return { id: r.id, name: r.name, color: r.color, order: r.order };
}

export async function listActivities(): Promise<Activity[]> {
  const { userId } = await verifySession();
  const rows = await db
    .select()
    .from(activity)
    .where(eq(activity.userId, userId))
    .orderBy(asc(activity.order));
  return rows.map(row);
}

export async function createActivity(input: {
  name: string;
  color: string;
}): Promise<Activity> {
  const { userId } = await verifySession();
  const [{ next }] = await db
    .select({ next: max(activity.order) })
    .from(activity)
    .where(eq(activity.userId, userId));
  const order = (next ?? -1) + 1;
  const [inserted] = await db
    .insert(activity)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: input.name,
      color: input.color,
      order,
    })
    .returning();
  return row(inserted);
}

export async function updateActivity(
  id: string,
  input: { name: string; color: string },
): Promise<Activity> {
  const { userId } = await verifySession();
  const [updated] = await db
    .update(activity)
    .set({ name: input.name, color: input.color })
    .where(and(eq(activity.id, id), eq(activity.userId, userId)))
    .returning();
  if (!updated) throw new Error("Activity not found");
  return row(updated);
}

export async function deleteActivity(id: string): Promise<void> {
  const { userId } = await verifySession();
  await db
    .delete(activity)
    .where(and(eq(activity.id, id), eq(activity.userId, userId)));
}

export async function reorderActivities(orderedIds: string[]): Promise<void> {
  const { userId } = await verifySession();
  if (orderedIds.length === 0) return;

  const owned = await db
    .select({ id: activity.id })
    .from(activity)
    .where(and(eq(activity.userId, userId), inArray(activity.id, orderedIds)));
  if (owned.length !== orderedIds.length) {
    throw new Error("Activity ownership mismatch");
  }

  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(activity)
        .set({ order: i })
        .where(
          and(eq(activity.id, orderedIds[i]), eq(activity.userId, userId)),
        );
    }
  });
}

export async function activityExistsForUser(
  userId: string,
  id: string,
): Promise<boolean> {
  const [found] = await db
    .select({ id: activity.id })
    .from(activity)
    .where(and(eq(activity.id, id), eq(activity.userId, userId)))
    .limit(1);
  return Boolean(found);
}
