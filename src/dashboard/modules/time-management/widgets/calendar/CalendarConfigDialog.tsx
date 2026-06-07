"use client";

import type { CalendarConfig } from "./schemas";

interface Props {
  config: CalendarConfig;
  updateConfig: (patch: Partial<CalendarConfig>) => void;
}

function minutesToHHMM(m: number): string {
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function hhmmToMinutes(s: string): number | null {
  const [hh, mm] = s.split(":");
  const h = Number(hh);
  const m = Number(mm);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return Math.max(0, Math.min(1439, h * 60 + m));
}

export function CalendarConfigDialog({ config, updateConfig }: Props) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto p-5 space-y-5">
        <section className="space-y-2">
          <h3 className="text-xs font-medium text-white/80">Default view</h3>
          <p className="text-[11px] text-white/50">
            View shown when the widget loads. You can still switch views from the
            toolbar.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => updateConfig({ view: "day" })}
              className={`text-[11px] uppercase tracking-widest px-2.5 py-1 rounded ${
                config.view === "day"
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => updateConfig({ view: "month" })}
              className={`text-[11px] uppercase tracking-widest px-2.5 py-1 rounded ${
                config.view === "month"
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              Month
            </button>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium text-white/80">Day view</h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-white/50">
              Days shown
              <select
                value={config.daysShown}
                onChange={(e) =>
                  updateConfig({ daysShown: Number(e.target.value) })
                }
                className="rounded border border-white/10 bg-neutral-950 px-2 py-1 text-xs text-white/80 outline-none focus:border-white/30"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-white/50">
              Window (hours)
              <input
                type="number"
                min={1}
                max={24}
                value={config.windowHours}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isNaN(n)) {
                    updateConfig({
                      windowHours: Math.max(1, Math.min(24, n)),
                    });
                  }
                }}
                className="rounded border border-white/10 bg-neutral-950 px-2 py-1 text-xs text-white/80 outline-none focus:border-white/30"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-[11px] text-white/60">
            <input
              type="checkbox"
              checked={config.followNow}
              onChange={(e) => updateConfig({ followNow: e.target.checked })}
              className="accent-emerald-500"
            />
            Follow current time (centers the window on now)
          </label>

          {!config.followNow && (
            <label className="flex flex-col gap-1 text-[11px] text-white/50 max-w-[10rem]">
              Start time
              <input
                type="time"
                value={minutesToHHMM(config.startAnchorMinutes)}
                onChange={(e) => {
                  const m = hhmmToMinutes(e.target.value);
                  if (m !== null) updateConfig({ startAnchorMinutes: m });
                }}
                className="rounded border border-white/10 bg-neutral-950 px-2 py-1 text-xs text-white/80 outline-none focus:border-white/30"
              />
            </label>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium text-white/80">Month view</h3>
          <label className="flex flex-col gap-1 text-[11px] text-white/50 max-w-[12rem]">
            Week starts on
            <select
              value={config.weekStartsOn}
              onChange={(e) =>
                updateConfig({
                  weekStartsOn: Number(e.target.value) === 0 ? 0 : 1,
                })
              }
              className="rounded border border-white/10 bg-neutral-950 px-2 py-1 text-xs text-white/80 outline-none focus:border-white/30"
            >
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </select>
          </label>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium text-white/80">Editing</h3>
          <p className="text-[11px] text-white/50">
            Show drag handles to adjust entry start/end times directly on the day
            view. Editing only works while the dashboard is locked.
          </p>
          <label className="flex items-center gap-2 text-[11px] text-white/60">
            <input
              type="checkbox"
              checked={config.editor}
              onChange={(e) => updateConfig({ editor: e.target.checked })}
              className="accent-emerald-500"
            />
            Enable editor
          </label>

          {config.editor && (
            <label className="flex flex-col gap-1 text-[11px] text-white/50 max-w-[12rem]">
              Snap to
              <select
                value={config.editorSnapMinutes}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  updateConfig({
                    editorSnapMinutes: n === 1 ? 1 : n === 15 ? 15 : 5,
                  });
                }}
                className="rounded border border-white/10 bg-neutral-950 px-2 py-1 text-xs text-white/80 outline-none focus:border-white/30"
              >
                <option value={1}>1 minute</option>
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
              </select>
            </label>
          )}
        </section>
      </div>
    </div>
  );
}
