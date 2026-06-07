import { useEffect, useRef, useState } from "react";
import { addDays, format, isSameDay, startOfDay } from "date-fns";

import type { Activity } from "../../dal";
import { useCalendarSelection } from "./calendarSelectionContext";
import type { CalendarRangeEntry } from "./schemas";

const GUTTER_PX = 44;

type DragKind = "move" | "resize-start" | "resize-end";

interface DragState {
  entryId: string;
  kind: DragKind;
  startY: number;
  origStart: number;
  origEnd: number | null;
}

interface Draft {
  entryId: string;
  startedAt: number;
  endedAt: number | null;
}

interface Props {
  anchorDate: Date;
  daysShown: number;
  viewStartAnchorMinutes: number | "follow";
  windowHours: number;
  entries: CalendarRangeEntry[];
  activityById: Map<string, Activity>;
  editor: boolean;
  locked: boolean;
  snapMinutes: number;
  onUpdateEntryTimes: (
    entryId: string,
    startedAt: number,
    endedAt: number | null,
  ) => void;
}

interface PositionedBlock {
  entryId: string;
  activityId: string;
  topPx: number;
  heightPx: number;
  isOpen: boolean;
  startMs: number;
  endMs: number | null;
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
      startMs: e.startedAt,
      endMs: e.endedAt,
    });
  }
  return out;
}

export function DayView(props: Props) {
  const {
    anchorDate,
    daysShown,
    viewStartAnchorMinutes: startAnchorMinutes,
    windowHours,
    entries,
    activityById,
    editor,
    locked,
    snapMinutes,
    onUpdateEntryTimes,
  } = props;

  const editingEnabled = editor && locked;

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

  // --- Editor: drag handles to adjust entry timestamps ---
  // Selection lives in shared context so a sibling properties widget can read it.
  const { selectedEntry, selectEntry } = useCalendarSelection();
  const [draft, setDraft] = useState<Draft | null>(null);
  // Refs let the live drag listeners read current values without re-subscribing.
  // Synced in an effect (not during render); a drag never overlaps a resize/config
  // change, so a one-render lag here is inconsequential.
  const hourPxRef = useRef(hourPx);
  const snapRef = useRef(snapMinutes);
  const onUpdateRef = useRef(onUpdateEntryTimes);
  useEffect(() => {
    hourPxRef.current = hourPx;
    snapRef.current = snapMinutes;
    onUpdateRef.current = onUpdateEntryTimes;
  }, [hourPx, snapMinutes, onUpdateEntryTimes]);

  // Holds a teardown for the active drag's window listeners (also used on unmount).
  const dragCleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => () => dragCleanupRef.current?.(), []);

  // When this calendar is unlocked (the dashboard enters arrange mode), drop a
  // selection it owns so the properties widget reverts to its empty state. The
  // selection persists across editor-mode toggles — only entering arrange mode
  // clears it.
  useEffect(() => {
    if (locked) return;
    if (selectedEntry && entries.some((e) => e.id === selectedEntry.id)) {
      selectEntry(null);
    }
  }, [locked, entries, selectedEntry, selectEntry]);

  function startDrag(
    ev: React.PointerEvent,
    entry: {
      entryId: string;
      activityId: string;
      startMs: number;
      endMs: number | null;
    },
    kind: DragKind,
  ) {
    if (!editingEnabled) return;
    ev.stopPropagation();
    ev.preventDefault();
    selectEntry({
      id: entry.entryId,
      activityId: entry.activityId,
      startedAt: entry.startMs,
      endedAt: entry.endMs,
    });

    const drag: DragState = {
      entryId: entry.entryId,
      kind,
      startY: ev.clientY,
      origStart: entry.startMs,
      origEnd: entry.endMs,
    };

    const onMove = (e: PointerEvent) => {
      const px = hourPxRef.current;
      if (px === 0) return;
      const snap = snapRef.current > 0 ? snapRef.current : 1;
      const deltaMin =
        Math.round(((e.clientY - drag.startY) / px) * 60 / snap) * snap;
      const deltaMs = deltaMin * 60_000;
      const minMs = snap * 60_000;
      const effEnd = drag.origEnd ?? Date.now();

      let start = drag.origStart;
      let end = drag.origEnd;
      if (drag.kind === "resize-start") {
        start = Math.min(drag.origStart + deltaMs, effEnd - minMs);
      } else if (drag.kind === "resize-end") {
        if (drag.origEnd === null) return;
        end = Math.max(drag.origEnd + deltaMs, drag.origStart + minMs);
      } else {
        if (drag.origEnd === null) return;
        start = drag.origStart + deltaMs;
        end = drag.origEnd + deltaMs;
      }
      setDraft({ entryId: drag.entryId, startedAt: start, endedAt: end });
    };

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      dragCleanupRef.current = null;
      setDraft((d) => {
        if (
          d &&
          d.entryId === drag.entryId &&
          (d.startedAt !== drag.origStart || d.endedAt !== drag.origEnd)
        ) {
          onUpdateRef.current(drag.entryId, d.startedAt, d.endedAt);
          // Keep the shared selection in sync so the properties widget tracks drags.
          selectEntry({
            id: drag.entryId,
            activityId: entry.activityId,
            startedAt: d.startedAt,
            endedAt: d.endedAt,
          });
        }
        return null;
      });
    }

    dragCleanupRef.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

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

  // While dragging, show the entry at its draft timestamps.
  const effectiveEntries = draft
    ? entries.map((e) =>
        e.id === draft.entryId
          ? { ...e, startedAt: draft.startedAt, endedAt: draft.endedAt }
          : e,
      )
    : entries;

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
              const blocks = positionForDay(dayStart, effectiveEntries, hourPx, nowMs);
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
                      const selectable = locked;
                      const editable = editingEnabled;
                      const selected = selectable && selectedEntry?.id === b.entryId;
                      const canMove = editable && !b.isOpen;
                      return (
                        <div
                          key={b.entryId}
                          className={`absolute left-0.5 right-0.5 rounded-sm overflow-hidden text-[10px] font-mono text-white ${b.isOpen ? "animate-pulse" : ""} ${selectable ? "select-none" : ""} ${canMove ? "cursor-grab" : ""} ${selected ? "ring-2 ring-white/80 ring-inset" : ""}`}
                          style={{
                            top: b.topPx,
                            height: Math.max(2, b.heightPx),
                            background: color,
                            opacity: 0.8,
                            zIndex: selected ? 100 : i + 1,
                          }}
                          title={activity?.name ?? ""}
                          onMouseDown={selectable ? (e) => e.stopPropagation() : undefined}
                          onClick={
                            selectable
                              ? () =>
                                  selectEntry({
                                    id: b.entryId,
                                    activityId: b.activityId,
                                    startedAt: b.startMs,
                                    endedAt: b.endMs,
                                  })
                              : undefined
                          }
                          onPointerDown={
                            canMove
                              ? (e) =>
                                  startDrag(
                                    e,
                                    {
                                      entryId: b.entryId,
                                      activityId: b.activityId,
                                      startMs: b.startMs,
                                      endMs: b.endMs,
                                    },
                                    "move",
                                  )
                              : undefined
                          }
                        >
                          {b.heightPx > 18 && (
                            <span className="truncate block ml-2 mt-1.5">{activity?.name ?? "—"}</span>
                          )}

                          {editable && selected && (
                            <>
                              {/* Start (top) handle — small circle at the top end */}
                              <div
                                className="absolute left-1/2 top-0.5 h-3 w-3 -translate-x-1/2 cursor-ns-resize rounded-full border border-black/30 bg-white shadow"
                                onPointerDown={(e) =>
                                  startDrag(
                                    e,
                                    {
                                      entryId: b.entryId,
                                      activityId: b.activityId,
                                      startMs: b.startMs,
                                      endMs: b.endMs,
                                    },
                                    "resize-start",
                                  )
                                }
                              />
                              {/* End (bottom) handle — circle, closed entries only */}
                              {!b.isOpen && (
                                <div
                                  className="absolute bottom-0.5 left-1/2 h-3 w-3 -translate-x-1/2 cursor-ns-resize rounded-full border border-black/30 bg-white shadow"
                                  onPointerDown={(e) =>
                                    startDrag(
                                      e,
                                      {
                                        entryId: b.entryId,
                                        activityId: b.activityId,
                                        startMs: b.startMs,
                                        endMs: b.endMs,
                                      },
                                      "resize-end",
                                    )
                                  }
                                />
                              )}
                            </>
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
