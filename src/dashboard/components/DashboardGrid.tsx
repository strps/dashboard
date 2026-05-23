"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import GridLayout, { verticalCompactor } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { DashboardHeader } from "./DashboardHeader";
import { Dialog } from "./Dialog";
import { useDashboardStore } from "../store/dashboardStore";
import { WIDGET_REGISTRY } from "../modules";
import type { WidgetType } from "../store/dashboardStore";

const GRID_WIDTH = 1200;

interface DashboardGridProps {
  isAdmin: boolean;
  userName: string;
  userEmail: string;
}

export function DashboardGrid({ isAdmin, userName, userEmail }: DashboardGridProps) {
  const {
    layout,
    instances,
    setLayout,
    addWidget,
    toggleLocked,
    locked,
    hydrateFromServer,
    dashboards,
    activeDashboardId,
    switchDashboard,
    addDashboard,
    deleteDashboard,
    renameDashboard,
  } = useDashboardStore();

  const [addDashOpen, setAddDashOpen] = useState(false);
  const [newDashName, setNewDashName] = useState("");
  const [newDashType, setNewDashType] = useState<"widgets" | "custom">("widgets");

  useEffect(() => {
    hydrateFromServer();
  }, [hydrateFromServer]);

  const activeTab = dashboards.find((d) => d.id === activeDashboardId);

  const layoutWithConstraints = layout.map((item) => {
    const instance = instances.find((w) => w.id === item.i);
    const def = instance ? WIDGET_REGISTRY[instance.type] : undefined;
    return {
      ...item,
      minW: def?.minW,
      maxW: def?.maxW,
      minH: def?.minH,
      maxH: def?.maxH,
    };
  });

  const activeProviders = useMemo(() => {
    const seen = new Set<WidgetType>();
    const providers: Array<React.ComponentType<{ children: ReactNode }>> = [];
    for (const instance of instances) {
      if (seen.has(instance.type)) continue;
      seen.add(instance.type);
      const def = WIDGET_REGISTRY[instance.type];
      if (def?.provider) providers.push(def.provider);
    }
    return providers;
  }, [instances]);

  function handleAddDashboard() {
    setNewDashName("");
    setNewDashType("widgets");
    setAddDashOpen(true);
  }

  function handleConfirmAddDashboard() {
    const name = newDashName.trim();
    if (!name) return;
    addDashboard(name, newDashType);
    setAddDashOpen(false);
  }

  return (
    <>
      <DashboardHeader
        locked={locked}
        onToggleLock={toggleLocked}
        onAddWidget={addWidget}
        isAdmin={isAdmin}
        userName={userName}
        userEmail={userEmail}
        dashboards={dashboards}
        activeDashboardId={activeDashboardId}
        onSwitchDashboard={switchDashboard}
        onAddDashboard={handleAddDashboard}
        onDeleteDashboard={deleteDashboard}
        onRenameDashboard={renameDashboard}
      />

      <main className="p-6">
        {!activeTab || activeTab.type === "widgets" ? (
          <WithProviders providers={activeProviders}>
            <GridLayout
              className="layout"
              layout={layoutWithConstraints}
              width={GRID_WIDTH}
              gridConfig={{ cols: 12, rowHeight: 80, margin: [12, 12] }}
              dragConfig={{ enabled: !locked, handle: ".drag-handle" }}
              resizeConfig={{ enabled: !locked }}
              compactor={verticalCompactor}
              onLayoutChange={(l) => setLayout([...l])}
            >
              {instances.map((instance) => {
                const def = WIDGET_REGISTRY[instance.type];
                if (!def) return null;
                const Widget = def.component;
                return (
                  <div key={instance.id}>
                    <Widget id={instance.id} />
                  </div>
                );
              })}
            </GridLayout>
          </WithProviders>
        ) : (
          <div className="flex items-center justify-center h-64 text-white/30 text-sm">
            Custom page — coming soon
          </div>
        )}
      </main>

      <Dialog
        open={addDashOpen}
        onClose={() => setAddDashOpen(false)}
        title="New dashboard"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/60">Name</label>
            <input
              autoFocus
              value={newDashName}
              onChange={(e) => setNewDashName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmAddDashboard();
              }}
              placeholder="My dashboard"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/60">Type</label>
            <div className="flex gap-2">
              {(["widgets", "custom"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNewDashType(t)}
                  className={`flex-1 py-2 rounded-lg text-xs capitalize transition-colors border ${
                    newDashType === t
                      ? "bg-white/15 border-white/30 text-white"
                      : "bg-transparent border-white/10 text-white/50 hover:bg-white/10"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setAddDashOpen(false)}
              className="px-4 py-2 text-xs text-white/50 hover:text-white/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAddDashboard}
              disabled={!newDashName.trim()}
              className="px-4 py-2 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-40"
            >
              Create
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function WithProviders({
  providers,
  children,
}: {
  providers: Array<React.ComponentType<{ children: ReactNode }>>;
  children: ReactNode;
}) {
  return providers.reduceRight<ReactNode>(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children,
  );
}
