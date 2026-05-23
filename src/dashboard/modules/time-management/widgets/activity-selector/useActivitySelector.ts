import { useCallback, useEffect, useOptimistic, useState, useTransition } from "react";

import {
  createActivityAction,
  createActivityTagAction,
  deleteActivityAction,
  deleteActivityTagAction,
  getActivitySelectorStateAction,
  reorderActivitiesAction,
  startActivityAction,
  stopActivityAction,
  updateActivityAction,
  updateActivityTagAction,
} from "../../actions";
import type { Activity, ActivityFormValues, ActivityTag, ActivityTagInput, OpenEntry } from "../../schemas";

type ActivitiesAction =
  | { type: "upsert"; activity: Activity }
  | { type: "delete"; id: string }
  | { type: "reorder"; orderedIds: string[] };

function activitiesReducer(
  state: Activity[],
  action: ActivitiesAction,
): Activity[] {
  switch (action.type) {
    case "upsert": {
      const idx = state.findIndex((a) => a.id === action.activity.id);
      const next =
        idx === -1
          ? [...state, action.activity]
          : state.map((a) => (a.id === action.activity.id ? action.activity : a));
      return [...next].sort((a, b) => a.order - b.order);
    }
    case "delete":
      return state.filter((a) => a.id !== action.id);
    case "reorder": {
      const map = new Map(state.map((a) => [a.id, a]));
      const next: Activity[] = [];
      action.orderedIds.forEach((id, i) => {
        const a = map.get(id);
        if (a) next.push({ ...a, order: i });
      });
      return next;
    }
  }
}

type TagsAction =
  | { type: "upsert"; tag: ActivityTag }
  | { type: "delete"; id: string };

function tagsReducer(state: ActivityTag[], action: TagsAction): ActivityTag[] {
  switch (action.type) {
    case "upsert": {
      const idx = state.findIndex((t) => t.id === action.tag.id);
      return idx === -1
        ? [...state, action.tag]
        : state.map((t) => (t.id === action.tag.id ? action.tag : t));
    }
    case "delete":
      return state.filter((t) => t.id !== action.id);
  }
}

type OpenAction = { type: "set"; open: OpenEntry | null };

function openReducer(_state: OpenEntry | null, action: OpenAction) {
  return action.open;
}

export function useActivitySelector() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tags, setTags] = useState<ActivityTag[]>([]);
  const [open, setOpen] = useState<OpenEntry | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [optimisticActivities, applyActivitiesOptimistic] = useOptimistic(
    activities,
    activitiesReducer,
  );
  const [optimisticTags, applyTagsOptimistic] = useOptimistic(
    tags,
    tagsReducer,
  );
  const [optimisticOpen, applyOpenOptimistic] = useOptimistic(
    open,
    openReducer,
  );

  const [, startTransition] = useTransition();

  useEffect(() => {
    if (hydrated) return;
    let cancelled = false;
    getActivitySelectorStateAction().then((state) => {
      if (cancelled) return;
      setActivities(state.activities);
      setTags(state.tags);
      setOpen(state.open);
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (optimisticOpen == null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [optimisticOpen]);

  const active =
    optimisticActivities.find((a) => a.id === optimisticOpen?.activityId) ??
    null;
  const elapsedMs = optimisticOpen ? now - optimisticOpen.startedAt : 0;

  const runOptimistic = useCallback(
    <T>(prepare: () => void, fn: () => Promise<T>): Promise<T> =>
      new Promise<T>((resolve, reject) => {
        startTransition(async () => {
          prepare();
          try {
            resolve(await fn());
          } catch (err) {
            reject(err);
          }
        });
      }),
    [],
  );

  const setActiveActivity = useCallback(
    (activityId: string | null) =>
      runOptimistic(
        () =>
          activityId === null
            ? applyOpenOptimistic({ type: "set", open: null })
            : applyOpenOptimistic({
                type: "set",
                open: { activityId, startedAt: Date.now() },
              }),
        async () => {
          if (activityId === null) {
            await stopActivityAction();
            setOpen(null);
          } else {
            const next = await startActivityAction(activityId);
            setOpen(next);
          }
        },
      ),
    [runOptimistic, applyOpenOptimistic],
  );

  const createActivity = useCallback(
    (input: ActivityFormValues) => {
      const placeholder: Activity = {
        id: `optimistic-${crypto.randomUUID()}`,
        name: input.name,
        color: input.color,
        order: activities.length,
        tagIds: input.tagIds,
      };
      return runOptimistic(
        () => applyActivitiesOptimistic({ type: "upsert", activity: placeholder }),
        async () => {
          const created = await createActivityAction(input);
          setActivities((prev) => {
            const next = [...prev, created];
            next.sort((a, b) => a.order - b.order);
            return next;
          });
          return created;
        },
      );
    },
    [runOptimistic, applyActivitiesOptimistic, activities.length],
  );

  const updateActivity = useCallback(
    (id: string, input: ActivityFormValues) => {
      const existing = activities.find((a) => a.id === id);
      const optimistic: Activity = {
        id,
        name: input.name,
        color: input.color,
        order: existing?.order ?? 0,
        tagIds: input.tagIds,
      };
      return runOptimistic(
        () => applyActivitiesOptimistic({ type: "upsert", activity: optimistic }),
        async () => {
          const updated = await updateActivityAction(id, input);
          setActivities((prev) => {
            const next = prev.map((a) => (a.id === updated.id ? updated : a));
            next.sort((a, b) => a.order - b.order);
            return next;
          });
          return updated;
        },
      );
    },
    [runOptimistic, applyActivitiesOptimistic, activities],
  );

  const deleteActivity = useCallback(
    (id: string) =>
      runOptimistic(
        () => applyActivitiesOptimistic({ type: "delete", id }),
        async () => {
          await deleteActivityAction(id);
          setActivities((prev) => prev.filter((a) => a.id !== id));
          setOpen((cur) => (cur?.activityId === id ? null : cur));
        },
      ),
    [runOptimistic, applyActivitiesOptimistic],
  );

  const reorderActivities = useCallback(
    (orderedIds: string[]) =>
      runOptimistic(
        () => applyActivitiesOptimistic({ type: "reorder", orderedIds }),
        async () => {
          await reorderActivitiesAction(orderedIds);
          setActivities((prev) => {
            const map = new Map(prev.map((a) => [a.id, a]));
            const next: Activity[] = [];
            orderedIds.forEach((id, i) => {
              const a = map.get(id);
              if (a) next.push({ ...a, order: i });
            });
            return next;
          });
        },
      ),
    [runOptimistic, applyActivitiesOptimistic],
  );

  const createTag = useCallback(
    (input: ActivityTagInput) => {
      const placeholder: ActivityTag = {
        id: `optimistic-${crypto.randomUUID()}`,
        name: input.name,
        parentId: input.parentId,
        color: input.color,
      };
      return runOptimistic(
        () => applyTagsOptimistic({ type: "upsert", tag: placeholder }),
        async () => {
          const created = await createActivityTagAction(input);
          setTags((prev) => [...prev, created]);
          return created;
        },
      );
    },
    [runOptimistic, applyTagsOptimistic],
  );

  const updateTag = useCallback(
    (id: string, input: ActivityTagInput) => {
      const existing = tags.find((t) => t.id === id);
      const optimistic: ActivityTag = {
        id,
        name: input.name,
        parentId: input.parentId,
        color: input.color ?? existing?.color ?? null,
      };
      return runOptimistic(
        () => applyTagsOptimistic({ type: "upsert", tag: optimistic }),
        async () => {
          const updated = await updateActivityTagAction(id, input);
          setTags((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          return updated;
        },
      );
    },
    [runOptimistic, applyTagsOptimistic, tags],
  );

  const deleteTag = useCallback(
    (id: string) =>
      runOptimistic(
        () => applyTagsOptimistic({ type: "delete", id }),
        async () => {
          await deleteActivityTagAction(id);
          setTags((prev) => prev.filter((t) => t.id !== id));
          // Remove this tag from all activities locally
          setActivities((prev) =>
            prev.map((a) => ({
              ...a,
              tagIds: a.tagIds.filter((tid) => tid !== id),
            })),
          );
        },
      ),
    [runOptimistic, applyTagsOptimistic],
  );

  return {
    activities: optimisticActivities,
    tags: optimisticTags,
    active,
    open: optimisticOpen,
    elapsedMs,
    hydrated,
    setActiveActivity,
    createActivity,
    updateActivity,
    deleteActivity,
    reorderActivities,
    createTag,
    updateTag,
    deleteTag,
  };
}

export function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
