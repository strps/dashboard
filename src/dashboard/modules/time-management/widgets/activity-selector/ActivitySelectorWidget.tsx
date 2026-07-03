"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Gauge, GaugeCircle } from "lucide-react";
import { BaseWidget } from "../../../../components/base-widget/BaseWidget";
import { useWidget } from "../../../../components/base-widget/useWidget";
import { useWidgetConfig } from "../../../../components/base-widget/useWidgetConfig";
import type { WidgetComponentProps, WidgetDefinition } from "../../../registry";
import { EntryNotesEditor } from "../shared/EntryNotesEditor";
import { SevenSegmentDisplay } from "../shared/SevenSegmentDisplay";
import { formatElapsed, useActivitySelector } from "./useActivitySelector";
import {
  activitySelectorConfigSchema,
  defaultActivitySelectorConfig,
  type ActivitySelectorConfig,
} from "./schemas";

type ClockMode = ActivitySelectorConfig["clockMode"];

const CLOCK_MODES: ClockMode[] = ["visible", "muted", "hide-big", "hidden"];

const CLOCK_MODE_ICONS: Record<ClockMode, React.ReactNode> = {
  visible: <Gauge size={11} />,
  muted: <GaugeCircle size={11} />,
  "hide-big": <Eye size={11} />,
  hidden: <EyeOff size={11} />,
};

const CLOCK_MODE_TITLES: Record<ClockMode, string> = {
  visible: "Clock: visible",
  muted: "Clock: muted",
  "hide-big": "Clock: hide big",
  hidden: "Clock: hidden",
};

export function ActivitySelectorWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);
  const {
    activities,
    tags,
    active,
    open: runningEntry,
    elapsedMs,
    hydrated,
    setActiveActivity,
  } = useActivitySelector();

  const activeTags = active ? tags.filter((t) => active.tagIds.includes(t.id)) : [];

  const [open, setOpen] = useState(false);
  const [config, setConfig] = useWidgetConfig<ActivitySelectorConfig>(id);
  const clockMode = config.clockMode;
  const ref = useRef<HTMLDivElement>(null);

  const cycleClockMode = () =>
    setConfig({
      clockMode:
        CLOCK_MODES[(CLOCK_MODES.indexOf(clockMode) + 1) % CLOCK_MODES.length],
    });

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const select = async (activityId: string | null) => {
    setOpen(false);
    await setActiveActivity(activityId);
  };

  const canOpen = locked && hydrated && activities.length > 0;

  return (
    <BaseWidget id={id} locked={locked} onRemove={onRemove}>
      <div className="h-full w-full rounded-xl bg-white/5 flex flex-col p-3 gap-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Activities</div>
          <button
            type="button"
            title={CLOCK_MODE_TITLES[clockMode]}
            onClick={cycleClockMode}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 rounded text-white/30 hover:text-white/70 transition-colors"
          >
            {CLOCK_MODE_ICONS[clockMode]}
          </button>
        </div>

        <div ref={ref} className="relative" onMouseDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            disabled={!canOpen}
            className="group w-full flex items-center gap-3 text-left rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 transition-colors hover:enabled:border-white/25 hover:enabled:bg-white/10 focus:outline-none focus-visible:enabled:border-white/40 focus-visible:enabled:ring-2 focus-visible:enabled:ring-white/15 enabled:cursor-pointer disabled:cursor-default disabled:opacity-70"
          >
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-white/30">
                Now tracking
              </span>
              <span className="text-lg text-white/90 truncate flex items-center gap-2">
                {active ? (
                  <>
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: active.color }}
                    />
                    {active.name}
                  </>
                ) : (
                  <span className="text-white/30">
                    {!hydrated
                      ? "Loading…"
                      : activities.length === 0
                        ? "No activities — open settings"
                        : "Nothing"}
                  </span>
                )}
              </span>
              {activeTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {activeTags.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: t.color ?? "#6366f1" }}
                      />
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
              <span className={`text-xs font-mono tabular-nums text-white/40${clockMode === "hidden" ? " invisible" : ""}`}>
                {formatElapsed(elapsedMs)}
              </span>
            </div>
            {canOpen && (
              <span
                className={[
                  "shrink-0 text-white/40 transition-transform group-hover:text-white/80",
                  open ? "rotate-180" : "",
                ].join(" ")}
                aria-hidden
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            )}
          </button>

          {open && (
            <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-md border border-white/10 bg-neutral-900 shadow-lg overflow-hidden">
              {activities.map((a) => {
                const isActive = a.id === active?.id;
                return (
                  <button
                    key={a.id}
                    className={[
                      "w-full text-left px-3 py-2 text-sm hover:bg-white/10 flex items-center justify-between gap-2",
                      isActive ? "text-white" : "text-white/70",
                    ].join(" ")}
                    onClick={() => select(a.id)}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: a.color }}
                      />
                      <span className="truncate">{a.name}</span>
                    </span>
                    {isActive && <span className="text-[10px] text-emerald-400">● active</span>}
                  </button>
                );
              })}
              {active && (
                <button
                  className="w-full text-left px-3 py-2 text-sm text-white/50 hover:bg-white/10 border-t border-white/10"
                  onClick={() => select(null)}
                >
                  Stop tracking
                </button>
              )}
            </div>
          )}
        </div>

        {clockMode !== "hide-big" && clockMode !== "hidden" && (
          <div
            className={[
              "flex items-center justify-center px-2 py-1 transition-opacity shrink-0",
              clockMode === "muted" ? "opacity-20" : "",
            ].join(" ")}
          >
            <SevenSegmentDisplay
              value={formatElapsed(elapsedMs)}
              color={active?.color ?? "#10b981"}
            />
          </div>
        )}

        {runningEntry?.id && (
          <div
            className="flex-1 min-h-0"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <EntryNotesEditor
              key={runningEntry.id}
              entryId={runningEntry.id}
              disabled={!locked}
              fill
            />
          </div>
        )}
      </div>
    </BaseWidget>
  );
}

export const activitySelectorWidget: WidgetDefinition<ActivitySelectorConfig> = {
  type: "activitySelector",
  label: "Activity Selector",
  defaultSize: { w: 3, h: 4 },
  minW: 2,
  minH: 4,
  component: ActivitySelectorWidget,
  configSchema: activitySelectorConfigSchema,
  defaultConfig: defaultActivitySelectorConfig,
};
