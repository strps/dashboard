"use client";

import { useState } from "react";

import type {
  CheatsheetEntry,
  CheatsheetTag,
} from "@/dashboard/widgets/cheatsheet/schemas";

import { EntriesTab } from "./EntriesTab";
import { TagsTab } from "./TagsTab";

interface CheatsheetManagerProps {
  initialEntries: CheatsheetEntry[];
  initialTags: CheatsheetTag[];
}

type TabKey = "entries" | "tags";

export function CheatsheetManager({
  initialEntries,
  initialTags,
}: CheatsheetManagerProps) {
  const [tab, setTab] = useState<TabKey>("entries");
  const [entries, setEntries] = useState(initialEntries);
  const [tags, setTags] = useState(initialTags);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="flex border-b border-white/10">
        <TabButton
          active={tab === "entries"}
          onClick={() => setTab("entries")}
        >
          Entries ({entries.length})
        </TabButton>
        <TabButton active={tab === "tags"} onClick={() => setTab("tags")}>
          Tags ({tags.length})
        </TabButton>
      </div>
      <div className="p-4">
        {tab === "entries" ? (
          <EntriesTab
            entries={entries}
            tags={tags}
            setEntries={setEntries}
          />
        ) : (
          <TagsTab tags={tags} setTags={setTags} setEntries={setEntries} />
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
