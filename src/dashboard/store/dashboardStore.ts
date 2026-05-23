import { create } from "zustand";
import type { LayoutItem } from "react-grid-layout";

import {
  createDashboardAction,
  deleteDashboardAction,
  getDashboardLayoutAction,
  listDashboardsAction,
  renameDashboardAction,
  saveDashboardLayoutAction,
} from "../actions";

export type WidgetType =
  | "clock"
  | "stats"
  | "notes"
  | "weather"
  | "activitySelector"
  | "calendar"
  | "cheatsheet"
  | "timeChart";

export interface WidgetInstance<TConfig = unknown> {
  id: string;
  type: WidgetType;
  config?: TConfig;
}

export interface DashboardMeta {
  id: string;
  name: string;
  type: "widgets" | "custom";
  order: number;
}

interface DashboardData {
  layout: LayoutItem[];
  instances: WidgetInstance[];
  locked: boolean;
}

const DEFAULT_SIZES: Record<WidgetType, { w: number; h: number }> = {
  clock:            { w: 3, h: 2 },
  stats:            { w: 4, h: 3 },
  notes:            { w: 4, h: 4 },
  weather:          { w: 3, h: 3 },
  activitySelector: { w: 3, h: 3 },
  calendar:         { w: 6, h: 5 },
  cheatsheet:       { w: 5, h: 5 },
  timeChart:        { w: 5, h: 4 },
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

const LS_KEY = "dashboard-v2";
const OLD_LS_KEY = "dashboard-layout-v1";

interface PersistedShapeV2 {
  dashboards: DashboardMeta[];
  activeDashboardId: string | null;
  dashboardData: Record<string, DashboardData>;
}

function readLocalStorage(): PersistedShapeV2 | null {
  if (typeof window === "undefined") return null;
  try {
    // Remove old v1 key if present — server-side migration preserved that data
    if (window.localStorage.getItem(OLD_LS_KEY)) {
      window.localStorage.removeItem(OLD_LS_KEY);
    }
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedShapeV2;
    if (!Array.isArray(parsed.dashboards)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalStorage(state: PersistedShapeV2) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / privacy errors
  }
}

interface DashboardState {
  // Multi-tab metadata
  dashboards: DashboardMeta[];
  activeDashboardId: string | null;
  dashboardData: Record<string, DashboardData>;

  // Derived active-dashboard state — kept in sync for existing consumers
  layout: LayoutItem[];
  instances: WidgetInstance[];
  locked: boolean;

  hydrated: boolean;

  // Multi-tab actions
  hydrateFromServer: () => Promise<void>;
  switchDashboard: (id: string) => Promise<void>;
  addDashboard: (name: string, type: "widgets" | "custom") => Promise<void>;
  deleteDashboard: (id: string) => Promise<void>;
  renameDashboard: (id: string, name: string) => Promise<void>;

  // Widget actions (operate on the active dashboard)
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  setLayout: (layout: LayoutItem[]) => void;
  setWidgetConfig: (id: string, config: unknown) => void;
  toggleLocked: () => void;
}

const initial = readLocalStorage();

const saveTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function scheduleServerSave(dashboardId: string, data: DashboardData) {
  if (typeof window === "undefined") return;
  if (saveTimers[dashboardId]) clearTimeout(saveTimers[dashboardId]);
  saveTimers[dashboardId] = setTimeout(() => {
    delete saveTimers[dashboardId];
    saveDashboardLayoutAction(dashboardId, {
      layout: data.layout,
      instances: data.instances,
      locked: data.locked,
    }).catch(() => {
      // optimistic — localStorage holds truth for this tab
    });
  }, 500);
}

function deriveActiveFields(
  dashboardData: Record<string, DashboardData>,
  activeDashboardId: string | null,
): { layout: LayoutItem[]; instances: WidgetInstance[]; locked: boolean } {
  const data = activeDashboardId ? dashboardData[activeDashboardId] : undefined;
  return {
    layout: data?.layout ?? [],
    instances: data?.instances ?? [],
    locked: data?.locked ?? true,
  };
}

export const useDashboardStore = create<DashboardState>((set, get) => {
  const initialDashboards = initial?.dashboards ?? [];
  const initialActiveId = initial?.activeDashboardId ?? null;
  const initialData = initial?.dashboardData ?? {};
  const derived = deriveActiveFields(initialData, initialActiveId);

  function persist() {
    const { activeDashboardId, layout, instances, locked, dashboardData } = get();
    if (!activeDashboardId) return;
    const snapshot: DashboardData = { layout, instances, locked };
    const newData = { ...dashboardData, [activeDashboardId]: snapshot };
    set({ dashboardData: newData });
    writeLocalStorage({
      dashboards: get().dashboards,
      activeDashboardId,
      dashboardData: newData,
    });
    scheduleServerSave(activeDashboardId, snapshot);
  }

  return {
    dashboards: initialDashboards,
    activeDashboardId: initialActiveId,
    dashboardData: initialData,
    layout: derived.layout,
    instances: derived.instances,
    locked: derived.locked,
    hydrated: false,

    hydrateFromServer: async () => {
      if (get().hydrated) return;
      try {
        let tabs = await listDashboardsAction();

        if (tabs.length === 0) {
          const { id } = await createDashboardAction({
            name: "Main",
            type: "widgets",
            order: 0,
          });
          tabs = [{ id, name: "Main", type: "widgets", order: 0 }];
        }

        const storedActiveId = get().activeDashboardId;
        const activeTab =
          tabs.find((t) => t.id === storedActiveId) ?? tabs[0];

        const remote = await getDashboardLayoutAction(activeTab.id);

        const newData: Record<string, DashboardData> = { ...get().dashboardData };

        if (remote) {
          newData[activeTab.id] = {
            layout: remote.layout,
            instances: remote.instances as WidgetInstance[],
            locked: remote.locked,
          };
        } else {
          newData[activeTab.id] = {
            layout: DEFAULT_LAYOUT,
            instances: DEFAULT_INSTANCES,
            locked: true,
          };
          scheduleServerSave(activeTab.id, newData[activeTab.id]);
        }

        const derived = deriveActiveFields(newData, activeTab.id);
        set({
          dashboards: tabs,
          activeDashboardId: activeTab.id,
          dashboardData: newData,
          hydrated: true,
          ...derived,
        });
        writeLocalStorage({
          dashboards: tabs,
          activeDashboardId: activeTab.id,
          dashboardData: newData,
        });
      } catch {
        set({ hydrated: true });
      }
    },

    switchDashboard: async (id) => {
      const { dashboardData, dashboards } = get();
      set({
        activeDashboardId: id,
        ...deriveActiveFields(dashboardData, id),
      });
      writeLocalStorage({
        dashboards,
        activeDashboardId: id,
        dashboardData,
      });

      if (!dashboardData[id]) {
        try {
          const remote = await getDashboardLayoutAction(id);
          const data: DashboardData = remote
            ? {
                layout: remote.layout,
                instances: remote.instances as WidgetInstance[],
                locked: remote.locked,
              }
            : { layout: [], instances: [], locked: true };
          const newData = { ...get().dashboardData, [id]: data };
          const derived = deriveActiveFields(newData, id);
          set({ dashboardData: newData, ...derived });
          writeLocalStorage({
            dashboards: get().dashboards,
            activeDashboardId: id,
            dashboardData: newData,
          });
        } catch {
          // leave empty
        }
      }
    },

    addDashboard: async (name, type) => {
      const { dashboards, dashboardData } = get();
      const order = dashboards.length;
      const { id } = await createDashboardAction({ name, type, order });
      const newTab: DashboardMeta = { id, name, type, order };
      const emptyData: DashboardData = { layout: [], instances: [], locked: true };
      const newDashboards = [...dashboards, newTab];
      const newData = { ...dashboardData, [id]: emptyData };
      const derived = deriveActiveFields(newData, id);
      set({
        dashboards: newDashboards,
        activeDashboardId: id,
        dashboardData: newData,
        ...derived,
      });
      writeLocalStorage({
        dashboards: newDashboards,
        activeDashboardId: id,
        dashboardData: newData,
      });
    },

    deleteDashboard: async (id) => {
      const { dashboards, activeDashboardId, dashboardData } = get();
      if (dashboards.length <= 1) return;
      await deleteDashboardAction({ id });
      const remaining = dashboards.filter((d) => d.id !== id);
      const newActiveId =
        activeDashboardId === id
          ? remaining[remaining.length - 1].id
          : activeDashboardId;
      const newData = { ...dashboardData };
      delete newData[id];
      const derived = deriveActiveFields(newData, newActiveId);
      set({
        dashboards: remaining,
        activeDashboardId: newActiveId,
        dashboardData: newData,
        ...derived,
      });
      writeLocalStorage({
        dashboards: remaining,
        activeDashboardId: newActiveId,
        dashboardData: newData,
      });
    },

    renameDashboard: async (id, name) => {
      await renameDashboardAction({ id, name });
      const { dashboards } = get();
      const newDashboards = dashboards.map((d) =>
        d.id === id ? { ...d, name } : d,
      );
      set({ dashboards: newDashboards });
      writeLocalStorage({
        dashboards: newDashboards,
        activeDashboardId: get().activeDashboardId,
        dashboardData: get().dashboardData,
      });
    },

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

    setWidgetConfig: (id, config) => {
      set((state) => ({
        instances: state.instances.map((inst) =>
          inst.id === id ? { ...inst, config } : inst,
        ),
      }));
      persist();
    },

    toggleLocked: () => {
      set((state) => ({ locked: !state.locked }));
      persist();
    },
  };
});
