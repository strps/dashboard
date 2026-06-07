import { z } from "zod";

export type NoteBlock =
  | { id: string; type: "text"; text: string }
  | { id: string; type: "checklist"; text: string; checked: boolean };

export const blockSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().min(1),
    type: z.literal("text"),
    text: z.string(),
  }),
  z.object({
    id: z.string().min(1),
    type: z.literal("checklist"),
    text: z.string(),
    checked: z.boolean(),
  }),
]);

export const blocksSchema = z.array(blockSchema).max(500);

/** A single note in the user's shared note library. */
export interface Note {
  id: string;
  title: string;
  blocks: NoteBlock[];
  order: number;
}

export const noteSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  blocks: blocksSchema,
  order: z.number().int(),
});

export const noteTitleSchema = z.string().trim().min(1).max(120);

/**
 * Per-instance config for a Notes widget: which library notes this instance
 * shows as tabs (`noteIds`, in display order) and which one is currently open.
 * Persisted on `WidgetInstance.config` and read/written via `useWidgetConfig`.
 */
export const notesConfigSchema = z.object({
  noteIds: z.array(z.string()).default([]),
  activeNoteId: z.string().nullable().default(null),
});

export type NotesConfig = z.infer<typeof notesConfigSchema>;

export const defaultNotesConfig: NotesConfig = {
  noteIds: [],
  activeNoteId: null,
};
