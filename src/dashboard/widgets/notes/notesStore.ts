import { create } from "zustand";

interface NotesState {
  notes: Record<string, string>;
  updateNote: (id: string, content: string) => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: {},
  updateNote: (id, content) =>
    set((state) => ({ notes: { ...state.notes, [id]: content } })),
}));
