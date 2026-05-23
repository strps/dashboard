import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  format,
  isSameDay,
  isSameMonth,
  startOfWeek,
} from "date-fns";

import type { Activity } from "../../dal";
import type { CalendarRangeEntry } from "./schemas";

interface Props {
  anchorDate: Date;
  range: { from: Date; to: Date };
  entries: CalendarRangeEntry[];
  activityById: Map<string, Activity>;
  weekStartsOn: 0 | 1;
}

interface DaySummary {
  date: Date;
  totalMs: number;
  byActivity: Map<string, number>; // activityId → ms
}

function summarize(
  days: Date[],
  entries: CalendarRangeEntry[],
  nowMs: number,
): DaySummary[] {
  return days.map((d) => {
    const dayStart = d.getTime();
    const dayEnd = dayStart + 86_400_000;
    const byActivity = new Map<string, number>();
    let total = 0;
    for (const e of entries) {
      const endedAt = e.endedAt ?? nowMs;
      const overlap = Math.max(0, Math.min(endedAt, dayEnd) - Math.max(e.startedAt, dayStart));
      if (overlap === 0) continue;
      total += overlap;
      byActivity.set(e.activityId, (byActivity.get(e.activityId) ?? 0) + overlap);
    }
    return { date: d, totalMs: total, byActivity };
  });
}

function formatTotal(ms: number): string {
  if (ms < 60_000) return "";
  const minutes = Math.round(ms / 60_000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function MonthView(props: Props) {
  const { anchorDate, range, entries, activityById, weekStartsOn } = props;

  // Same 30s tick so open entries grow.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const fromMs = range.from.getTime();
  const toMs = range.to.getTime();
  const days = useMemo(() => {
    const out: Date[] = [];
    let cursor = new Date(fromMs);
    const end = new Date(toMs);
    while (cursor < end) {
      out.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return out;
  }, [fromMs, toMs]);

  const summaries = useMemo(() => summarize(days, entries, nowMs), [days, entries, nowMs]);

  const weekdayHeaders = useMemo(() => {
    const ref = startOfWeek(new Date(), { weekStartsOn });
    return Array.from({ length: 7 }, (_, i) => format(addDays(ref, i), "EEE"));
  }, [weekStartsOn]);

  const today = new Date();

  return (
    <div className="h-full w-full flex flex-col text-xs">
      <div className="grid grid-cols-7 border-b border-white/10">
        {weekdayHeaders.map((d) => (
          <div
            key={d}
            className="text-[10px] uppercase tracking-widest text-white/40 text-center py-1"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-px bg-white/5">
        {summaries.map(({ date, totalMs, byActivity }) => {
          const inMonth = isSameMonth(date, anchorDate);
          const isToday = isSameDay(date, today);
          const activityColors = Array.from(byActivity.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([id]) => activityById.get(id)?.color ?? "#52525b");

          return (
            <button
              key={date.toISOString()}
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => {
                // v2: jump to day view focused on this date.
              }}
              className={`bg-neutral-900 text-left p-1.5 flex flex-col gap-1 hover:bg-neutral-800 transition-colors ${
                inMonth ? "" : "opacity-40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-mono ${
                    isToday ? "text-emerald-300 font-semibold" : "text-white/70"
                  }`}
                >
                  {format(date, "d")}
                </span>
                {totalMs > 0 && (
                  <span className="text-[10px] font-mono text-white/40">
                    {formatTotal(totalMs)}
                  </span>
                )}
              </div>
              {activityColors.length > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {activityColors.map((c, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
