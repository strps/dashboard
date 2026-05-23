import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Unlock, Plus, ChevronDown, LogOut, Settings, X } from "lucide-react";
import { WIDGET_REGISTRY } from "../modules";
import type { WidgetType, DashboardMeta } from "../store/dashboardStore";
import { authClient } from "@/lib/auth-client";

interface DashboardHeaderProps {
  locked: boolean;
  onToggleLock: () => void;
  onAddWidget: (type: WidgetType) => void;
  isAdmin: boolean;
  userName: string;
  userEmail: string;
  dashboards: DashboardMeta[];
  activeDashboardId: string | null;
  onSwitchDashboard: (id: string) => void;
  onAddDashboard: () => void;
  onDeleteDashboard: (id: string) => void;
  onRenameDashboard: (id: string, name: string) => void;
}

export function DashboardHeader({
  locked,
  onToggleLock,
  onAddWidget,
  isAdmin,
  userName,
  userEmail,
  dashboards,
  activeDashboardId,
  onSwitchDashboard,
  onAddDashboard,
  onDeleteDashboard,
  onRenameDashboard,
}: DashboardHeaderProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function onSignOut() {
    await authClient.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  useEffect(() => {
    if (!addOpen && !userOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (addOpen && !addRef.current?.contains(e.target as Node)) setAddOpen(false);
      if (userOpen && !userRef.current?.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [addOpen, userOpen]);

  const initials = userName.trim().charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase();

  return (
    <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
      <TabStrip
        dashboards={dashboards}
        activeDashboardId={activeDashboardId}
        onSwitch={onSwitchDashboard}
        onAdd={onAddDashboard}
        onDelete={onDeleteDashboard}
        onRename={onRenameDashboard}
      />

      <div className="flex items-center gap-2 shrink-0">
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
          <div className="relative" ref={addRef}>
            <button
              onClick={() => setAddOpen((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Plus size={12} />
              Add widget
              <ChevronDown size={10} className="text-white/40" />
            </button>

            {addOpen && (
              <div className="absolute right-0 mt-1 w-36 rounded-lg border border-white/10 bg-neutral-900 shadow-xl z-50 overflow-hidden">
                {(Object.entries(WIDGET_REGISTRY) as [WidgetType, (typeof WIDGET_REGISTRY)[WidgetType]][]).map(
                  ([type, def]) => (
                    <button
                      key={type}
                      className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors"
                      onClick={() => {
                        onAddWidget(type);
                        setAddOpen(false);
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

        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserOpen((v) => !v)}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 transition-colors flex items-center justify-center text-xs font-medium text-white/80"
            title="User menu"
          >
            {initials}
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-1 w-52 rounded-lg border border-white/10 bg-neutral-900 shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-white/10">
                <p className="text-xs font-medium text-white/90 truncate">{userName}</p>
                <p className="text-[11px] text-white/40 truncate mt-0.5">{userEmail}</p>
              </div>

              <div className="p-1">
                <Link
                  href="/settings"
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  <Settings size={13} />
                  Settings
                </Link>

                {isAdmin && (
                  <Link
                    href="/settings/security"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                  >
                    <Settings size={13} />
                    Dashboard Configuration
                  </Link>
                )}
              </div>

              <div className="p-1 border-t border-white/10">
                <button
                  onClick={onSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

interface TabStripProps {
  dashboards: DashboardMeta[];
  activeDashboardId: string | null;
  onSwitch: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

function TabStrip({ dashboards, activeDashboardId, onSwitch, onAdd, onDelete, onRename }: TabStripProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  function startEdit(tab: DashboardMeta, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingId(tab.id);
    setEditValue(tab.name);
  }

  function commitEdit() {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  }

  return (
    <div className="flex items-center gap-1 flex-1 overflow-x-auto min-w-0">
      {dashboards.map((tab) => (
        <div
          key={tab.id}
          className={`group flex items-center gap-1 px-3 py-1.5 rounded-md text-xs cursor-pointer select-none transition-colors shrink-0 ${
            tab.id === activeDashboardId
              ? "bg-white/15 text-white"
              : "text-white/50 hover:bg-white/10 hover:text-white/80"
          }`}
          onClick={() => {
            if (editingId !== tab.id) onSwitch(tab.id);
          }}
          onDoubleClick={(e) => startEdit(tab, e)}
        >
          {editingId === tab.id ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") setEditingId(null);
              }}
              className="bg-transparent outline-none w-24 text-white text-xs"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span>{tab.name}</span>
          )}
          {dashboards.length > 1 && (
            <button
              className="opacity-0 group-hover:opacity-60 hover:opacity-100! ml-0.5 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(tab.id);
              }}
              title="Delete dashboard"
            >
              <X size={10} />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onAdd}
        className="p-1.5 rounded-md text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors shrink-0"
        title="New dashboard"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}
