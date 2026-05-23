"use server";

import { listActivities, listActivityTags, listEntriesInRange } from "../../dal";
import type { Activity, RangeEntry } from "../../dal";
import type { ActivityTag } from "../../schemas";

export interface TimeChartData {
  activities: Activity[];
  tags: ActivityTag[];
  entries: RangeEntry[];
}

export async function getTimeChartDataAction(
  fromIso: string,
  toIso: string,
): Promise<TimeChartData> {
  const [activities, tags, entries] = await Promise.all([
    listActivities(),
    listActivityTags(),
    listEntriesInRange(new Date(fromIso), new Date(toIso)),
  ]);
  return { activities, tags, entries };
}
