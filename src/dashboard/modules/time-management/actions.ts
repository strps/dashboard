"use server";

import {
  createActivity,
  createActivityTag,
  deleteActivity,
  deleteActivityTag,
  getOpenEntry,
  listActivities,
  listActivityTags,
  reorderActivities,
  startEntry,
  stopEntry,
  updateActivity,
  updateActivityTag,
} from "./dal";

import {
  type Activity,
  type ActivitySelectorState,
  type ActivityFormValues,
  type ActivityTag,
  type ActivityTagInput,
  type OpenEntry,
  activityFormSchema,
  activityTagInputSchema,
  reorderSchema,
} from "./schemas";

export async function getActivitySelectorStateAction(): Promise<ActivitySelectorState> {
  const [activities, open, tags] = await Promise.all([
    listActivities(),
    getOpenEntry(),
    listActivityTags(),
  ]);
  return { activities, open, tags };
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

export async function createActivityTagAction(
  input: ActivityTagInput,
): Promise<ActivityTag> {
  const parsed = activityTagInputSchema.parse(input);
  return createActivityTag(parsed);
}

export async function updateActivityTagAction(
  id: string,
  input: ActivityTagInput,
): Promise<ActivityTag> {
  const parsed = activityTagInputSchema.parse(input);
  return updateActivityTag(id, parsed);
}

export async function deleteActivityTagAction(id: string): Promise<void> {
  await deleteActivityTag(id);
}
