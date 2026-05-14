import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { note } from "@/lib/db/schema";
import type { NoteBlock } from "@/dashboard/widgets/notes/schemas";

import { verifySession } from "./session";

export async function getNote(
  widgetInstanceId: string,
): Promise<NoteBlock[] | null> {
  const { userId } = await verifySession();
  const [row] = await db
    .select()
    .from(note)
    .where(
      and(
        eq(note.widgetInstanceId, widgetInstanceId),
        eq(note.userId, userId),
      ),
    )
    .limit(1);
  if (!row) return null;
  return row.blocks;
}

export async function saveNote(
  widgetInstanceId: string,
  blocks: NoteBlock[],
): Promise<void> {
  const { userId } = await verifySession();
  await db
    .insert(note)
    .values({
      widgetInstanceId,
      userId,
      blocks,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: note.widgetInstanceId,
      set: {
        blocks,
        updatedAt: new Date(),
      },
      where: eq(note.userId, userId),
    });
}

export async function deleteNote(widgetInstanceId: string): Promise<void> {
  const { userId } = await verifySession();
  await db
    .delete(note)
    .where(
      and(
        eq(note.widgetInstanceId, widgetInstanceId),
        eq(note.userId, userId),
      ),
    );
}
