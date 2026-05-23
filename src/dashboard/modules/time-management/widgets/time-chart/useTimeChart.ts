import { useCallback, useEffect, useMemo, useState } from "react";
import { startOfDay, subDays } from "date-fns";

import { useWidgetConfig } from "../../../../components/base-widget/useWidgetConfig";
import type { Activity, RangeEntry } from "../../dal";
import type { ActivityTag } from "../../schemas";
import { getTimeChartDataAction } from "./actions";
import type { TimeChartConfig } from "./schemas";

export interface ChartBar {
  id: string;
  label: string;
  color: string;
  hours: number;
}

function computeRange(dateRange: TimeChartConfig["dateRange"]): { from: Date; to: Date } {
  const to = new Date();
  const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
  return { from: startOfDay(subDays(to, days)), to };
}

function computeBars(
  entries: RangeEntry[],
  activities: Activity[],
  tags: ActivityTag[],
  config: TimeChartConfig,
  now: number,
): ChartBar[] {
  const activityMap = new Map(activities.map((a) => [a.id, a]));
  const tagMap = new Map(tags.map((t) => [t.id, t]));
  const { groupBy, selectedTagIds } = config;

  if (groupBy === "activity") {
    const hoursById = new Map<string, number>();
    for (const e of entries) {
      const end = e.endedAt ?? now;
      hoursById.set(e.activityId, (hoursById.get(e.activityId) ?? 0) + (end - e.startedAt) / 3_600_000);
    }
    const bars: ChartBar[] = [];
    for (const [actId, hours] of hoursById) {
      const act = activityMap.get(actId);
      if (!act) continue;
      if (selectedTagIds.length > 0 && !act.tagIds.some((t) => selectedTagIds.includes(t))) continue;
      bars.push({ id: actId, label: act.name, color: act.color, hours });
    }
    return bars.sort((a, b) => b.hours - a.hours);
  }

  // groupBy === "tag"
  const hoursById = new Map<string, number>();
  for (const e of entries) {
    const act = activityMap.get(e.activityId);
    if (!act) continue;
    const end = e.endedAt ?? now;
    const duration = (end - e.startedAt) / 3_600_000;
    for (const tagId of act.tagIds) {
      hoursById.set(tagId, (hoursById.get(tagId) ?? 0) + duration);
    }
  }
  const tagIds = selectedTagIds.length > 0 ? selectedTagIds : [...hoursById.keys()];
  const bars: ChartBar[] = [];
  for (const tagId of tagIds) {
    const hours = hoursById.get(tagId) ?? 0;
    if (hours === 0) continue;
    const tag = tagMap.get(tagId);
    if (!tag) continue;
    bars.push({ id: tagId, label: tag.name, color: tag.color ?? "#6366f1", hours });
  }
  return bars.sort((a, b) => b.hours - a.hours);
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

  const range = useMemo(() => computeRange(config.dateRange), [config.dateRange]);
  const fromMs = range.from.getTime();
  const toMs = range.to.getTime();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTimeChartDataAction(
      new Date(fromMs).toISOString(),
      new Date(toMs).toISOString(),
    )
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
  }, [fromMs, toMs, refreshKey]);

  useEffect(() => {
    function onEntryChanged() {
      setRefreshKey((k) => k + 1);
    }
    window.addEventListener("time-entry-changed", onEntryChanged);
    return () => window.removeEventListener("time-entry-changed", onEntryChanged);
  }, []);

  const bars = useMemo(
    () => computeBars(entries, activities, tags, config, Date.now()),
    [entries, activities, tags, config],
  );

  return { config, updateConfig, bars, tags, loading };
}
