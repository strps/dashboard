import { z } from "zod";

export const activityFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(64, "Name is too long"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex like #10b981"),
  tagIds: z.uuid().array(),
});

export type ActivityFormValues = z.infer<typeof activityFormSchema>;

export const reorderSchema = z.object({
  orderedIds: z.uuid().array(),
});

export interface Activity {
  id: string;
  name: string;
  color: string;
  order: number;
  tagIds: string[];
}

export interface OpenEntry {
  id: string;
  activityId: string;
  startedAt: number;
}

export interface TextItem {
  id: string;
  text: string;
}

export interface EntryMetadata {
  notes: TextItem[];
}

export const textItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().max(2000),
});

export const entryNotesSchema = z.array(textItemSchema).max(200);

/**
 * Parsed shape of `time_entry.metadata`. Legacy rows stored as `{}` (or anything
 * unexpected) fall back to an empty notes list via `.catch`.
 */
export const entryMetadataSchema = z
  .object({ notes: entryNotesSchema })
  .catch({ notes: [] });

export const updateEntryNotesSchema = z.object({
  id: z.string().min(1),
  notes: entryNotesSchema,
});

export type UpdateEntryNotesInput = z.infer<typeof updateEntryNotesSchema>;

export interface ActivityTag {
  id: string;
  name: string;
  parentId: string | null;
  color: string | null;
}

export const activityTagInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(64, "Name is too long"),
  parentId: z.uuid().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex like #10b981")
    .nullable(),
});

export type ActivityTagInput = z.infer<typeof activityTagInputSchema>;

export interface ActivitySelectorState {
  activities: Activity[];
  open: OpenEntry | null;
  tags: ActivityTag[];
}
