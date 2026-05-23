"use client";

import { useState } from "react";

import { Dialog } from "@/dashboard/components/Dialog";

import { BaseWidget } from "../../../../components/base-widget/BaseWidget";
import { useWidget } from "../../../../components/base-widget/useWidget";
import type { WidgetComponentProps, WidgetDefinition } from "../../../registry";

import { CalendarConfigDialog } from "./CalendarConfigDialog";
import { CalendarToolbar } from "./CalendarToolbar";
import { DayView } from "./DayView";
import { MonthView } from "./MonthView";
import {
  calendarConfigSchema,
  defaultCalendarConfig,
  type CalendarConfig,
} from "./schemas";
import { useCalendar } from "./useCalendar";

export function CalendarWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);
  const cal = useCalendar(id);
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <BaseWidget
      id={id}
      locked={locked}
      onRemove={onRemove}
      onConfigure={() => setConfigOpen(true)}
    >
      <div className="h-full w-full rounded-xl bg-white/5 flex flex-col">
        <div className="px-3 pt-2.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Calendar
        </div>
        <CalendarToolbar {...cal} locked={locked} />
        <div className="flex-1 min-h-0 overflow-hidden">
          {cal.loading && cal.entries.length === 0 ? (
            <div className="p-3 text-white/30 text-xs font-mono">Loading…</div>
          ) : cal.view === "day" ? (
            <DayView
              anchorDate={cal.anchorDate}
              daysShown={cal.daysShown}
              viewStartAnchorMinutes={cal.followNow ? "follow" : cal.startAnchorMinutes}
              windowHours={cal.windowHours}
              entries={cal.entries}
              activityById={cal.activityById}
            />
          ) : (
            <MonthView
              anchorDate={cal.anchorDate}
              range={cal.range}
              entries={cal.entries}
              activityById={cal.activityById}
              weekStartsOn={cal.weekStartsOn}
            />
          )}
        </div>
      </div>

      <Dialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        title="Calendar settings"
        widthClass="max-w-lg"
      >
        <CalendarConfigDialog config={cal.config} updateConfig={cal.updateConfig} />
      </Dialog>
    </BaseWidget>
  );
}

export const calendarWidget: WidgetDefinition<CalendarConfig> = {
  type: "calendar",
  label: "Calendar",
  defaultSize: { w: 6, h: 5 },
  minW: 4,
  minH: 4,
  component: CalendarWidget,
  configSchema: calendarConfigSchema,
  defaultConfig: defaultCalendarConfig,
};
