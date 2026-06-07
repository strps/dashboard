"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  createNoteAction,
  deleteNoteAction,
  listNotesAction,
  renameNoteAction,
  saveNoteBlocksAction,
} from "./actions";
import type { Note, NoteBlock } from "./schemas";

const DEBOUNCE_MS = 500;
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleSave(id: string, blocks: NoteBlock[]) {
  const existing = saveTimers.get(id);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    saveTimers.delete(id);
    saveNoteBlocksAction(id, blocks).catch(() => {});
  }, DEBOUNCE_MS);
  saveTimers.set(id, timer);
}

function cancelDebouncedSave(id: string) {
  const existing = saveTimers.get(id);
  if (existing) {
    clearTimeout(existing);
    saveTimers.delete(id);
  }
}

interface NotesLibrary {
  notes: Note[];
  hydrated: boolean;
  createNote: (title: string) => Promise<Note>;
  renameNote: (id: string, title: string) => void;
  deleteNote: (id: string) => void;
  /**
   * Update a note's blocks. Text edits debounce the save (~500ms); structural
   * changes (add/remove/toggle/reorder block) pass `flush` to save immediately.
   */
  updateNoteBlocks: (
    id: string,
    blocks: NoteBlock[],
    opts?: { flush?: boolean },
  ) => void;
}

const NotesLibraryContext = createContext<NotesLibrary | null>(null);

export function NotesLibraryProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    let cancelled = false;
    listNotesAction()
      .then((rows) => {
        if (cancelled) return;
        setNotes(rows);
        setHydrated(true);
      })
      .catch(() => {
        if (cancelled) return;
        setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  const createNote = useCallback(async (title: string): Promise<Note> => {
    const created = await createNoteAction(title);
    setNotes((prev) => [...prev, created]);
    return created;
  }, []);

  const renameNote = useCallback((id: string, title: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, title } : n)),
    );
    renameNoteAction(id, title).catch(() => {});
  }, []);

  const deleteNote = useCallback((id: string) => {
    cancelDebouncedSave(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    deleteNoteAction(id).catch(() => {});
  }, []);

  const updateNoteBlocks = useCallback(
    (id: string, blocks: NoteBlock[], opts?: { flush?: boolean }) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, blocks } : n)),
      );
      if (opts?.flush) {
        cancelDebouncedSave(id);
        saveNoteBlocksAction(id, blocks).catch(() => {});
      } else {
        scheduleSave(id, blocks);
      }
    },
    [],
  );

  return (
    <NotesLibraryContext.Provider
      value={{
        notes,
        hydrated,
        createNote,
        renameNote,
        deleteNote,
        updateNoteBlocks,
      }}
    >
      {children}
    </NotesLibraryContext.Provider>
  );
}

export function useNotesLibrary(): NotesLibrary {
  const ctx = useContext(NotesLibraryContext);
  if (!ctx) {
    throw new Error(
      "useNotesLibrary must be used inside <NotesLibraryProvider>",
    );
  }
  return ctx;
}
