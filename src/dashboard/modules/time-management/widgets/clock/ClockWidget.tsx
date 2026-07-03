"use client";

import { BaseWidget } from "../../../../components/base-widget/BaseWidget";
import { useWidget } from "../../../../components/base-widget/useWidget";
import type { WidgetComponentProps, WidgetDefinition } from "../../../registry";
import { SevenSegmentDisplay } from "../shared/SevenSegmentDisplay";
import { useClock } from "./useClock";

export function ClockWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);
  const now = useClock();
  const time = now?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) ?? "--:--:--";
  const date = now?.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) ?? " ";

  return (
    <BaseWidget id={id} locked={locked} onRemove={onRemove}>
      <div className="h-full w-full rounded-xl bg-white/5 flex flex-col items-center justify-center gap-2 p-3 select-none" suppressHydrationWarning>
        <SevenSegmentDisplay value={time} color="#e5e7eb" className="h-12" />
        <span className="text-xs text-white/40">{date}</span>
      </div>
    </BaseWidget>
  );
}

export const clockWidget: WidgetDefinition = {
  type: "clock",
  label: "Clock",
  defaultSize: { w: 3, h: 2 },
  minW: 2,
  minH: 2,
  component: ClockWidget,
};
