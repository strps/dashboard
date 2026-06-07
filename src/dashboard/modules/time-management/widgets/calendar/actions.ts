"use server";

import { listActivities, listEntriesInRange, updateEntryTimes } from "../../dal";
import type { Activity } from "../../dal";
import {
  updateEntryTimesSchema,
  type CalendarRangeEntry,
  type UpdateEntryTimesInput,
} from "./schemas";

export async function getCalendarDataAction(
  fromIso: string,
  toIso: string,
): Promise<{ activities: Activity[]; entries: CalendarRangeEntry[] }> {
  const [activities, entries] = await Promise.all([
    listActivities(),
    listEntriesInRange(new Date(fromIso), new Date(toIso)),
  ]);
  return { activities, entries };
}

export async function updateEntryTimesAction(
  input: UpdateEntryTimesInput,
): Promise<void> {
  const parsed = updateEntryTimesSchema.parse(input);
  await updateEntryTimes(parsed.id, parsed.startedAt, parsed.endedAt);
}
