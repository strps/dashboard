import { useCallback, useEffect } from "react";

import { getNoteAction, saveNoteAction } from "./actions";
import { useNotesStore } from "./notesStore";
import type { NoteBlock } from "./schemas";

const DEBOUNCE_MS = 500;
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleSave(id: string, blocks: NoteBlock[]) {
  const existing = saveTimers.get(id);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    saveTimers.delete(id);
    saveNoteAction(id, blocks).catch(() => {});
  }, DEBOUNCE_MS);
  saveTimers.set(id, timer);
}

function saveNow(id: string, blocks: NoteBlock[]) {
  const existing = saveTimers.get(id);
  if (existing) {
    clearTimeout(existing);
    saveTimers.delete(id);
  }
  saveNoteAction(id, blocks).catch(() => {});
}

export function useNotes(id: string) {
  const blocks = useNotesStore((s) => s.notes[id]) ?? EMPTY;
  const hydrated = useNotesStore((s) => s.hydrated[id] ?? false);
  const setBlocks = useNotesStore((s) => s.setBlocks);
  const setHydrated = useNotesStore((s) => s.setHydrated);

  useEffect(() => {
    if (hydrated) return;
    let cancelled = false;
    getNoteAction(id)
      .then((remote) => {
        if (cancelled) return;
        setHydrated(id, remote ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setHydrated(id, []);
      });
    return () => {
      cancelled = true;
    };
  }, [id, hydrated, setHydrated]);

  const addTextBlock = useCallback(() => {
    const next: NoteBlock[] = [
      ...blocks,
      { id: crypto.randomUUID(), type: "text", text: "" },
    ];
    setBlocks(id, next);
    saveNow(id, next);
  }, [blocks, id, setBlocks]);

  const addChecklistBlock = useCallback(() => {
    const next: NoteBlock[] = [
      ...blocks,
      { id: crypto.randomUUID(), type: "checklist", text: "", checked: false },
    ];
    setBlocks(id, next);
    saveNow(id, next);
  }, [blocks, id, setBlocks]);

  const updateBlockText = useCallback(
    (blockId: string, text: string) => {
      const next = blocks.map((b) =>
        b.id === blockId ? { ...b, text } : b,
      );
      setBlocks(id, next);
      scheduleSave(id, next);
    },
    [blocks, id, setBlocks],
  );

  const toggleChecklistBlock = useCallback(
    (blockId: string) => {
      const next = blocks.map((b) =>
        b.id === blockId && b.type === "checklist"
          ? { ...b, checked: !b.checked }
          : b,
      );
      setBlocks(id, next);
      saveNow(id, next);
    },
    [blocks, id, setBlocks],
  );

  const removeBlock = useCallback(
    (blockId: string) => {
      const next = blocks.filter((b) => b.id !== blockId);
      setBlocks(id, next);
      saveNow(id, next);
    },
    [blocks, id, setBlocks],
  );

  return {
    blocks,
    hydrated,
    addTextBlock,
    addChecklistBlock,
    updateBlockText,
    toggleChecklistBlock,
    removeBlock,
  };
}

const EMPTY: NoteBlock[] = [];
