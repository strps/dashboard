import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { useWidgetConfig } from "../../../../components/base-widget/useWidgetConfig";
import type { Activity } from "../../dal";
import { getCalendarDataAction } from "./actions";
import type { CalendarConfig, CalendarRangeEntry, CalendarView } from "./schemas";

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function nowMinutesOfDay(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function computeRange(
  view: CalendarView,
  anchor: Date,
  daysShown: number,
  weekStartsOn: 0 | 1,
): { from: Date; to: Date } {
  if (view === "day") {
    const from = startOfDay(anchor);
    const to = addDays(from, daysShown);
    return { from, to };
  }
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const from = startOfWeek(monthStart, { weekStartsOn });
  const to = addDays(endOfWeek(monthEnd, { weekStartsOn }), 1);
  return { from, to };
}

export interface UseCalendarResult {
  config: CalendarConfig;
  updateConfig: (patch: Partial<CalendarConfig>) => void;
  view: CalendarView;
  setView: (v: CalendarView) => void;
  daysShown: number;
  anchorDate: Date;
  setAnchorDate: (d: Date) => void;
  shiftDay: (delta: number) => void;
  shiftMonth: (delta: number) => void;
  jumpToday: () => void;
  startAnchorMinutes: number;
  windowHours: number;
  followNow: boolean;
  entries: CalendarRangeEntry[];
  activities: Activity[];
  activityById: Map<string, Activity>;
  loading: boolean;
  range: { from: Date; to: Date };
  weekStartsOn: 0 | 1;
}

export function useCalendar(instanceId: string): UseCalendarResult {
  const [config, setConfig] = useWidgetConfig<CalendarConfig>(instanceId);
  const { view, daysShown, startAnchorMinutes, windowHours, followNow, weekStartsOn } = config;

  const updateConfig = useCallback(
    (patch: Partial<CalendarConfig>) => setConfig({ ...config, ...patch }),
    [config, setConfig],
  );

  const setView = useCallback(
    (v: CalendarView) => setConfig({ ...config, view: v }),
    [config, setConfig],
  );

  const [anchorDate, setAnchorDate] = useState<Date>(() => startOfDay(new Date()));

  const [activities, setActivities] = useState<Activity[]>([]);
  const [entries, setEntries] = useState<CalendarRangeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(
    () => computeRange(view, anchorDate, daysShown, weekStartsOn),
    [view, anchorDate, daysShown, weekStartsOn],
  );

  const fromMs = range.from.getTime();
  const toMs = range.to.getTime();

  useEffect(() => {
    let cancelled = false;
    getCalendarDataAction(new Date(fromMs).toISOString(), new Date(toMs).toISOString())
      .then((data) => {
        if (cancelled) return;
        setActivities(data.activities);
        setEntries(data.entries);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fromMs, toMs]);

  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    if (!followNow) return;
    function tick() {
      const m = nowMinutesOfDay();
      const half = (windowHours * 60) / 2;
      const max = 1440 - windowHours * 60;
      const next = clamp(Math.round(m - half), 0, Math.max(0, max));
      setConfig({ ...configRef.current, startAnchorMinutes: next });
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [followNow, windowHours, setConfig]);

  const activityById = useMemo(
    () => new Map(activities.map((a) => [a.id, a])),
    [activities],
  );

  function shiftDay(delta: number) {
    setAnchorDate((d) => addDays(d, delta));
  }
  function shiftMonth(delta: number) {
    setAnchorDate((d) => addMonths(d, delta));
  }
  function jumpToday() {
    setAnchorDate(startOfDay(new Date()));
  }

  return {
    config,
    updateConfig,
    view,
    setView,
    daysShown,
    anchorDate,
    setAnchorDate,
    shiftDay,
    shiftMonth,
    jumpToday,
    startAnchorMinutes,
    windowHours,
    followNow,
    entries,
    activities,
    activityById,
    loading,
    range,
    weekStartsOn,
  };
}
