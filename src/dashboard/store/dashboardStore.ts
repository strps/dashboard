import { create } from "zustand";
import type { LayoutItem } from "react-grid-layout";

export type WidgetType = "clock" | "stats" | "notes" | "weather" | "activitySelector";

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
};

let _nextId = 4;

interface DashboardState {
  layout: LayoutItem[];
  instances: WidgetInstance[];
  locked: boolean;

  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  setLayout: (layout: LayoutItem[]) => void;
  toggleLocked: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  layout: [
    { i: "widget-1", x: 0, y: 0, w: 3, h: 2 },
    { i: "widget-2", x: 3, y: 0, w: 4, h: 3 },
    { i: "widget-3", x: 7, y: 0, w: 4, h: 4 },
  ],
  instances: [
    { id: "widget-1", type: "clock" },
    { id: "widget-2", type: "stats" },
    { id: "widget-3", type: "notes" },
  ],
  locked: false,

  addWidget: (type) =>
    set((state) => {
      const id = `widget-${_nextId++}`;
      const size = DEFAULT_SIZES[type];
      const maxY = state.layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
      return {
        instances: [...state.instances, { id, type }],
        layout: [
          ...state.layout,
          { i: id, x: 0, y: maxY, ...size },
        ],
      };
    }),

  removeWidget: (id) =>
    set((state) => ({
      instances: state.instances.filter((w) => w.id !== id),
      layout: state.layout.filter((l) => l.i !== id),
    })),

  setLayout: (layout) => set({ layout }),

  toggleLocked: () => set((state) => ({ locked: !state.locked })),
}));
