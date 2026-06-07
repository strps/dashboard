"use server";

import {
  deleteEntry,
  listActivities,
  listEntriesInRange,
  updateEntryActivity,
  updateEntryTimes,
} from "../../dal";
import type { Activity } from "../../dal";
import {
  updateEntryActivitySchema,
  updateEntryTimesSchema,
  type CalendarRangeEntry,
  type UpdateEntryActivityInput,
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

export async function updateEntryActivityAction(
  input: UpdateEntryActivityInput,
): Promise<void> {
  const parsed = updateEntryActivitySchema.parse(input);
  await updateEntryActivity(parsed.id, parsed.activityId);
}

export async function deleteEntryAction(id: string): Promise<void> {
  await deleteEntry(id);
}

export async function getActivitiesAction(): Promise<Activity[]> {
  return listActivities();
}
