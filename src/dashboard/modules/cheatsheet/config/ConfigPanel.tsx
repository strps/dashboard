"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { CheatsheetTag, FilterButton } from "../schemas";

interface CheatsheetConfigProps {
  tags: CheatsheetTag[];
  filterButtons: FilterButton[];
  updateFilterButtons: (next: FilterButton[]) => void;
}

export function CheatsheetConfigPanel({
  tags,
  filterButtons,
  updateFilterButtons,
}: CheatsheetConfigProps) {

  const tagsById = useMemo(() => {
    const map = new Map<string, CheatsheetTag>();
    for (const t of tags) map.set(t.id, t);
    return map;
  }, [tags]);

  const usedTagIds = useMemo(
    () => new Set(filterButtons.map((b) => b.tagId)),
    [filterButtons],
  );
  const availableTags = useMemo(
    () => tags.filter((t) => !usedTagIds.has(t.id)),
    [tags, usedTagIds],
  );

  const [pickerTagId, setPickerTagId] = useState<string>("");

  const addButton = () => {
    if (!pickerTagId) return;
    const next: FilterButton[] = [
      ...filterButtons,
      { tagId: pickerTagId, labelOverride: null, colorOverride: null },
    ];
    updateFilterButtons(next);
    setPickerTagId("");
  };

  const removeButton = (tagId: string) => {
    updateFilterButtons(filterButtons.filter((b) => b.tagId !== tagId));
  };

  const moveButton = (tagId: string, dir: -1 | 1) => {
    const idx = filterButtons.findIndex((b) => b.tagId === tagId);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= filterButtons.length) return;
    const next = [...filterButtons];
    [next[idx], next[target]] = [next[target], next[idx]];
    updateFilterButtons(next);
  };

  const updateButton = (
    tagId: string,
    patch: Partial<Omit<FilterButton, "tagId">>,
  ) => {
    updateFilterButtons(
      filterButtons.map((b) =>
        b.tagId === tagId ? { ...b, ...patch } : b,
      ),
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto p-5 space-y-4">
        <div>
          <h3 className="text-xs font-medium text-white/80">Filter buttons</h3>
          <p className="mt-1 text-[11px] text-white/50">
            Choose which tags appear as filter buttons in this cheatsheet
            instance. The button filters entries that carry the tag (or any of
            its descendant tags).
          </p>
        </div>

        {filterButtons.length === 0 ? (
          <div className="text-[11px] text-white/30 italic">
            No filter buttons yet. Add one below.
          </div>
        ) : (
          <ul className="space-y-2">
            {filterButtons.map((btn, i) => {
              const tag = tagsById.get(btn.tagId);
              return (
                <li
                  key={btn.tagId}
                  className="rounded-md border border-white/10 bg-white/[0.02] p-2.5 flex items-start gap-2"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveButton(btn.tagId, -1)}
                      disabled={i === 0}
                      className="w-6 h-6 rounded text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent flex items-center justify-center"
                      title="Move up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveButton(btn.tagId, 1)}
                      disabled={i === filterButtons.length - 1}
                      className="w-6 h-6 rounded text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:hover:bg-transparent flex items-center justify-center"
                      title="Move down"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="text-xs text-white/80">
                      {tag ? tag.name : (
                        <span className="text-red-400/80">
                          (deleted tag — remove this button)
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="flex items-center gap-1.5 text-[11px] text-white/50">
                        Label
                        <input
                          type="text"
                          placeholder={tag?.name ?? ""}
                          value={btn.labelOverride ?? ""}
                          onChange={(e) =>
                            updateButton(btn.tagId, {
                              labelOverride: e.target.value
                                ? e.target.value
                                : null,
                            })
                          }
                          className="rounded border border-white/10 bg-neutral-950 px-1.5 py-0.5 text-[11px] text-white/80 outline-none focus:border-white/30 w-28"
                        />
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] text-white/50">
                        Color
                        <input
                          type="color"
                          value={
                            btn.colorOverride ?? tag?.color ?? "#a3e635"
                          }
                          onChange={(e) =>
                            updateButton(btn.tagId, {
                              colorOverride: e.target.value,
                            })
                          }
                          className="h-6 w-8 rounded border border-white/10 bg-neutral-950"
                        />
                        {btn.colorOverride !== null && (
                          <button
                            type="button"
                            onClick={() =>
                              updateButton(btn.tagId, { colorOverride: null })
                            }
                            className="text-white/40 hover:text-white/80 text-[10px] underline"
                          >
                            reset
                          </button>
                        )}
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeButton(btn.tagId)}
                    className="w-6 h-6 rounded text-white/40 hover:text-white hover:bg-red-500/20 flex items-center justify-center"
                    title="Remove button"
                  >
                    <X size={12} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center gap-2 border-t border-white/5 pt-3">
          <select
            value={pickerTagId}
            onChange={(e) => setPickerTagId(e.target.value)}
            disabled={availableTags.length === 0}
            className="flex-1 rounded-md border border-white/10 bg-neutral-950 px-2 py-1.5 text-xs text-white/80 outline-none focus:border-white/30 disabled:opacity-40"
          >
            <option value="">
              {availableTags.length === 0
                ? "All tags are already added"
                : "Select a tag…"}
            </option>
            {availableTags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addButton}
            disabled={!pickerTagId}
            className="px-2.5 py-1.5 rounded-md bg-emerald-600/80 text-xs text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Plus size={12} />
            Add
          </button>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-3 bg-white/[0.02] text-[11px] text-white/50 flex items-center justify-between">
        <span>Entries and tags are shared across all cheatsheet widgets.</span>
        <Link
          href="/settings/cheatsheet/cheatsheet"
          className="text-white/70 hover:text-white underline"
        >
          Manage entries and tags →
        </Link>
      </div>
    </div>
  );
}
