"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import GridLayout, { verticalCompactor } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { DashboardHeader } from "./DashboardHeader";
import { useDashboardStore } from "../store/dashboardStore";
import { WIDGET_REGISTRY } from "../widgets";
import type { WidgetType } from "../store/dashboardStore";

const GRID_WIDTH = 1200;

interface DashboardGridProps {
  isAdmin: boolean;
  userName: string;
  userEmail: string;
}

export function DashboardGrid({ isAdmin, userName, userEmail }: DashboardGridProps) {
  const { layout, instances, setLayout, addWidget, toggleLocked, locked, hydrateFromServer } =
    useDashboardStore();

  useEffect(() => {
    hydrateFromServer();
  }, [hydrateFromServer]);

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

  return (
    <>
      <DashboardHeader
        locked={locked}
        onToggleLock={toggleLocked}
        onAddWidget={addWidget}
        isAdmin={isAdmin}
        userName={userName}
        userEmail={userEmail}
      />

      <main className="p-6">
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
      </main>
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
