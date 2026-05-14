import { z } from "zod";

export const activityFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(64, "Name is too long"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex like #10b981"),
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
}

export interface OpenEntry {
  activityId: string;
  startedAt: number;
}

export interface ActivitySelectorState {
  activities: Activity[];
  open: OpenEntry | null;
}
