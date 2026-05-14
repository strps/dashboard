import { useEffect, useRef, useState } from "react";
import { BaseWidget } from "../base/BaseWidget";
import { useWidget } from "../base/useWidget";
import { registerWidget, type WidgetComponentProps } from "../registry";
import { formatElapsed, useActivitySelector } from "./useActivitySelector";

export function ActivitySelectorWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);
  const { activities, active, elapsedMs, hydrated, setActiveActivity } =
    useActivitySelector();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <BaseWidget id={id} locked={locked} onRemove={onRemove}>
      <div className="h-full w-full rounded-xl bg-white/5 flex flex-col p-3 gap-3">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Activity</div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-white/30">Now tracking</span>
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
              <span className="text-white/30">Nothing</span>
            )}
          </span>
          <span className="text-xs font-mono tabular-nums text-white/40">
            {formatElapsed(elapsedMs)}
          </span>
        </div>

        <div ref={ref} className="relative mt-auto" onMouseDown={(e) => e.stopPropagation()}>
          <button
            className="w-full flex items-center justify-between rounded-md border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-sm text-white/80 disabled:opacity-50 disabled:hover:bg-white/5"
            onClick={() => setOpen((v) => !v)}
            disabled={!locked || !hydrated || activities.length === 0}
          >
            <span className="truncate">
              {!hydrated
                ? "Loading…"
                : activities.length === 0
                  ? "No activities — open settings"
                  : active
                    ? `Switch from ${active.name}`
                    : "Start an activity"}
            </span>
            <span className="text-white/40">{open ? "▲" : "▼"}</span>
          </button>

          {open && (
            <div className="absolute left-0 right-0 bottom-full mb-1 z-10 rounded-md border border-white/10 bg-neutral-900 shadow-lg overflow-hidden">
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
      </div>
    </BaseWidget>
  );
}

registerWidget("activitySelector", {
  label: "Activity Selector",
  defaultSize: { w: 3, h: 3 },
  minW: 2,
  minH: 3,
  component: ActivitySelectorWidget,
});
