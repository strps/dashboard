"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Dialog } from "@/dashboard/components/Dialog";
import { BaseWidget } from "../../../../components/base-widget/BaseWidget";
import { useWidget } from "../../../../components/base-widget/useWidget";
import type { WidgetComponentProps, WidgetDefinition } from "../../../registry";

import {
  defaultTimeChartConfig,
  timeChartConfigSchema,
  type TimeChartConfig,
} from "./schemas";
import { useTimeChart } from "./useTimeChart";

function stop(e: { stopPropagation: () => void }) {
  e.stopPropagation();
}

function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return mins > 0 ? `${whole}h ${mins}m` : `${whole}h`;
}

interface ConfigDialogProps {
  config: TimeChartConfig;
  updateConfig: (patch: Partial<TimeChartConfig>) => void;
  tags: { id: string; name: string; color: string | null }[];
}

function ConfigDialog({ config, updateConfig, tags }: ConfigDialogProps) {
  const allSelected = config.selectedTagIds.length === 0;

  function toggleTag(id: string) {
    const next = config.selectedTagIds.includes(id)
      ? config.selectedTagIds.filter((t) => t !== id)
      : [...config.selectedTagIds, id];
    updateConfig({ selectedTagIds: next });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-xs text-white/50 uppercase tracking-widest mb-2">Group by</div>
        <div className="flex gap-2">
          {(["activity", "tag"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => updateConfig({ groupBy: mode })}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                config.groupBy === mode
                  ? "bg-white/15 border-white/30 text-white"
                  : "border-white/10 text-white/50 hover:text-white/70 hover:border-white/20"
              }`}
            >
              {mode === "activity" ? "Activities" : "Tags"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-white/50 uppercase tracking-widest mb-2">Date range</div>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => updateConfig({ dateRange: r })}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                config.dateRange === r
                  ? "bg-white/15 border-white/30 text-white"
                  : "border-white/10 text-white/50 hover:text-white/70 hover:border-white/20"
              }`}
            >
              {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
      </div>

      {tags.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-white/50 uppercase tracking-widest">Filter by tags</div>
            <button
              type="button"
              onClick={() => updateConfig({ selectedTagIds: [] })}
              className="text-[10px] text-white/40 hover:text-white/60 transition-colors"
            >
              {allSelected ? "All shown" : "Clear filter"}
            </button>
          </div>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
            {tags.map((tag) => {
              const checked = allSelected || config.selectedTagIds.includes(tag.id);
              return (
                <label
                  key={tag.id}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTag(tag.id)}
                    className="sr-only"
                  />
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      checked
                        ? "border-transparent"
                        : "border-white/20 bg-transparent"
                    }`}
                    style={checked ? { backgroundColor: tag.color ?? "#6366f1" } : undefined}
                  >
                    {checked && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                    {tag.name}
                  </span>
                  {tag.color && (
                    <span
                      className="w-2 h-2 rounded-full ml-auto shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function TimeChartWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);
  const { config, updateConfig, bars, tags, loading } = useTimeChart(id);
  const [configOpen, setConfigOpen] = useState(false);

  const disabled = !locked;
  const hasFilter = config.selectedTagIds.length > 0;

  return (
    <BaseWidget
      id={id}
      locked={locked}
      onRemove={onRemove}
      onConfigure={() => setConfigOpen(true)}
    >
      <div className="h-full w-full rounded-xl bg-white/5 flex flex-col">
        {/* Header + controls */}
        <div className="px-3 pt-2.5 pb-2 border-b border-white/10 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mr-1">
            Time
          </span>

          {/* GroupBy toggle */}
          <div className="flex gap-0.5">
            {(["activity", "tag"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={disabled}
                onMouseDown={stop}
                onClick={() => updateConfig({ groupBy: mode })}
                className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded transition-colors ${
                  config.groupBy === mode
                    ? "bg-white/15 text-white"
                    : "text-white/40 hover:text-white/70"
                } disabled:opacity-40 disabled:hover:text-white/40`}
              >
                {mode === "activity" ? "Activities" : "Tags"}
              </button>
            ))}
          </div>

          <div className="h-3 w-px bg-white/15" />

          {/* Date range */}
          <div className="flex gap-0.5">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                disabled={disabled}
                onMouseDown={stop}
                onClick={() => updateConfig({ dateRange: r })}
                className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded transition-colors ${
                  config.dateRange === r
                    ? "bg-white/15 text-white"
                    : "text-white/40 hover:text-white/70"
                } disabled:opacity-40 disabled:hover:text-white/40`}
              >
                {r}
              </button>
            ))}
          </div>

          {hasFilter && (
            <>
              <div className="h-3 w-px bg-white/15" />
              <span className="text-[10px] text-white/40">
                {config.selectedTagIds.length} tag{config.selectedTagIds.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0 py-2">
          {loading && bars.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white/30 text-xs font-mono">
              Loading…
            </div>
          ) : bars.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white/30 text-xs">
              No data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={bars}
                layout="vertical"
                margin={{ top: 2, right: 52, bottom: 2, left: 8 }}
              >
                <XAxis
                  type="number"
                  dataKey="hours"
                  tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
                  tickFormatter={(v: number) => `${v.toFixed(0)}h`}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={{ stroke: "rgba(255,255,255,0.08)" }}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={88}
                  tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: string) => v.length > 12 ? `${v.slice(0, 11)}…` : v}
                />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  formatter={(value) => [formatHours(value as number), "Total"] as [string, string]}
                  contentStyle={{
                    background: "rgba(15,15,15,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                    padding: "6px 10px",
                  }}
                  labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}
                />
                <Bar dataKey="hours" radius={[0, 3, 3, 0]} maxBarSize={22}>
                  {bars.map((b) => (
                    <Cell key={b.id} fill={b.color} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <Dialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        title="Time chart settings"
        widthClass="max-w-sm"
      >
        <ConfigDialog config={config} updateConfig={updateConfig} tags={tags} />
      </Dialog>
    </BaseWidget>
  );
}

export const timeChartWidget: WidgetDefinition<TimeChartConfig> = {
  type: "timeChart",
  label: "Time Chart",
  defaultSize: { w: 5, h: 4 },
  minW: 3,
  minH: 3,
  component: TimeChartWidget,
  configSchema: timeChartConfigSchema,
  defaultConfig: defaultTimeChartConfig,
};
