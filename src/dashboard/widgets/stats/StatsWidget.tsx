import { BaseWidget } from "../base/BaseWidget";
import { useStats } from "./useStats";
import { registerWidget, type WidgetComponentProps } from "../registry";
import { useWidget } from "../base/useWidget";

const TREND_COLOR = {
  up:      "text-emerald-400",
  down:    "text-red-400",
  neutral: "text-white/40",
};

const TREND_ARROW = { up: "↑", down: "↓", neutral: "—" };

export function StatsWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);
  const stats = useStats();

  return (
    <BaseWidget id={id} locked={locked} onRemove={onRemove}>
      <div className="h-full w-full rounded-xl bg-white/5 overflow-auto">
        <div className="grid grid-cols-2 gap-2 p-3 content-start">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-0.5 p-2 rounded-lg bg-white/5">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-mono text-white/80 tabular-nums">{stat.value}</span>
                <span className={`text-xs font-mono ${TREND_COLOR[stat.trend]}`}>
                  {TREND_ARROW[stat.trend]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BaseWidget>
  );
}

registerWidget("stats", {
  label: "Stats",
  defaultSize: { w: 4, h: 3 },
  minW: 2,
  minH: 2,
  component: StatsWidget,
});
