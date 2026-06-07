"use client";

import { useEffect, useState } from "react";

import { listEntriesAction, listTagsAction } from "../actions";
import type { CheatsheetEntry, CheatsheetTag } from "../schemas";
import { CheatsheetManager } from "./CheatsheetManager";

export function CheatsheetTab() {
  const [data, setData] = useState<{
    entries: CheatsheetEntry[];
    tags: CheatsheetTag[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listEntriesAction(), listTagsAction()])
      .then(([entries, tags]) => {
        if (!cancelled) setData({ entries, tags });
      })
      .catch(() => {
        if (!cancelled) setData({ entries: [], tags: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return <div className="text-xs text-white/40 px-1 py-2">Loading…</div>;
  }

  // CheatsheetManager seeds its useState from these props on mount, so it is
  // only rendered once the data has hydrated.
  return (
    <CheatsheetManager initialEntries={data.entries} initialTags={data.tags} />
  );
}
