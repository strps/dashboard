import { create } from "zustand";

import type {
  CheatsheetEntry,
  CheatsheetTag,
  FilterButton,
} from "./schemas";

interface CheatsheetState {
  entries: CheatsheetEntry[];
  tags: CheatsheetTag[];
  libraryHydrated: boolean;
  filterButtons: Record<string, FilterButton[]>;
  configHydrated: Record<string, boolean>;

  setLibrary: (entries: CheatsheetEntry[], tags: CheatsheetTag[]) => void;

  upsertEntry: (entry: CheatsheetEntry) => void;
  removeEntry: (id: string) => void;

  upsertTag: (tag: CheatsheetTag) => void;
  removeTag: (id: string) => void;

  setFilterButtons: (instanceId: string, buttons: FilterButton[]) => void;
  setConfigHydrated: (instanceId: string, buttons: FilterButton[]) => void;
}

export const useCheatsheetStore = create<CheatsheetState>((set) => ({
  entries: [],
  tags: [],
  libraryHydrated: false,
  filterButtons: {},
  configHydrated: {},

  setLibrary: (entries, tags) =>
    set(() => ({ entries, tags, libraryHydrated: true })),

  upsertEntry: (entry) =>
    set((state) => {
      const idx = state.entries.findIndex((e) => e.id === entry.id);
      const next =
        idx === -1
          ? [entry, ...state.entries]
          : state.entries.map((e) => (e.id === entry.id ? entry : e));
      return { entries: next };
    }),
  removeEntry: (id) =>
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),

  upsertTag: (tag) =>
    set((state) => {
      const idx = state.tags.findIndex((t) => t.id === tag.id);
      const next =
        idx === -1
          ? [...state.tags, tag].sort((a, b) => a.name.localeCompare(b.name))
          : state.tags.map((t) => (t.id === tag.id ? tag : t));
      return { tags: next };
    }),
  removeTag: (id) =>
    set((state) => ({
      tags: state.tags
        .filter((t) => t.id !== id)
        .map((t) => (t.parentId === id ? { ...t, parentId: null } : t)),
      // Strip the deleted tag from any entry's tagIds and any filter buttons.
      entries: state.entries.map((e) =>
        e.tagIds.includes(id)
          ? { ...e, tagIds: e.tagIds.filter((t) => t !== id) }
          : e,
      ),
      filterButtons: Object.fromEntries(
        Object.entries(state.filterButtons).map(([k, buttons]) => [
          k,
          buttons.filter((b) => b.tagId !== id),
        ]),
      ),
    })),

  setFilterButtons: (instanceId, buttons) =>
    set((state) => ({
      filterButtons: { ...state.filterButtons, [instanceId]: buttons },
    })),
  setConfigHydrated: (instanceId, buttons) =>
    set((state) => ({
      filterButtons: { ...state.filterButtons, [instanceId]: buttons },
      configHydrated: { ...state.configHydrated, [instanceId]: true },
    })),
}));
