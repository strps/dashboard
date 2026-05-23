import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  cheatsheetEntry,
  cheatsheetEntryTag,
  cheatsheetTag,
} from "@/lib/db/schema";
import type {
  CheatsheetEntry,
  CheatsheetEntryInput,
  CheatsheetTag,
  CheatsheetTagInput,
} from "@/dashboard/modules/cheatsheet/schemas";

import { verifySession } from "./session";

function entryRow(
  r: typeof cheatsheetEntry.$inferSelect,
  tagIds: string[],
): CheatsheetEntry {
  return {
    id: r.id,
    title: r.title,
    syntax: r.syntax,
    description: r.description,
    priority: r.priority,
    tagIds,
  };
}

function tagRow(r: typeof cheatsheetTag.$inferSelect): CheatsheetTag {
  return {
    id: r.id,
    name: r.name,
    parentId: r.parentId ?? null,
    color: r.color ?? null,
  };
}

export async function listEntries(): Promise<CheatsheetEntry[]> {
  const { userId } = await verifySession();
  const rows = await db
    .select()
    .from(cheatsheetEntry)
    .where(eq(cheatsheetEntry.userId, userId))
    .orderBy(desc(cheatsheetEntry.priority), desc(cheatsheetEntry.updatedAt));
  if (rows.length === 0) return [];

  const entryIds = rows.map((r) => r.id);
  const links = await db
    .select()
    .from(cheatsheetEntryTag)
    .where(inArray(cheatsheetEntryTag.entryId, entryIds));

  const tagsByEntry = new Map<string, string[]>();
  for (const link of links) {
    const arr = tagsByEntry.get(link.entryId);
    if (arr) arr.push(link.tagId);
    else tagsByEntry.set(link.entryId, [link.tagId]);
  }

  return rows.map((r) => entryRow(r, tagsByEntry.get(r.id) ?? []));
}

async function assertTagsOwned(
  userId: string,
  tagIds: string[],
): Promise<void> {
  if (tagIds.length === 0) return;
  const owned = await db
    .select({ id: cheatsheetTag.id })
    .from(cheatsheetTag)
    .where(
      and(
        eq(cheatsheetTag.userId, userId),
        inArray(cheatsheetTag.id, tagIds),
      ),
    );
  if (owned.length !== new Set(tagIds).size) {
    throw new Error("Tag ownership mismatch");
  }
}

export async function createEntry(
  input: CheatsheetEntryInput,
): Promise<CheatsheetEntry> {
  const { userId } = await verifySession();
  await assertTagsOwned(userId, input.tagIds);
  const id = crypto.randomUUID();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(cheatsheetEntry).values({
      id,
      userId,
      title: input.title,
      syntax: input.syntax,
      description: input.description,
      priority: input.priority,
      createdAt: now,
      updatedAt: now,
    });
    if (input.tagIds.length > 0) {
      await tx.insert(cheatsheetEntryTag).values(
        input.tagIds.map((tagId) => ({
          entryId: id,
          tagId,
        })),
      );
    }
  });

  return {
    id,
    title: input.title,
    syntax: input.syntax,
    description: input.description,
    priority: input.priority,
    tagIds: input.tagIds,
  };
}

export async function updateEntry(
  id: string,
  input: CheatsheetEntryInput,
): Promise<CheatsheetEntry> {
  const { userId } = await verifySession();
  await assertTagsOwned(userId, input.tagIds);

  const [owned] = await db
    .select({ id: cheatsheetEntry.id })
    .from(cheatsheetEntry)
    .where(and(eq(cheatsheetEntry.id, id), eq(cheatsheetEntry.userId, userId)))
    .limit(1);
  if (!owned) throw new Error("Entry not found");

  await db.transaction(async (tx) => {
    await tx
      .update(cheatsheetEntry)
      .set({
        title: input.title,
        syntax: input.syntax,
        description: input.description,
        priority: input.priority,
        updatedAt: new Date(),
      })
      .where(eq(cheatsheetEntry.id, id));
    await tx
      .delete(cheatsheetEntryTag)
      .where(eq(cheatsheetEntryTag.entryId, id));
    if (input.tagIds.length > 0) {
      await tx.insert(cheatsheetEntryTag).values(
        input.tagIds.map((tagId) => ({
          entryId: id,
          tagId,
        })),
      );
    }
  });

  return {
    id,
    title: input.title,
    syntax: input.syntax,
    description: input.description,
    priority: input.priority,
    tagIds: input.tagIds,
  };
}

export async function deleteEntry(id: string): Promise<void> {
  const { userId } = await verifySession();
  await db
    .delete(cheatsheetEntry)
    .where(
      and(eq(cheatsheetEntry.id, id), eq(cheatsheetEntry.userId, userId)),
    );
}

export async function listTags(): Promise<CheatsheetTag[]> {
  const { userId } = await verifySession();
  const rows = await db
    .select()
    .from(cheatsheetTag)
    .where(eq(cheatsheetTag.userId, userId))
    .orderBy(asc(cheatsheetTag.name));
  return rows.map(tagRow);
}

async function assertParentValid(
  userId: string,
  parentId: string | null,
  selfId?: string,
): Promise<void> {
  if (!parentId) return;
  if (parentId === selfId) throw new Error("Tag cannot be its own parent");
  const [owned] = await db
    .select({ id: cheatsheetTag.id })
    .from(cheatsheetTag)
    .where(
      and(eq(cheatsheetTag.id, parentId), eq(cheatsheetTag.userId, userId)),
    )
    .limit(1);
  if (!owned) throw new Error("Parent tag not found");

  if (!selfId) return;
  // Walk up parent chain to ensure selfId is not an ancestor of parentId.
  let cursor: string | null = parentId;
  const seen = new Set<string>();
  while (cursor) {
    if (cursor === selfId) {
      throw new Error("Tag cycle detected");
    }
    if (seen.has(cursor)) break;
    seen.add(cursor);
    const [next] = await db
      .select({ parentId: cheatsheetTag.parentId })
      .from(cheatsheetTag)
      .where(
        and(eq(cheatsheetTag.id, cursor), eq(cheatsheetTag.userId, userId)),
      )
      .limit(1);
    cursor = next?.parentId ?? null;
  }
}

export async function createTag(
  input: CheatsheetTagInput,
): Promise<CheatsheetTag> {
  const { userId } = await verifySession();
  await assertParentValid(userId, input.parentId);
  const id = crypto.randomUUID();
  const [inserted] = await db
    .insert(cheatsheetTag)
    .values({
      id,
      userId,
      name: input.name,
      parentId: input.parentId,
      color: input.color,
    })
    .returning();
  return tagRow(inserted);
}

export async function updateTag(
  id: string,
  input: CheatsheetTagInput,
): Promise<CheatsheetTag> {
  const { userId } = await verifySession();
  await assertParentValid(userId, input.parentId, id);
  const [updated] = await db
    .update(cheatsheetTag)
    .set({
      name: input.name,
      parentId: input.parentId,
      color: input.color,
      updatedAt: new Date(),
    })
    .where(and(eq(cheatsheetTag.id, id), eq(cheatsheetTag.userId, userId)))
    .returning();
  if (!updated) throw new Error("Tag not found");
  return tagRow(updated);
}

export async function deleteTag(id: string): Promise<void> {
  const { userId } = await verifySession();
  await db
    .delete(cheatsheetTag)
    .where(and(eq(cheatsheetTag.id, id), eq(cheatsheetTag.userId, userId)));
}
