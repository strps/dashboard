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
  activityId: string;
  startedAt: number;
}

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
