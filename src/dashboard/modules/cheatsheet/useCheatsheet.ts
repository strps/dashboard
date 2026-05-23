import { useCallback, useMemo } from "react";
import Fuse from "fuse.js";

import { useWidgetConfig } from "../../components/base-widget/useWidgetConfig";
import { useCheatsheetLibrary } from "./libraryContext";
import type {
  CheatsheetConfig,
  CheatsheetEntry,
  CheatsheetTag,
  FilterButton,
} from "./schemas";

function descendantsOf(tagId: string, tags: CheatsheetTag[]): Set<string> {
  const result = new Set<string>([tagId]);
  let added = true;
  while (added) {
    added = false;
    for (const t of tags) {
      if (t.parentId && result.has(t.parentId) && !result.has(t.id)) {
        result.add(t.id);
        added = true;
      }
    }
  }
  return result;
}

export function useCheatsheet(instanceId: string) {
  const { entries, tags, libraryHydrated } = useCheatsheetLibrary();

  const [config, setConfig] = useWidgetConfig<CheatsheetConfig>(instanceId);
  const filterButtons = config.filterButtons;

  const tagsById = useMemo(() => {
    const map = new Map<string, CheatsheetTag>();
    for (const t of tags) map.set(t.id, t);
    return map;
  }, [tags]);

  const fuse = useMemo(
    () =>
      new Fuse(entries, {
        keys: ["title", "syntax", "description"],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [entries],
  );

  const filterEntries = useCallback(
    (search: string, activeTagId: string | null): CheatsheetEntry[] => {
      let list = entries;
      if (activeTagId) {
        const allowed = descendantsOf(activeTagId, tags);
        list = list.filter((e) => e.tagIds.some((id) => allowed.has(id)));
      }
      const query = search.trim();
      if (query) {
        const ids = new Set(
          fuse.search(query).map((r) => (r.item as CheatsheetEntry).id),
        );
        list = list.filter((e) => ids.has(e.id));
      }
      return [...list].sort((a, b) => b.priority - a.priority);
    },
    [entries, tags, fuse],
  );

  const updateFilterButtons = useCallback(
    (next: FilterButton[]) => {
      setConfig({ filterButtons: next });
    },
    [setConfig],
  );

  return {
    entries,
    tags,
    tagsById,
    libraryHydrated,
    filterButtons,
    filterEntries,
    updateFilterButtons,
  };
}
