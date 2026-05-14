"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import type { WidgetType } from "../store/dashboardStore";
import { WIDGET_REGISTRY } from "../widgets";
import { Dialog } from "./Dialog";

interface WidgetConfigDialogProps {
  open: boolean;
  onClose: () => void;
}

export function WidgetConfigDialog({ open, onClose }: WidgetConfigDialogProps) {
  const configurable = useMemo(
    () =>
      (Object.entries(WIDGET_REGISTRY) as [WidgetType, (typeof WIDGET_REGISTRY)[WidgetType]][])
        .filter(([, def]) => def.configComponent)
        .map(([type, def]) => ({ type, label: def.label, Config: def.configComponent! })),
    [],
  );

  const [selected, setSelected] = useState<WidgetType | null>(
    configurable[0]?.type ?? null,
  );

  useEffect(() => {
    if (!open) return;
    if (selected == null || !configurable.some((c) => c.type === selected)) {
      setSelected(configurable[0]?.type ?? null);
    }
  }, [open, selected, configurable]);

  const active = configurable.find((c) => c.type === selected) ?? null;

  return (
    <Dialog open={open} onClose={onClose} title="Widget settings" widthClass="max-w-3xl">
      {configurable.length === 0 ? (
        <div className="p-6 text-sm text-white/40">
          No widgets with settings are available.
        </div>
      ) : (
        <div className="flex h-[60vh] min-h-[360px]">
          <nav className="w-48 shrink-0 border-r border-white/10 bg-white/[0.02] p-2 flex flex-col gap-1 overflow-auto">
            {configurable.map(({ type, label }) => {
              const isActive = type === selected;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelected(type)}
                  className={[
                    "relative text-left text-xs px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "text-white"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5",
                  ].join(" ")}
                >
                  {isActive && (
                    <motion.span
                      layoutId="widget-config-nav-active"
                      className="absolute inset-0 rounded-md bg-white/10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </button>
              );
            })}
          </nav>
          <div className="flex-1 min-w-0 min-h-0 overflow-auto">
            <AnimatePresence mode="wait">
              {active && (
                <motion.div
                  key={active.type}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="h-full"
                >
                  <active.Config />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </Dialog>
  );
}
