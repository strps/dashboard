import { useEffect, useRef, useState } from "react";
import { addDays, format, isSameDay, startOfDay } from "date-fns";

import type { Activity } from "../../dal";
import type { CalendarRangeEntry } from "./schemas";

const GUTTER_PX = 44;

interface Props {
  anchorDate: Date;
  daysShown: number;
  viewStartAnchorMinutes: number | "follow";
  windowHours: number;
  entries: CalendarRangeEntry[];
  activityById: Map<string, Activity>;
}

interface PositionedBlock {
  entryId: string;
  activityId: string;
  topPx: number;
  heightPx: number;
  isOpen: boolean;
}

function positionForDay(
  dayStart: Date,
  entries: CalendarRangeEntry[],
  hourPx: number,
  nowMs: number,
): PositionedBlock[] {
  const dayStartMs = dayStart.getTime();
  const dayEndMs = dayStartMs + 86_400_000;
  const out: PositionedBlock[] = [];

  for (const e of entries) {
    const isOpen = e.endedAt === null;
    const endedAt = e.endedAt ?? nowMs;
    if (endedAt <= dayStartMs || e.startedAt >= dayEndMs) continue;

    const startMin = Math.max(0, (e.startedAt - dayStartMs) / 60_000);
    const endMin = Math.min(1440, (endedAt - dayStartMs) / 60_000);
    if (endMin <= startMin) continue;

    out.push({
      entryId: e.id,
      activityId: e.activityId,
      topPx: (startMin / 60) * hourPx,
      heightPx: ((endMin - startMin) / 60) * hourPx,
      isOpen,
    });
  }
  return out;
}

export function DayView(props: Props) {
  const { anchorDate, daysShown, viewStartAnchorMinutes: startAnchorMinutes, windowHours, entries, activityById } = props;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Measure the scroll body so hourPx stays proportional to visible height.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setContainerHeight(el.clientHeight));
    obs.observe(el);
    setContainerHeight(el.clientHeight);
    return () => obs.disconnect();
  }, []);

  // hourPx = how many px represent one hour; windowHours fills the viewport exactly.
  const hourPx = containerHeight > 0 ? containerHeight / windowHours : 0;
  const totalDayHeight = hourPx * 24;

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Track whether the user has manually scrolled away from the follow position.
  const [userScrolled, setUserScrolled] = useState(true);
  const isProgrammaticScrollRef = useRef(false);

  function handleScroll() {
    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false;
      return;
    }
    if (startAnchorMinutes === "follow") setUserScrolled(true);
  }

  // Scroll to startAnchorMinutes whenever the anchor or scale changes.
  // When "follow", keep the now marker centered in the window unless the user has scrolled away.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || hourPx === 0) return;
    if (startAnchorMinutes === "follow" && userScrolled) return;
    let minutes: number;
    if (startAnchorMinutes === "follow") {
      const nowMinutes = (nowMs - startOfDay(new Date(nowMs)).getTime()) / 60_000;
      minutes = Math.max(0, nowMinutes - (windowHours / 2) * 60);
    } else {
      minutes = startAnchorMinutes;
    }
    isProgrammaticScrollRef.current = true;
    el.scrollTop = (minutes / 60) * hourPx;
  }, [startAnchorMinutes, hourPx, nowMs, windowHours, userScrolled]);

  const today = new Date();
  const days = Array.from({ length: daysShown }, (_, i) => startOfDay(addDays(anchorDate, i)));
  const nowMinutesOfDay = today.getHours() * 60 + today.getMinutes();
  const nowTopPx = (nowMinutesOfDay / 60) * hourPx;

  return (
    <div className="h-full flex flex-col text-xs relative">
      {/* Day headers — fixed, not scrolled */}
      <div className="flex shrink-0 bg-neutral-900/80 backdrop-blur border-b border-white/10">
        <div className="shrink-0" style={{ width: GUTTER_PX }} />
        {days.map((d) => {
          const isToday = isSameDay(d, today);
          return (
            <div
              key={d.toISOString()}
              className={`flex-1 text-center py-1 font-mono ${isToday ? "text-emerald-300" : "text-white/60"}`}
            >
              <div className="text-[10px] uppercase tracking-widest">{format(d, "EEE")}</div>
              <div className="text-[11px]">{format(d, "MMM d")}</div>
            </div>
          );
        })}
      </div>

      {/* Scrollable body — owns the vertical scroll */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {hourPx > 0 && (
          <div className="flex" style={{ height: totalDayHeight }}>
            {/* Hour gutter */}
            <div className="shrink-0 relative" style={{ width: GUTTER_PX }}>
              {Array.from({ length: 24 }, (_, h) => (
                <div
                  key={h}
                  className="absolute right-1 -translate-y-1/2 text-[10px] font-mono text-white/40"
                  style={{ top: h * hourPx }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((dayStart) => {
              const blocks = positionForDay(dayStart, entries, hourPx, nowMs);
              const isToday = isSameDay(dayStart, today);
              return (
                <div
                  key={dayStart.toISOString()}
                  className="flex-1 relative border-l border-white/10"
                >
                  {/* Hour gridlines */}
                  {Array.from({ length: 25 }, (_, h) => (
                    <div
                      key={h}
                      className="absolute left-0 right-0 border-t border-white/5"
                      style={{ top: h * hourPx }}
                    />
                  ))}

                  {/* Entry blocks */}
                  {blocks
                    .slice()
                    .sort((a, b) => a.topPx - b.topPx)
                    .map((b, i) => {
                      const activity = activityById.get(b.activityId);
                      const color = activity?.color ?? "#52525b";
                      return (
                        <div
                          key={b.entryId}
                          className={`absolute left-0.5 right-0.5 rounded-sm  overflow-hidden text-[10px] font-mono text-white ${b.isOpen ? "animate-pulse" : ""}`}
                          style={{
                            top: b.topPx,
                            height: Math.max(2, b.heightPx),
                            background: color,
                            opacity: 0.8,
                            zIndex: i + 1,
                          }}
                          title={activity?.name ?? ""}
                        >
                          {b.heightPx > 18 && (
                            <span className="truncate block ml-2 mt-1.5">{activity?.name ?? "—"}</span>
                          )}
                        </div>
                      );
                    })
                  }

                  {/* Now marker — always visible at its true position */}
                  {isToday && (
                    <div
                      className="absolute left-0 right-0 border-t border-red-400 z-20"
                      style={{ top: nowTopPx }}
                    >
                      <span className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {startAnchorMinutes === "follow" && userScrolled && (
        <button
          onClick={() => setUserScrolled(false)}
          className="absolute bottom-3 right-3 z-30 flex items-center gap-1 rounded-full bg-red-500/80 px-2.5 py-1 text-[10px] font-mono text-white shadow backdrop-blur hover:bg-red-500 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
          now
        </button>
      )}
    </div>
  );
}
