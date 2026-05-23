import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

import type { UseCalendarResult } from "./useCalendar";

interface Props extends UseCalendarResult {
  locked: boolean;
}

function stop(e: { stopPropagation: () => void }) {
  e.stopPropagation();
}

export function CalendarToolbar(props: Props) {
  const {
    locked,
    view,
    setView,
    daysShown,
    anchorDate,
    shiftDay,
    shiftMonth,
    jumpToday,
  } = props;

  const disabled = !locked;

  const headerLabel =
    view === "day"
      ? daysShown === 1
        ? format(anchorDate, "EEE, MMM d, yyyy")
        : `${format(anchorDate, "MMM d")} – ${format(
            new Date(anchorDate.getTime() + (daysShown - 1) * 86_400_000),
            "MMM d, yyyy",
          )}`
      : format(anchorDate, "MMMM yyyy");

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 pt-2 pb-2 border-b border-white/10">
      <div className="flex items-center gap-1 mr-1">
        <button
          type="button"
          disabled={disabled}
          onMouseDown={stop}
          onClick={() => setView("day")}
          className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${
            view === "day"
              ? "bg-white/15 text-white"
              : "text-white/40 hover:text-white/70"
          } disabled:opacity-40 disabled:hover:text-white/40`}
        >
          Day
        </button>
        <button
          type="button"
          disabled={disabled}
          onMouseDown={stop}
          onClick={() => setView("month")}
          className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${
            view === "month"
              ? "bg-white/15 text-white"
              : "text-white/40 hover:text-white/70"
          } disabled:opacity-40 disabled:hover:text-white/40`}
        >
          Month
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={disabled}
          onMouseDown={stop}
          onClick={() => (view === "day" ? shiftDay(-daysShown) : shiftMonth(-1))}
          className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-40"
          aria-label="Previous"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          disabled={disabled}
          onMouseDown={stop}
          onClick={jumpToday}
          className="text-[10px] uppercase tracking-widest px-2 py-1 rounded text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-40"
        >
          Today
        </button>
        <button
          type="button"
          disabled={disabled}
          onMouseDown={stop}
          onClick={() => (view === "day" ? shiftDay(daysShown) : shiftMonth(1))}
          className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-40"
          aria-label="Next"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="text-xs font-mono text-white/70 ml-1">{headerLabel}</div>
    </div>
  );
}
