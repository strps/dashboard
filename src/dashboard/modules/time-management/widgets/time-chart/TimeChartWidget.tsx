"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
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
import type { ChartSeries } from "./useTimeChart";

function stop(e: { stopPropagation: () => void }) {
  e.stopPropagation();
}

function CustomXAxisTick({
  x,
  y,
  payload,
  series,
  bucketData,
}: {
  x?: number | string;
  y?: number | string;
  payload?: { value: string };
  series: ChartSeries[];
  bucketData: Map<string, Map<string, number>>;
}) {
  if (x === undefined || y === undefined || !payload) return null;

  const inner = bucketData.get(payload.value);
  const items = series
    .map((s) => ({ ...s, hours: inner?.get(s.id) ?? 0 }))
    .filter((s) => s.hours > 0);

  return (
    <g transform={`translate(${Number(x)},${Number(y)})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={10}>
        {payload.value}
      </text>
      {items.map((item, i) => (
        <g key={item.id} transform={`translate(0, ${20 + i * 13})`}>
          <rect
            x={-22}
            y={-6}
            width={5}
            height={5}
            rx={1}
            fill={item.color}
            fillOpacity={0.85}
          />
          <text x={-15} y={0} textAnchor="start" fill="rgba(255,255,255,0.35)" fontSize={8}>
            {item.label.length > 7 ? item.label.slice(0, 7) + "…" : item.label}
          </text>
          <text x={26} y={0} textAnchor="end" fill="rgba(255,255,255,0.55)" fontSize={8}>
            {formatHours(item.hours)}
          </text>
        </g>
      ))}
    </g>
  );
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
        <div className="text-xs text-white/50 uppercase tracking-widest mb-2">View</div>
        <div className="flex gap-2">
          {(["week", "months"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => updateConfig({ viewMode: m })}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                config.viewMode === m
                  ? "bg-white/15 border-white/30 text-white"
                  : "border-white/10 text-white/50 hover:text-white/70 hover:border-white/20"
              }`}
            >
              {m === "week" ? "By week" : "By month"}
            </button>
          ))}
        </div>
      </div>

      {config.viewMode === "months" && (
        <div>
          <div className="text-xs text-white/50 uppercase tracking-widest mb-2">Months back</div>
          <div className="flex gap-2">
            {([3, 6, 12] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => updateConfig({ monthsBack: n })}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  config.monthsBack === n
                    ? "bg-white/15 border-white/30 text-white"
                    : "border-white/10 text-white/50 hover:text-white/70 hover:border-white/20"
                }`}
              >
                {n}m
              </button>
            ))}
          </div>
        </div>
      )}

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
                <label key={tag.id} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTag(tag.id)}
                    className="sr-only"
                  />
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      checked ? "border-transparent" : "border-white/20 bg-transparent"
                    }`}
                    style={checked ? { backgroundColor: tag.color ?? "#6366f1" } : undefined}
                  >
                    {checked && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path
                          d="M1 3.5L3.5 6L8 1"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
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

function StackedTooltip({
  active,
  payload,
  label,
  series,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
  series: ChartSeries[];
}) {
  if (!active || !payload?.length) return null;

  const seriesById = new Map(series.map((s) => [s.id, s]));
  const items = payload
    .map((p) => ({ ...p, meta: seriesById.get(p.dataKey) }))
    .filter((p) => p.meta && p.value > 0)
    .reverse();

  if (items.length === 0) return null;

  const total = items.reduce((s, p) => s + p.value, 0);

  return (
    <div
      style={{
        background: "rgba(15,15,15,0.95)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        color: "#fff",
        fontSize: "12px",
        padding: "8px 10px",
        minWidth: "120px",
      }}
    >
      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px", marginBottom: "6px" }}>
        {label}
      </div>
      {items.map((p) => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "2px",
              backgroundColor: p.meta!.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: "rgba(255,255,255,0.7)", flex: 1 }}>{p.meta!.label}</span>
          <span style={{ color: "#fff", fontVariantNumeric: "tabular-nums" }}>
            {formatHours(p.value)}
          </span>
        </div>
      ))}
      {items.length > 1 && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            marginTop: "4px",
            paddingTop: "4px",
            display: "flex",
            justifyContent: "space-between",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          <span>Total</span>
          <span style={{ color: "#fff" }}>{formatHours(total)}</span>
        </div>
      )}
    </div>
  );
}

export function TimeChartWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);
  const { config, updateConfig, dataPoints, series, tags, loading, periodOffset, periodLabel, shiftPeriod, goToNow } = useTimeChart(id);
  const [configOpen, setConfigOpen] = useState(false);

  const disabled = !locked;
  const hasData = series.length > 0;

  const bucketData = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const dp of dataPoints) {
      const inner = new Map<string, number>();
      for (const [k, v] of Object.entries(dp)) {
        if (k !== "label" && (v as number) > 0) inner.set(k, v as number);
      }
      map.set(dp.label as string, inner);
    }
    return map;
  }, [dataPoints]);

  const seriesTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const dp of dataPoints) {
      for (const [k, v] of Object.entries(dp)) {
        if (k !== "label") map.set(k, (map.get(k) ?? 0) + (v as number));
      }
    }
    return map;
  }, [dataPoints]);

  return (
    <BaseWidget
      id={id}
      locked={locked}
      onRemove={onRemove}
      onConfigure={() => setConfigOpen(true)}
    >
      <div className="h-full w-full rounded-xl bg-white/5 flex flex-col">
        {/* Header */}
        <div className="px-3 pt-2.5 pb-2 border-b border-white/10 flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mr-auto">
            Time
          </span>
          <button
            type="button"
            disabled={disabled}
            onMouseDown={stop}
            onClick={() => shiftPeriod(1)}
            className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors disabled:opacity-40 rounded hover:bg-white/5"
          >
            ‹
          </button>
          <span className="text-[11px] text-white/50 min-w-20 text-center tabular-nums">
            {periodLabel}
          </span>
          <button
            type="button"
            disabled={disabled || periodOffset === 0}
            onMouseDown={stop}
            onClick={() => shiftPeriod(-1)}
            className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors disabled:opacity-40 rounded hover:bg-white/5"
          >
            ›
          </button>
          {periodOffset > 0 && (
            <button
              type="button"
              disabled={disabled}
              onMouseDown={stop}
              onClick={goToNow}
              className="ml-1 text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-white/15 text-white/35 hover:text-white/60 hover:border-white/25 transition-colors disabled:opacity-40"
            >
              now
            </button>
          )}
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0 flex flex-col p-6">
          <div className="flex-1 min-h-0 pt-3 pb-1">
            {loading && !hasData ? (
              <div className="h-full flex items-center justify-center text-white/30 text-xs font-mono">
                Loading…
              </div>
            ) : !hasData ? (
              <div className="h-full flex items-center justify-center text-white/30 text-xs">
                No data for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataPoints}
                  margin={{ top: 2, right: 12, bottom: 0, left: -8 }}
                  barCategoryGap="20%"
                >
                  <XAxis
                    dataKey="label"
                    height={20 + series.length * 13}
                    tick={(props) => <CustomXAxisTick {...props} series={series} bucketData={bucketData} />}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => (v > 0 ? `${Math.round(v)}h` : "")}
                    tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    content={<StackedTooltip series={series} />}
                  />
                  {series.map((s) => (
                    <Bar
                      key={s.id}
                      dataKey={s.id}
                      name={s.label}
                      stackId="stack"
                      fill={s.color}
                      fillOpacity={0.85}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {config.viewMode === "week" && series.length > 0 && (
            <div className="px-3 pb-2.5 flex flex-wrap gap-x-3 gap-y-1">
              {series.map((s) => {
                const total = seriesTotals.get(s.id) ?? 0;
                if (total === 0) return null;
                return (
                  <div key={s.id} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-sm shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-[10px] text-white/50">{s.label}</span>
                    <span className="text-[10px] text-white/30">{formatHours(total)}</span>
                  </div>
                );
              })}
            </div>
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
