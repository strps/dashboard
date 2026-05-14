"use client";

import { useEffect } from "react";
import GridLayout, { verticalCompactor } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { DashboardHeader } from "./DashboardHeader";
import { useDashboardStore } from "../store/dashboardStore";
import { WIDGET_REGISTRY } from "../widgets";

const GRID_WIDTH = 1200;

interface DashboardGridProps {
  isAdmin: boolean;
}

export function DashboardGrid({ isAdmin }: DashboardGridProps) {
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

  return (
    <>
      <DashboardHeader
        locked={locked}
        onToggleLock={toggleLocked}
        onAddWidget={addWidget}
        isAdmin={isAdmin}
      />

      <main className="p-6">
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
      </main>
    </>
  );
}
