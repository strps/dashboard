import { useCallback, useEffect, useMemo, useState } from "react";

import type { Activity } from "../../dal";
import {
  deleteEntryAction,
  getActivitiesAction,
  updateEntryActivityAction,
  updateEntryTimesAction,
} from "../calendar/actions";
import { useCalendarSelection } from "../calendar/calendarSelectionContext";

export function useCalendarProperties() {
  const { selectedEntry, selectEntry } = useCalendarSelection();
  const [activities, setActivities] = useState<Activity[]>([]);

  // Load the activity catalog (for the dropdown + name/color resolution) and
  // keep it fresh — `time-entry-changed` fires after any entry/activity mutation.
  useEffect(() => {
    let cancelled = false;
    function load() {
      getActivitiesAction()
        .then((a) => {
          if (!cancelled) setActivities(a);
        })
        .catch(() => {});
    }
    load();
    window.addEventListener("time-entry-changed", load);
    return () => {
      cancelled = true;
      window.removeEventListener("time-entry-changed", load);
    };
  }, []);

  const activityById = useMemo(
    () => new Map(activities.map((a) => [a.id, a])),
    [activities],
  );

  const setActivity = useCallback(
    (activityId: string) => {
      if (!selectedEntry) return;
      const next = { ...selectedEntry, activityId };
      selectEntry(next);
      updateEntryActivityAction({ id: next.id, activityId })
        .then(() => {
          window.dispatchEvent(new CustomEvent("time-entry-changed"));
        })
        .catch(() => {});
    },
    [selectedEntry, selectEntry],
  );

  const setTimes = useCallback(
    (startedAt: number, endedAt: number | null) => {
      if (!selectedEntry) return;
      const next = { ...selectedEntry, startedAt, endedAt };
      selectEntry(next);
      updateEntryTimesAction({ id: next.id, startedAt, endedAt })
        .then(() => {
          window.dispatchEvent(new CustomEvent("time-entry-changed"));
        })
        .catch(() => {});
    },
    [selectedEntry, selectEntry],
  );

  const remove = useCallback(() => {
    if (!selectedEntry) return;
    const id = selectedEntry.id;
    selectEntry(null);
    deleteEntryAction(id)
      .then(() => {
        window.dispatchEvent(new CustomEvent("time-entry-changed"));
      })
      .catch(() => {});
  }, [selectedEntry, selectEntry]);

  return { selectedEntry, activities, activityById, setActivity, setTimes, remove };
}
