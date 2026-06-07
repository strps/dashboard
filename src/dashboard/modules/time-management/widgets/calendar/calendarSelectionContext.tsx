"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import type { CalendarRangeEntry } from "./schemas";

interface CalendarSelectionValue {
  /** Full snapshot of the entry selected in a calendar's editor, or null. */
  selectedEntry: CalendarRangeEntry | null;
  selectEntry: (entry: CalendarRangeEntry | null) => void;
}

// Default value lets consumers (e.g. the properties widget) work even when no
// calendar — and therefore no provider — is mounted. They simply see an empty
// selection rather than throwing.
const CalendarSelectionContext = createContext<CalendarSelectionValue>({
  selectedEntry: null,
  selectEntry: () => {},
});

export function CalendarSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedEntry, setSelectedEntry] = useState<CalendarRangeEntry | null>(
    null,
  );

  return (
    <CalendarSelectionContext.Provider
      value={{ selectedEntry, selectEntry: setSelectedEntry }}
    >
      {children}
    </CalendarSelectionContext.Provider>
  );
}

export function useCalendarSelection(): CalendarSelectionValue {
  return useContext(CalendarSelectionContext);
}
