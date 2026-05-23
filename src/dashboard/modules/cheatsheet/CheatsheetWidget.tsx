"use client";

import { useMemo, useState } from "react";
import { Search, Settings2 } from "lucide-react";

import { Dialog } from "@/dashboard/components/Dialog";

import { BaseWidget } from "../../components/base-widget/BaseWidget";
import { useWidget } from "../../components/base-widget/useWidget";
import type { WidgetComponentProps, WidgetDefinition } from "../registry";
import { CheatsheetConfigPanel } from "./config/ConfigPanel";
import { CheatsheetLibraryProvider } from "./libraryContext";
import { useCheatsheet } from "./useCheatsheet";
import {
  cheatsheetConfigSchema,
  defaultCheatsheetConfig,
  type CheatsheetConfig,
  type CheatsheetEntry,
  type CheatsheetTag,
  type FilterButton,
} from "./schemas";

export function CheatsheetWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);
  const {
    tags,
    libraryHydrated,
    filterButtons,
    tagsById,
    filterEntries,
    updateFilterButtons,
  } = useCheatsheet(id);

  const interactive = locked;

  const [search, setSearch] = useState("");
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  const buttonsByTagId = useMemo(() => {
    const map = new Map<string, FilterButton>();
    for (const b of filterButtons) map.set(b.tagId, b);
    return map;
  }, [filterButtons]);

  const visibleButtons = useMemo(
    () => filterButtons.filter((b) => tagsById.has(b.tagId)),
    [filterButtons, tagsById],
  );

  const visibleEntries = useMemo(
    () => filterEntries(search, activeTagId),
    [filterEntries, search, activeTagId],
  );

  return (
    <BaseWidget id={id} locked={locked} onRemove={onRemove} onConfigure={() => setConfigOpen(true)}>
      <div className="h-full w-full rounded-xl bg-white/5 flex flex-col">
        <div className="flex items-center gap-2 p-2 border-b border-white/10">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30 pl-1 shrink-0">Cheatsheet</span>
          <div className="relative flex-1">
            <Search
              size={12}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              type="text"
              placeholder="Search cheatsheet…"
              className="w-full rounded-md border border-white/10 bg-neutral-900 pl-7 pr-2 py-1.5 text-xs text-white/80 placeholder:text-white/30 outline-none focus:border-white/30 disabled:cursor-not-allowed"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={!interactive}
            />
          </div>
          <button
            type="button"
            title="Configure cheatsheet"
            onClick={() => setConfigOpen(true)}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={!interactive}
            className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Settings2 size={12} />
          </button>
        </div>

        {visibleButtons.length > 0 && (
          <div className="flex flex-wrap gap-1 p-2 border-b border-white/5">
            <FilterChip
              label="All"
              color={null}
              active={activeTagId === null}
              interactive={interactive}
              onClick={() => setActiveTagId(null)}
            />
            {visibleButtons.map((btn) => {
              const tag = tagsById.get(btn.tagId);
              if (!tag) return null;
              const color = btn.colorOverride ?? tag.color ?? null;
              const label = btn.labelOverride ?? tag.name;
              return (
                <FilterChip
                  key={btn.tagId}
                  label={label}
                  color={color}
                  active={activeTagId === btn.tagId}
                  interactive={interactive}
                  onClick={() =>
                    setActiveTagId(
                      activeTagId === btn.tagId ? null : btn.tagId,
                    )
                  }
                />
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {!libraryHydrated && (
            <div className="text-white/30 text-xs font-mono">Loading…</div>
          )}
          {libraryHydrated && visibleEntries.length === 0 && (
            <div className="text-white/20 text-xs font-mono px-1 py-2">
              {search || activeTagId
                ? "No matching entries."
                : "No entries yet. Add some in settings."}
            </div>
          )}
          {visibleEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              tagsById={tagsById}
              buttonsByTagId={buttonsByTagId}
            />
          ))}
        </div>
      </div>

      <Dialog
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        title="Cheatsheet settings"
        widthClass="max-w-2xl"
      >
        <CheatsheetConfigPanel
          tags={tags}
          filterButtons={filterButtons}
          updateFilterButtons={updateFilterButtons}
        />
      </Dialog>
    </BaseWidget>
  );
}

interface FilterChipProps {
  label: string;
  color: string | null;
  active: boolean;
  interactive: boolean;
  onClick: () => void;
}

function FilterChip({
  label,
  color,
  active,
  interactive,
  onClick,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      disabled={!interactive}
      className={`px-2 py-0.5 text-[11px] rounded-full border transition-colors disabled:cursor-not-allowed ${
        active
          ? "border-white/60 text-white bg-white/15"
          : "border-white/10 text-white/60 hover:border-white/30 hover:text-white/90"
      }`}
      style={
        active && color ? { borderColor: color, color: color } : undefined
      }
    >
      {label}
    </button>
  );
}

interface EntryCardProps {
  entry: CheatsheetEntry;
  tagsById: Map<string, CheatsheetTag>;
  buttonsByTagId: Map<string, FilterButton>;
}

function EntryCard({ entry, tagsById, buttonsByTagId }: EntryCardProps) {
  return (
    <div className="rounded-md border border-white/5 bg-neutral-900/40 p-2">
      <div className="text-xs font-medium text-white/85">{entry.title}</div>
      <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-emerald-300/90">
        {entry.syntax}
      </pre>
      {entry.description && (
        <div className="mt-1 text-[11px] text-white/50">
          {entry.description}
        </div>
      )}
      {entry.tagIds.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {entry.tagIds.map((tagId) => {
            const tag = tagsById.get(tagId);
            if (!tag) return null;
            const btn = buttonsByTagId.get(tagId);
            const color = btn?.colorOverride ?? tag.color ?? null;
            return (
              <span
                key={tagId}
                className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-white/55"
                style={color ? { borderColor: color, color } : undefined}
              >
                {tag.name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const cheatsheetWidget: WidgetDefinition<CheatsheetConfig> = {
  type: "cheatsheet",
  label: "Cheatsheet",
  defaultSize: { w: 5, h: 5 },
  minW: 3,
  minH: 3,
  component: CheatsheetWidget,
  provider: CheatsheetLibraryProvider,
  configSchema: cheatsheetConfigSchema,
  defaultConfig: defaultCheatsheetConfig,
};
