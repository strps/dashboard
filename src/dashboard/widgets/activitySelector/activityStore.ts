import { create } from "zustand";

import type { Activity, OpenEntry } from "./schemas";

interface ActivityState {
  activities: Activity[];
  open: OpenEntry | null;
  hydrated: boolean;
  setHydrated: (state: { activities: Activity[]; open: OpenEntry | null }) => void;
  setActivities: (activities: Activity[]) => void;
  setOpen: (open: OpenEntry | null) => void;
  upsertActivity: (activity: Activity) => void;
  removeActivity: (id: string) => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  open: null,
  hydrated: false,

  setHydrated: ({ activities, open }) =>
    set({ activities, open, hydrated: true }),

  setActivities: (activities) => set({ activities }),

  setOpen: (open) => set({ open }),

  upsertActivity: (activity) =>
    set((s) => {
      const idx = s.activities.findIndex((a) => a.id === activity.id);
      const next =
        idx === -1
          ? [...s.activities, activity]
          : s.activities.map((a) => (a.id === activity.id ? activity : a));
      next.sort((a, b) => a.order - b.order);
      return { activities: next };
    }),

  removeActivity: (id) =>
    set((s) => ({
      activities: s.activities.filter((a) => a.id !== id),
      open: s.open?.activityId === id ? null : s.open,
    })),
}));
