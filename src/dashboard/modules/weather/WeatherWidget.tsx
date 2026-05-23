"use client";

import { BaseWidget } from "../../components/base-widget/BaseWidget";
import { useWidget } from "../../components/base-widget/useWidget";
import type { WidgetComponentProps, WidgetDefinition } from "../registry";

export function WeatherWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);

  return (
    <BaseWidget id={id} locked={locked} onRemove={onRemove}>
      <div className="h-full w-full rounded-xl bg-white/5 flex flex-col items-center justify-center gap-2 select-none">
        <span className="text-4xl">⛅</span>
        <span className="text-white/30 text-xs">coming soon</span>
      </div>
    </BaseWidget>
  );
}

export const weatherWidget: WidgetDefinition = {
  type: "weather",
  label: "Weather",
  defaultSize: { w: 3, h: 3 },
  minW: 2,
  minH: 2,
  component: WeatherWidget,
};
