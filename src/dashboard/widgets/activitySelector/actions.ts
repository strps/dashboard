"use server";

import {
  createActivity,
  deleteActivity,
  listActivities,
  reorderActivities,
  updateActivity,
} from "@/lib/dal/activities";
import {
  getOpenEntry,
  startEntry,
  stopEntry,
} from "@/lib/dal/timeEntries";

import {
  type Activity,
  type ActivitySelectorState,
  type ActivityFormValues,
  type OpenEntry,
  activityFormSchema,
  reorderSchema,
} from "./schemas";

export async function getActivitySelectorStateAction(): Promise<ActivitySelectorState> {
  const [activities, open] = await Promise.all([
    listActivities(),
    getOpenEntry(),
  ]);
  return { activities, open };
}

export async function createActivityAction(
  input: ActivityFormValues,
): Promise<Activity> {
  const parsed = activityFormSchema.parse(input);
  return createActivity(parsed);
}

export async function updateActivityAction(
  id: string,
  input: ActivityFormValues,
): Promise<Activity> {
  const parsed = activityFormSchema.parse(input);
  return updateActivity(id, parsed);
}

export async function deleteActivityAction(id: string): Promise<void> {
  await deleteActivity(id);
}

export async function reorderActivitiesAction(
  orderedIds: string[],
): Promise<void> {
  const parsed = reorderSchema.parse({ orderedIds });
  await reorderActivities(parsed.orderedIds);
}

export async function startActivityAction(
  activityId: string,
): Promise<OpenEntry> {
  return startEntry(activityId);
}

export async function stopActivityAction(): Promise<void> {
  await stopEntry();
}
