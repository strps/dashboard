"use server";

import { getNote, saveNote } from "@/lib/dal/notes";

import { type NoteBlock, blocksSchema } from "./schemas";

export async function getNoteAction(
  widgetInstanceId: string,
): Promise<NoteBlock[] | null> {
  return getNote(widgetInstanceId);
}

export async function saveNoteAction(
  widgetInstanceId: string,
  blocks: NoteBlock[],
): Promise<void> {
  const parsed = blocksSchema.parse(blocks);
  await saveNote(widgetInstanceId, parsed);
}
