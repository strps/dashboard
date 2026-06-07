import { z } from "zod";

export type CalendarView = "day" | "month";

export interface CalendarRangeEntry {
  id: string;
  activityId: string;
  startedAt: number;
  endedAt: number | null;
}

export const calendarConfigSchema = z.object({
  view: z.enum(["day", "month"]),
  daysShown: z.number().int().min(1).max(7),
  startAnchorMinutes: z.number().int().min(0).max(1439),
  windowHours: z.number().int().min(1).max(24),
  followNow: z.boolean(),
  weekStartsOn: z.union([z.literal(0), z.literal(1)]),
  editor: z.boolean(),
  editorSnapMinutes: z.union([z.literal(1), z.literal(5), z.literal(15)]),
});
export type CalendarConfig = z.infer<typeof calendarConfigSchema>;

export const defaultCalendarConfig: CalendarConfig = {
  view: "day",
  daysShown: 1,
  startAnchorMinutes: 8 * 60,
  windowHours: 10,
  followNow: false,
  weekStartsOn: 1,
  editor: false,
  editorSnapMinutes: 5,
};

export const updateEntryTimesSchema = z.object({
  id: z.string().min(1),
  startedAt: z.number().int(),
  endedAt: z.number().int().nullable(),
});
export type UpdateEntryTimesInput = z.infer<typeof updateEntryTimesSchema>;

export const updateEntryActivitySchema = z.object({
  id: z.string().min(1),
  activityId: z.string().min(1),
});
export type UpdateEntryActivityInput = z.infer<typeof updateEntryActivitySchema>;
