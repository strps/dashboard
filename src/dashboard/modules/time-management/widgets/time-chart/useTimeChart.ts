import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, addMonths, format, getISOWeek, startOfDay, startOfMonth, subDays, subMonths } from "date-fns";

import { useWidgetConfig } from "../../../../components/base-widget/useWidgetConfig";
import type { Activity, RangeEntry } from "../../dal";
import type { ActivityTag } from "../../schemas";
import { getTimeChartDataAction } from "./actions";
import type { TimeChartConfig } from "./schemas";

export interface ChartSeries {
  id: string;
  label: string;
  color: string;
}

export interface ChartDataPoint {
  label: string;
  [key: string]: number | string;
}


function computeStackedData(
  entries: RangeEntry[],
  activities: Activity[],
  tags: ActivityTag[],
  config: TimeChartConfig,
  now: number,
  periodOffset: number,
): { dataPoints: ChartDataPoint[]; series: ChartSeries[] } {
  const activityMap = new Map(activities.map((a) => [a.id, a]));
  const tagMap = new Map(tags.map((t) => [t.id, t]));
  const { groupBy, viewMode, monthsBack, selectedTagIds } = config;

  const buckets: { label: string; key: string }[] = [];
  if (viewMode === "week") {
    const refDay = subDays(startOfDay(new Date(now)), periodOffset * 7);
    for (let i = 6; i >= 0; i--) {
      const d = subDays(refDay, i);
      buckets.push({ label: format(d, "EEE"), key: format(d, "yyyy-MM-dd") });
    }
  } else {
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = subMonths(startOfMonth(new Date(now)), i + periodOffset);
      buckets.push({ label: format(d, "MMM"), key: format(d, "yyyy-MM") });
    }
  }

  const acc = new Map<string, Map<string, number>>();
  for (const b of buckets) acc.set(b.key, new Map());

  const entityMeta = new Map<string, { color: string; label: string }>();

  for (const entry of entries) {
    const start = new Date(entry.startedAt);
    const bucketKey =
      viewMode === "week" ? format(start, "yyyy-MM-dd") : format(start, "yyyy-MM");

    const bucketMap = acc.get(bucketKey);
    if (!bucketMap) continue;

    const end = entry.endedAt ?? now;
    const hours = (end - entry.startedAt) / 3_600_000;

    const act = activityMap.get(entry.activityId);
    if (!act) continue;

    if (groupBy === "activity") {
      if (selectedTagIds.length > 0 && !act.tagIds.some((t) => selectedTagIds.includes(t)))
        continue;
      bucketMap.set(act.id, (bucketMap.get(act.id) ?? 0) + hours);
      entityMeta.set(act.id, { color: act.color, label: act.name });
    } else {
      for (const tagId of act.tagIds) {
        if (selectedTagIds.length > 0 && !selectedTagIds.includes(tagId)) continue;
        const tag = tagMap.get(tagId);
        if (!tag) continue;
        bucketMap.set(tag.id, (bucketMap.get(tag.id) ?? 0) + hours);
        entityMeta.set(tag.id, { color: tag.color ?? "#6366f1", label: tag.name });
      }
    }
  }

  const dataPoints: ChartDataPoint[] = buckets.map((b) => {
    const point: ChartDataPoint = { label: b.label };
    const bucketMap = acc.get(b.key)!;
    for (const [id, hours] of bucketMap) {
      point[id] = hours;
    }
    return point;
  });

  const totals = new Map<string, number>();
  for (const dp of dataPoints) {
    for (const [key, val] of Object.entries(dp)) {
      if (key === "label") continue;
      totals.set(key, (totals.get(key) ?? 0) + (val as number));
    }
  }

  const series: ChartSeries[] = [...entityMeta.entries()]
    .map(([id, meta]) => ({ id, label: meta.label, color: meta.color }))
    .sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0));

  return { dataPoints, series };
}

export function useTimeChart(instanceId: string) {
  const [config, setConfig] = useWidgetConfig<TimeChartConfig>(instanceId);

  const updateConfig = useCallback(
    (patch: Partial<TimeChartConfig>) => setConfig({ ...config, ...patch }),
    [config, setConfig],
  );

  const [activities, setActivities] = useState<Activity[]>([]);
  const [tags, setTags] = useState<ActivityTag[]>([]);
  const [entries, setEntries] = useState<RangeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [periodOffset, setPeriodOffset] = useState(0);

  const viewMode = config.viewMode;
  const monthsBack = config.monthsBack;

  useEffect(() => {
    setPeriodOffset(0);
  }, [viewMode, monthsBack]);

  useEffect(() => {
    const now = new Date();
    let from: Date, to: Date;

    if (viewMode === "week") {
      const refDay = subDays(startOfDay(now), periodOffset * 7);
      to = addDays(refDay, 1);
      from = subDays(refDay, 6);
    } else {
      const endMonth = subMonths(startOfMonth(now), periodOffset);
      to = addMonths(endMonth, 1);
      from = subMonths(endMonth, monthsBack - 1);
    }

    let cancelled = false;
    setLoading(true);
    getTimeChartDataAction(from.toISOString(), to.toISOString())
      .then((data) => {
        if (cancelled) return;
        setActivities(data.activities);
        setTags(data.tags);
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
  }, [viewMode, monthsBack, periodOffset, refreshKey]);

  useEffect(() => {
    function onEntryChanged() {
      setRefreshKey((k) => k + 1);
    }
    window.addEventListener("time-entry-changed", onEntryChanged);
    return () => window.removeEventListener("time-entry-changed", onEntryChanged);
  }, []);

  const { dataPoints, series } = useMemo(
    () => computeStackedData(entries, activities, tags, config, Date.now(), periodOffset),
    [entries, activities, tags, config, periodOffset],
  );

  const periodLabel = useMemo(() => {
    const now = new Date();
    if (viewMode === "week") {
      const refDay = subDays(startOfDay(now), periodOffset * 7);
      const firstDay = subDays(refDay, 6);
      const weekNum = getISOWeek(firstDay);
      return `W${weekNum} · ${firstDay.getFullYear()}`;
    } else {
      const endMonth = subMonths(startOfMonth(now), periodOffset);
      const startMonth = subMonths(endMonth, monthsBack - 1);
      if (format(startMonth, "yyyy") === format(endMonth, "yyyy")) {
        return `${format(startMonth, "MMM")} – ${format(endMonth, "MMM yyyy")}`;
      }
      return `${format(startMonth, "MMM yyyy")} – ${format(endMonth, "MMM yyyy")}`;
    }
  }, [viewMode, monthsBack, periodOffset]);

  const shiftPeriod = useCallback((delta: number) => {
    setPeriodOffset((prev) => Math.max(0, prev + delta));
  }, []);

  const goToNow = useCallback(() => setPeriodOffset(0), []);

  return { config, updateConfig, dataPoints, series, tags, loading, periodOffset, periodLabel, shiftPeriod, goToNow };
}
