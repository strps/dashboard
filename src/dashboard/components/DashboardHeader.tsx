import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock, Plus, ChevronDown, LogOut, Settings } from "lucide-react";
import { WIDGET_REGISTRY } from "../widgets";
import type { WidgetType } from "../store/dashboardStore";
import { authClient } from "@/lib/auth-client";
import { WidgetConfigDialog } from "./WidgetConfigDialog";

interface DashboardHeaderProps {
  locked: boolean;
  onToggleLock: () => void;
  onAddWidget: (type: WidgetType) => void;
}

export function DashboardHeader({ locked, onToggleLock, onAddWidget }: DashboardHeaderProps) {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function onSignOut() {
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
      <h1 className="text-sm font-medium tracking-wide text-white/70">Dashboard</h1>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleLock}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title={locked ? "Unlock layout" : "Lock layout"}
        >
          {locked ? (
            <Lock size={14} className="text-white/60" />
          ) : (
            <Unlock size={14} className="text-white/40" />
          )}
        </button>

        {!locked && (
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Plus size={12} />
              Add widget
              <ChevronDown size={10} className="text-white/40" />
            </button>

            {open && (
              <div className="absolute right-0 mt-1 w-36 rounded-lg border border-white/10 bg-neutral-900 shadow-xl z-50 overflow-hidden">
                {(Object.entries(WIDGET_REGISTRY) as [WidgetType, (typeof WIDGET_REGISTRY)[WidgetType]][]).map(
                  ([type, def]) => (
                    <button
                      key={type}
                      className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors"
                      onClick={() => {
                        onAddWidget(type);
                        setOpen(false);
                      }}
                    >
                      {def.label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setSettingsOpen(true)}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Widget settings"
        >
          <Settings size={14} className="text-white/60" />
        </button>

        <button
          onClick={onSignOut}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Sign out"
        >
          <LogOut size={14} className="text-white/60" />
        </button>
      </div>

      <WidgetConfigDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
