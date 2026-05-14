import { create } from "zustand";
import type { LayoutItem } from "react-grid-layout";

import {
  getDashboardLayoutAction,
  saveDashboardLayoutAction,
} from "../actions";

export type WidgetType =
  | "clock"
  | "stats"
  | "notes"
  | "weather"
  | "activitySelector"
  | "cheatsheet";

export interface WidgetInstance {
  id: string;
  type: WidgetType;
}

const DEFAULT_SIZES: Record<WidgetType, { w: number; h: number }> = {
  clock:            { w: 3, h: 2 },
  stats:            { w: 4, h: 3 },
  notes:            { w: 4, h: 4 },
  weather:          { w: 3, h: 3 },
  activitySelector: { w: 3, h: 3 },
  cheatsheet:       { w: 5, h: 5 },
};

const DEFAULT_LAYOUT: LayoutItem[] = [
  { i: "widget-1", x: 0, y: 0, w: 3, h: 2 },
  { i: "widget-2", x: 3, y: 0, w: 4, h: 3 },
  { i: "widget-3", x: 7, y: 0, w: 4, h: 4 },
];

const DEFAULT_INSTANCES: WidgetInstance[] = [
  { id: "widget-1", type: "clock" },
  { id: "widget-2", type: "stats" },
  { id: "widget-3", type: "notes" },
];

const LS_KEY = "dashboard-layout-v1";

interface PersistedShape {
  layout: LayoutItem[];
  instances: WidgetInstance[];
  locked: boolean;
}

function readLocalStorage(): PersistedShape | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedShape;
    if (!Array.isArray(parsed.layout) || !Array.isArray(parsed.instances)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalStorage(state: PersistedShape) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / privacy errors
  }
}

interface DashboardState {
  layout: LayoutItem[];
  instances: WidgetInstance[];
  locked: boolean;
  hydrated: boolean;

  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  setLayout: (layout: LayoutItem[]) => void;
  toggleLocked: () => void;
  hydrateFromServer: () => Promise<void>;
}

const initial = readLocalStorage();

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleServerSave(state: PersistedShape) {
  if (typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveDashboardLayoutAction(state).catch(() => {
      // optimistic — localStorage already holds the truth for this tab
    });
  }, 500);
}

export const useDashboardStore = create<DashboardState>((set, get) => {
  function persist() {
    const { layout, instances, locked } = get();
    const snapshot = { layout, instances, locked };
    writeLocalStorage(snapshot);
    scheduleServerSave(snapshot);
  }

  return {
    layout: initial?.layout ?? DEFAULT_LAYOUT,
    instances: (initial?.instances as WidgetInstance[]) ?? DEFAULT_INSTANCES,
    locked: initial?.locked ?? true,
    hydrated: false,

    addWidget: (type) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `widget-${Date.now()}`;
      const size = DEFAULT_SIZES[type];
      const maxY = get().layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
      set((state) => ({
        instances: [...state.instances, { id, type }],
        layout: [...state.layout, { i: id, x: 0, y: maxY, ...size }],
      }));
      persist();
    },

    removeWidget: (id) => {
      set((state) => ({
        instances: state.instances.filter((w) => w.id !== id),
        layout: state.layout.filter((l) => l.i !== id),
      }));
      persist();
    },

    setLayout: (layout) => {
      set({ layout });
      persist();
    },

    toggleLocked: () => {
      set((state) => ({ locked: !state.locked }));
      persist();
    },

    hydrateFromServer: async () => {
      if (get().hydrated) return;
      try {
        const remote = await getDashboardLayoutAction();
        if (remote) {
          set({
            layout: remote.layout,
            instances: remote.instances as WidgetInstance[],
            locked: remote.locked,
            hydrated: true,
          });
          writeLocalStorage({
            layout: remote.layout,
            instances: remote.instances as WidgetInstance[],
            locked: remote.locked,
          });
        } else {
          set({ hydrated: true });
          // first visit: seed server with whatever we have locally / defaults
          persist();
        }
      } catch {
        set({ hydrated: true });
      }
    },
  };
});
