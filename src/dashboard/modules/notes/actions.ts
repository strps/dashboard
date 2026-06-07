"use server";

import {
  createNote,
  deleteNote,
  listNotes,
  renameNote,
  saveNoteBlocks,
} from "@/lib/dal/notes";

import {
  type Note,
  type NoteBlock,
  blocksSchema,
  noteTitleSchema,
} from "./schemas";

export async function listNotesAction(): Promise<Note[]> {
  return listNotes();
}

export async function createNoteAction(title: string): Promise<Note> {
  return createNote(noteTitleSchema.parse(title));
}

export async function renameNoteAction(
  id: string,
  title: string,
): Promise<void> {
  await renameNote(id, noteTitleSchema.parse(title));
}

export async function deleteNoteAction(id: string): Promise<void> {
  await deleteNote(id);
}

export async function saveNoteBlocksAction(
  id: string,
  blocks: NoteBlock[],
): Promise<void> {
  await saveNoteBlocks(id, blocksSchema.parse(blocks));
}
