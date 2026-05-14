import { useCallback, useEffect, useMemo } from "react";
import Fuse from "fuse.js";

import {
  getWidgetConfigAction,
  listEntriesAction,
  listTagsAction,
  saveWidgetConfigAction,
} from "./actions";
import { useCheatsheetStore } from "./cheatsheetStore";
import type {
  CheatsheetEntry,
  CheatsheetTag,
  FilterButton,
} from "./schemas";

const CONFIG_DEBOUNCE_MS = 500;
const configSaveTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleConfigSave(instanceId: string, buttons: FilterButton[]) {
  const existing = configSaveTimers.get(instanceId);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    configSaveTimers.delete(instanceId);
    saveWidgetConfigAction(instanceId, buttons).catch(() => {});
  }, CONFIG_DEBOUNCE_MS);
  configSaveTimers.set(instanceId, timer);
}

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
  const entries = useCheatsheetStore((s) => s.entries);
  const tags = useCheatsheetStore((s) => s.tags);
  const libraryHydrated = useCheatsheetStore((s) => s.libraryHydrated);
  const setLibrary = useCheatsheetStore((s) => s.setLibrary);

  const filterButtons =
    useCheatsheetStore((s) => s.filterButtons[instanceId]) ?? EMPTY_BUTTONS;
  const configHydrated = useCheatsheetStore(
    (s) => s.configHydrated[instanceId] ?? false,
  );
  const setFilterButtons = useCheatsheetStore((s) => s.setFilterButtons);
  const setConfigHydrated = useCheatsheetStore((s) => s.setConfigHydrated);

  useEffect(() => {
    if (libraryHydrated) return;
    let cancelled = false;
    Promise.all([listEntriesAction(), listTagsAction()])
      .then(([e, t]) => {
        if (cancelled) return;
        setLibrary(e, t);
      })
      .catch(() => {
        if (cancelled) return;
        setLibrary([], []);
      });
    return () => {
      cancelled = true;
    };
  }, [libraryHydrated, setLibrary]);

  useEffect(() => {
    if (configHydrated) return;
    let cancelled = false;
    getWidgetConfigAction(instanceId)
      .then((buttons) => {
        if (cancelled) return;
        setConfigHydrated(instanceId, buttons);
      })
      .catch(() => {
        if (cancelled) return;
        setConfigHydrated(instanceId, []);
      });
    return () => {
      cancelled = true;
    };
  }, [instanceId, configHydrated, setConfigHydrated]);

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
      setFilterButtons(instanceId, next);
      scheduleConfigSave(instanceId, next);
    },
    [instanceId, setFilterButtons],
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

const EMPTY_BUTTONS: FilterButton[] = [];
