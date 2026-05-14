import { type ReactNode, useState } from "react";

export interface TabDef {
  id: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ tabs }: { tabs: TabDef[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex gap-1 border-b border-white/10 px-2 pt-2 shrink-0">
        {tabs.map((t) => {
          const isActive = t.id === active?.id;
          return (
            <button
              key={t.id}
              type="button"
              className={[
                "px-3 py-1.5 text-xs rounded-t-md border-b-2 -mb-px",
                isActive
                  ? "text-white border-emerald-400"
                  : "text-white/50 hover:text-white/80 border-transparent",
              ].join(" ")}
              onClick={() => setActiveId(t.id)}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">{active?.content}</div>
    </div>
  );
}
