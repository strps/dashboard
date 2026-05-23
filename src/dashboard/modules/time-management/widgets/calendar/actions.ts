"use server";

import { listActivities, listEntriesInRange } from "../../dal";
import type { Activity } from "../../dal";
import type { CalendarRangeEntry } from "./schemas";

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
