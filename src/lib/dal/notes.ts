import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { note } from "@/lib/db/schema";
import type { Note, NoteBlock } from "@/dashboard/modules/notes/schemas";

import { verifySession } from "./session";

function noteRow(r: typeof note.$inferSelect): Note {
  return {
    id: r.id,
    title: r.title,
    blocks: r.blocks,
    order: r.order,
  };
}

export async function listNotes(): Promise<Note[]> {
  const { userId } = await verifySession();
  const rows = await db
    .select()
    .from(note)
    .where(eq(note.userId, userId))
    .orderBy(asc(note.order), asc(note.createdAt));
  return rows.map(noteRow);
}

export async function createNote(title: string): Promise<Note> {
  const { userId } = await verifySession();
  const existing = await db
    .select({ order: note.order })
    .from(note)
    .where(eq(note.userId, userId));
  const nextOrder = existing.reduce((m, r) => Math.max(m, r.order + 1), 0);
  const row = {
    id: crypto.randomUUID(),
    userId,
    title,
    blocks: [] as NoteBlock[],
    order: nextOrder,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.insert(note).values(row);
  return noteRow(row);
}

export async function renameNote(id: string, title: string): Promise<void> {
  const { userId } = await verifySession();
  await db
    .update(note)
    .set({ title, updatedAt: new Date() })
    .where(and(eq(note.id, id), eq(note.userId, userId)));
}

export async function deleteNote(id: string): Promise<void> {
  const { userId } = await verifySession();
  await db
    .delete(note)
    .where(and(eq(note.id, id), eq(note.userId, userId)));
}

export async function saveNoteBlocks(
  id: string,
  blocks: NoteBlock[],
): Promise<void> {
  const { userId } = await verifySession();
  await db
    .update(note)
    .set({ blocks, updatedAt: new Date() })
    .where(and(eq(note.id, id), eq(note.userId, userId)));
}
