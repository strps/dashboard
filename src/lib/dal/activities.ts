import "server-only";

import { and, asc, eq, inArray, max } from "drizzle-orm";

import { db } from "@/lib/db";
import { activity, activityActivityTag, activityTag } from "@/lib/db/schema";
import type { ActivityTag, ActivityTagInput } from "@/dashboard/widgets/activitySelector/schemas";

import { verifySession } from "./session";

export interface Activity {
  id: string;
  name: string;
  color: string;
  order: number;
  tagIds: string[];
}

function row(
  r: typeof activity.$inferSelect,
  tagIds: string[],
): Activity {
  return { id: r.id, name: r.name, color: r.color, order: r.order, tagIds };
}

function tagRow(r: typeof activityTag.$inferSelect): ActivityTag {
  return {
    id: r.id,
    name: r.name,
    parentId: r.parentId ?? null,
    color: r.color ?? null,
  };
}

export async function listActivities(): Promise<Activity[]> {
  const { userId } = await verifySession();
  const rows = await db
    .select()
    .from(activity)
    .where(eq(activity.userId, userId))
    .orderBy(asc(activity.order));
  if (rows.length === 0) return [];

  const activityIds = rows.map((r) => r.id);
  const links = await db
    .select()
    .from(activityActivityTag)
    .where(inArray(activityActivityTag.activityId, activityIds));

  const tagsByActivity = new Map<string, string[]>();
  for (const link of links) {
    const arr = tagsByActivity.get(link.activityId);
    if (arr) arr.push(link.tagId);
    else tagsByActivity.set(link.activityId, [link.tagId]);
  }

  return rows.map((r) => row(r, tagsByActivity.get(r.id) ?? []));
}

async function assertTagsOwned(userId: string, tagIds: string[]): Promise<void> {
  if (tagIds.length === 0) return;
  const owned = await db
    .select({ id: activityTag.id })
    .from(activityTag)
    .where(and(eq(activityTag.userId, userId), inArray(activityTag.id, tagIds)));
  if (owned.length !== new Set(tagIds).size) {
    throw new Error("Tag ownership mismatch");
  }
}

export async function createActivity(input: {
  name: string;
  color: string;
  tagIds: string[];
}): Promise<Activity> {
  const { userId } = await verifySession();
  await assertTagsOwned(userId, input.tagIds);
  const [{ next }] = await db
    .select({ next: max(activity.order) })
    .from(activity)
    .where(eq(activity.userId, userId));
  const order = (next ?? -1) + 1;
  const id = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(activity).values({
      id,
      userId,
      name: input.name,
      color: input.color,
      order,
    });
    if (input.tagIds.length > 0) {
      await tx.insert(activityActivityTag).values(
        input.tagIds.map((tagId) => ({ activityId: id, tagId })),
      );
    }
  });

  return { id, name: input.name, color: input.color, order, tagIds: input.tagIds };
}

export async function updateActivity(
  id: string,
  input: { name: string; color: string; tagIds: string[] },
): Promise<Activity> {
  const { userId } = await verifySession();
  await assertTagsOwned(userId, input.tagIds);

  const [owned] = await db
    .select({ order: activity.order })
    .from(activity)
    .where(and(eq(activity.id, id), eq(activity.userId, userId)))
    .limit(1);
  if (!owned) throw new Error("Activity not found");

  await db.transaction(async (tx) => {
    await tx
      .update(activity)
      .set({ name: input.name, color: input.color })
      .where(and(eq(activity.id, id), eq(activity.userId, userId)));
    await tx
      .delete(activityActivityTag)
      .where(eq(activityActivityTag.activityId, id));
    if (input.tagIds.length > 0) {
      await tx.insert(activityActivityTag).values(
        input.tagIds.map((tagId) => ({ activityId: id, tagId })),
      );
    }
  });

  return { id, name: input.name, color: input.color, order: owned.order, tagIds: input.tagIds };
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
        .where(and(eq(activity.id, orderedIds[i]), eq(activity.userId, userId)));
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

// --- Tag CRUD ---

export async function listActivityTags(): Promise<ActivityTag[]> {
  const { userId } = await verifySession();
  const rows = await db
    .select()
    .from(activityTag)
    .where(eq(activityTag.userId, userId))
    .orderBy(asc(activityTag.name));
  return rows.map(tagRow);
}

async function assertTagParentValid(
  userId: string,
  parentId: string | null,
  selfId?: string,
): Promise<void> {
  if (!parentId) return;
  if (parentId === selfId) throw new Error("Tag cannot be its own parent");
  const [owned] = await db
    .select({ id: activityTag.id })
    .from(activityTag)
    .where(and(eq(activityTag.id, parentId), eq(activityTag.userId, userId)))
    .limit(1);
  if (!owned) throw new Error("Parent tag not found");

  if (!selfId) return;
  let cursor: string | null = parentId;
  const seen = new Set<string>();
  while (cursor) {
    if (cursor === selfId) throw new Error("Tag cycle detected");
    if (seen.has(cursor)) break;
    seen.add(cursor);
    const [next] = await db
      .select({ parentId: activityTag.parentId })
      .from(activityTag)
      .where(and(eq(activityTag.id, cursor), eq(activityTag.userId, userId)))
      .limit(1);
    cursor = next?.parentId ?? null;
  }
}

export async function createActivityTag(input: ActivityTagInput): Promise<ActivityTag> {
  const { userId } = await verifySession();
  await assertTagParentValid(userId, input.parentId);
  const [inserted] = await db
    .insert(activityTag)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: input.name,
      parentId: input.parentId,
      color: input.color,
    })
    .returning();
  return tagRow(inserted);
}

export async function updateActivityTag(
  id: string,
  input: ActivityTagInput,
): Promise<ActivityTag> {
  const { userId } = await verifySession();
  await assertTagParentValid(userId, input.parentId, id);
  const [updated] = await db
    .update(activityTag)
    .set({ name: input.name, parentId: input.parentId, color: input.color, updatedAt: new Date() })
    .where(and(eq(activityTag.id, id), eq(activityTag.userId, userId)))
    .returning();
  if (!updated) throw new Error("Tag not found");
  return tagRow(updated);
}

export async function deleteActivityTag(id: string): Promise<void> {
  const { userId } = await verifySession();
  await db
    .delete(activityTag)
    .where(and(eq(activityTag.id, id), eq(activityTag.userId, userId)));
}
