import { create } from "zustand";

export interface Activity {
  id: string;
  name: string;
}

export interface TimeEntry {
  activityId: string;
  start: number;
  end: number;
}

interface ActivityState {
  activities: Activity[];
  activeActivityId: string | null;
  activeStartedAt: number | null;
  entries: TimeEntry[];
  setActiveActivity: (activityId: string | null) => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [
    { id: "deep-work", name: "Deep Work" },
    { id: "meetings",  name: "Meetings" },
    { id: "email",     name: "Email" },
    { id: "break",     name: "Break" },
  ],
  activeActivityId: null,
  activeStartedAt: null,
  entries: [],

  setActiveActivity: (activityId) =>
    set((state) => {
      const now = Date.now();
      const closing: TimeEntry[] =
        state.activeActivityId && state.activeStartedAt
          ? [{ activityId: state.activeActivityId, start: state.activeStartedAt, end: now }]
          : [];
      return {
        entries: [...state.entries, ...closing],
        activeActivityId: activityId,
        activeStartedAt: activityId ? now : null,
      };
    }),
}));
