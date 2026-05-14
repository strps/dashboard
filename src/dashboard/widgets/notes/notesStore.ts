import { create } from "zustand";

import type { NoteBlock } from "./schemas";

interface NotesState {
  notes: Record<string, NoteBlock[]>;
  hydrated: Record<string, boolean>;
  setBlocks: (id: string, blocks: NoteBlock[]) => void;
  setHydrated: (id: string, blocks: NoteBlock[]) => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: {},
  hydrated: {},
  setBlocks: (id, blocks) =>
    set((state) => ({ notes: { ...state.notes, [id]: blocks } })),
  setHydrated: (id, blocks) =>
    set((state) => ({
      notes: { ...state.notes, [id]: blocks },
      hydrated: { ...state.hydrated, [id]: true },
    })),
}));
