"use client";

import { format } from "date-fns";
import { Trash2 } from "lucide-react";

import { BaseWidget } from "../../../../components/base-widget/BaseWidget";
import { useWidget } from "../../../../components/base-widget/useWidget";
import type { WidgetComponentProps, WidgetDefinition } from "../../../registry";

import { EntryNotesEditor } from "../shared/EntryNotesEditor";

import { useCalendarProperties } from "./useCalendarProperties";

function toLocalInput(ms: number): string {
  return format(new Date(ms), "yyyy-MM-dd'T'HH:mm");
}

function fromLocalInput(value: string): number | null {
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : t;
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function CalendarPropertiesWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);
  const { selectedEntry, activities, activityById, setActivity, setTimes, remove } =
    useCalendarProperties();

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const disabled = !locked;

  const labelCls = "text-[10px] font-mono uppercase tracking-widest text-white/40";
  const inputCls =
    "w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white outline-none focus:border-white/30 disabled:opacity-40";

  let body: React.ReactNode;
  if (!selectedEntry) {
    body = (
      <div className="flex h-full items-center justify-center px-4 text-center text-xs text-white/30">
        Select an entry in a calendar to edit it.
      </div>
    );
  } else {
    const isOpen = selectedEntry.endedAt === null;
    const activity = activityById.get(selectedEntry.activityId);
    const durationMs = isOpen
      ? 0
      : (selectedEntry.endedAt as number) - selectedEntry.startedAt;

    const onStartChange = (value: string) => {
      const start = fromLocalInput(value);
      if (start === null) return;
      const end = selectedEntry.endedAt;
      if (start >= (end ?? Date.now())) return;
      setTimes(start, end);
    };

    const onEndChange = (value: string) => {
      if (selectedEntry.endedAt === null) return;
      const end = fromLocalInput(value);
      if (end === null) return;
      if (selectedEntry.startedAt >= end) return;
      setTimes(selectedEntry.startedAt, end);
    };

    body = (
      <div className="flex flex-col gap-3 p-3">
        {/* Activity */}
        <div className="flex flex-col gap-1">
          <span className={labelCls}>Activity</span>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: activity?.color ?? "#52525b" }}
            />
            <select
              value={selectedEntry.activityId}
              disabled={disabled}
              onMouseDown={stop}
              onChange={(e) => setActivity(e.target.value)}
              className={inputCls}
            >
              {!activity && (
                <option value={selectedEntry.activityId}>(unknown)</option>
              )}
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start */}
        <div className="flex flex-col gap-1">
          <span className={labelCls}>Start</span>
          <input
            type="datetime-local"
            value={toLocalInput(selectedEntry.startedAt)}
            disabled={disabled}
            onMouseDown={stop}
            onChange={(e) => onStartChange(e.target.value)}
            className={inputCls}
          />
        </div>

        {/* End */}
        <div className="flex flex-col gap-1">
          <span className={labelCls}>End</span>
          {isOpen ? (
            <span className="px-2 py-1.5 text-xs font-mono text-emerald-300">
              running…
            </span>
          ) : (
            <input
              type="datetime-local"
              value={toLocalInput(selectedEntry.endedAt as number)}
              disabled={disabled}
              onMouseDown={stop}
              onChange={(e) => onEndChange(e.target.value)}
              className={inputCls}
            />
          )}
        </div>

        {/* Duration */}
        <div className="flex items-center justify-between">
          <span className={labelCls}>Duration</span>
          <span className="text-xs font-mono text-white/70">
            {isOpen ? "running" : formatDuration(durationMs)}
          </span>
        </div>

        {/* Notes */}
        <EntryNotesEditor
          key={selectedEntry.id}
          entryId={selectedEntry.id}
          disabled={disabled}
        />

        {/* Delete */}
        <button
          type="button"
          disabled={disabled}
          onMouseDown={stop}
          onClick={remove}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-40"
        >
          <Trash2 size={12} />
          Delete entry
        </button>
      </div>
    );
  }

  return (
    <BaseWidget id={id} locked={locked} onRemove={onRemove}>
      <div className="h-full w-full overflow-y-auto rounded-xl bg-white/5">
        <div className="px-3 pt-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Entry properties
        </div>
        {body}
      </div>
    </BaseWidget>
  );
}

export const calendarPropertiesWidget: WidgetDefinition = {
  type: "calendarProperties",
  label: "Calendar properties",
  defaultSize: { w: 3, h: 4 },
  minW: 2,
  minH: 3,
  component: CalendarPropertiesWidget,
};
