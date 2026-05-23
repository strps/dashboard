"use client";

import { useOptimistic, useState } from "react";

import type {
  CheatsheetEntry,
  CheatsheetTag,
} from "@/dashboard/modules/cheatsheet/schemas";

import { EntriesTab } from "./EntriesTab";
import { TagsTab } from "./TagsTab";

interface CheatsheetManagerProps {
  initialEntries: CheatsheetEntry[];
  initialTags: CheatsheetTag[];
}

type TabKey = "entries" | "tags";

export type EntryOptimisticAction =
  | { type: "create"; entry: CheatsheetEntry }
  | { type: "update"; entry: CheatsheetEntry }
  | { type: "delete"; id: string }
  | { type: "strip-tag"; tagId: string };

export type TagOptimisticAction =
  | { type: "create"; tag: CheatsheetTag }
  | { type: "update"; tag: CheatsheetTag }
  | { type: "delete"; id: string };

function entriesReducer(
  state: CheatsheetEntry[],
  action: EntryOptimisticAction,
): CheatsheetEntry[] {
  switch (action.type) {
    case "create":
      return [action.entry, ...state];
    case "update":
      return state.map((e) => (e.id === action.entry.id ? action.entry : e));
    case "delete":
      return state.filter((e) => e.id !== action.id);
    case "strip-tag":
      return state.map((e) =>
        e.tagIds.includes(action.tagId)
          ? { ...e, tagIds: e.tagIds.filter((t) => t !== action.tagId) }
          : e,
      );
  }
}

function tagsReducer(
  state: CheatsheetTag[],
  action: TagOptimisticAction,
): CheatsheetTag[] {
  switch (action.type) {
    case "create":
      return [...state, action.tag].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    case "update":
      return state.map((t) => (t.id === action.tag.id ? action.tag : t));
    case "delete":
      return state
        .filter((t) => t.id !== action.id)
        .map((t) => (t.parentId === action.id ? { ...t, parentId: null } : t));
  }
}

export function CheatsheetManager({
  initialEntries,
  initialTags,
}: CheatsheetManagerProps) {
  const [tab, setTab] = useState<TabKey>("entries");
  const [entries, setEntries] = useState(initialEntries);
  const [tags, setTags] = useState(initialTags);

  const [optimisticEntries, applyEntryOptimistic] = useOptimistic(
    entries,
    entriesReducer,
  );
  const [optimisticTags, applyTagOptimistic] = useOptimistic(
    tags,
    tagsReducer,
  );

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="flex border-b border-white/10">
        <TabButton
          active={tab === "entries"}
          onClick={() => setTab("entries")}
        >
          Entries ({optimisticEntries.length})
        </TabButton>
        <TabButton active={tab === "tags"} onClick={() => setTab("tags")}>
          Tags ({optimisticTags.length})
        </TabButton>
      </div>
      <div className="p-4">
        {tab === "entries" ? (
          <EntriesTab
            entries={optimisticEntries}
            tags={optimisticTags}
            setEntries={setEntries}
            applyOptimistic={applyEntryOptimistic}
          />
        ) : (
          <TagsTab
            tags={optimisticTags}
            setTags={setTags}
            setEntries={setEntries}
            applyTagOptimistic={applyTagOptimistic}
            applyEntryOptimistic={applyEntryOptimistic}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-4 py-2 text-xs transition-colors border-b-2 -mb-px",
        active
          ? "text-white border-white/60"
          : "text-white/50 border-transparent hover:text-white/80",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
