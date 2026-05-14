import { useCallback, useEffect, useState } from "react";

import {
  createActivityAction,
  deleteActivityAction,
  getActivitySelectorStateAction,
  reorderActivitiesAction,
  startActivityAction,
  stopActivityAction,
  updateActivityAction,
} from "./actions";
import { useActivityStore } from "./activityStore";
import type { ActivityFormValues } from "./schemas";

export function useActivitySelector() {
  const activities = useActivityStore((s) => s.activities);
  const open = useActivityStore((s) => s.open);
  const hydrated = useActivityStore((s) => s.hydrated);
  const setHydrated = useActivityStore((s) => s.setHydrated);
  const setActivities = useActivityStore((s) => s.setActivities);
  const setOpen = useActivityStore((s) => s.setOpen);
  const upsertActivity = useActivityStore((s) => s.upsertActivity);
  const removeActivity = useActivityStore((s) => s.removeActivity);

  useEffect(() => {
    if (hydrated) return;
    let cancelled = false;
    getActivitySelectorStateAction().then((state) => {
      if (!cancelled) setHydrated(state);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, setHydrated]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (open == null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open]);

  const active = activities.find((a) => a.id === open?.activityId) ?? null;
  const elapsedMs = open ? now - open.startedAt : 0;

  const setActiveActivity = useCallback(
    async (activityId: string | null) => {
      if (activityId === null) {
        await stopActivityAction();
        setOpen(null);
      } else {
        const next = await startActivityAction(activityId);
        setOpen(next);
      }
    },
    [setOpen],
  );

  const createActivity = useCallback(
    async (input: ActivityFormValues) => {
      const created = await createActivityAction(input);
      upsertActivity(created);
      return created;
    },
    [upsertActivity],
  );

  const updateActivity = useCallback(
    async (id: string, input: ActivityFormValues) => {
      const updated = await updateActivityAction(id, input);
      upsertActivity(updated);
      return updated;
    },
    [upsertActivity],
  );

  const deleteActivity = useCallback(
    async (id: string) => {
      await deleteActivityAction(id);
      removeActivity(id);
    },
    [removeActivity],
  );

  const reorderActivities = useCallback(
    async (orderedIds: string[]) => {
      const previous = activities;
      const map = new Map(previous.map((a) => [a.id, a]));
      const optimistic = orderedIds
        .map((id, i) => {
          const a = map.get(id);
          return a ? { ...a, order: i } : null;
        })
        .filter((a): a is NonNullable<typeof a> => a !== null);
      setActivities(optimistic);
      try {
        await reorderActivitiesAction(orderedIds);
      } catch (err) {
        setActivities(previous);
        throw err;
      }
    },
    [activities, setActivities],
  );

  return {
    activities,
    active,
    open,
    elapsedMs,
    hydrated,
    setActiveActivity,
    createActivity,
    updateActivity,
    deleteActivity,
    reorderActivities,
  };
}

export function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
