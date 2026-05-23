import { useCallback, useEffect, useOptimistic, useState, useTransition } from "react";

import { getNoteAction, saveNoteAction } from "./actions";
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

function cancelDebouncedSave(id: string) {
  const existing = saveTimers.get(id);
  if (existing) {
    clearTimeout(existing);
    saveTimers.delete(id);
  }
}

type StructuralAction =
  | { type: "set"; blocks: NoteBlock[] };

function blocksReducer(_state: NoteBlock[], action: StructuralAction): NoteBlock[] {
  return action.blocks;
}

export function useNotes(id: string) {
  const [blocks, setBlocks] = useState<NoteBlock[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [optimisticBlocks, applyOptimistic] = useOptimistic(
    blocks,
    blocksReducer,
  );

  const [, startTransition] = useTransition();

  useEffect(() => {
    if (hydrated) return;
    let cancelled = false;
    getNoteAction(id)
      .then((remote) => {
        if (cancelled) return;
        setBlocks(remote ?? []);
        setHydrated(true);
      })
      .catch(() => {
        if (cancelled) return;
        setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, hydrated]);

  const runStructural = useCallback(
    (next: NoteBlock[]) => {
      cancelDebouncedSave(id);
      startTransition(async () => {
        applyOptimistic({ type: "set", blocks: next });
        try {
          await saveNoteAction(id, next);
          setBlocks(next);
        } catch {
          // optimistic state reverts when the transition ends
        }
      });
    },
    [id, applyOptimistic],
  );

  const addTextBlock = useCallback(() => {
    const next: NoteBlock[] = [
      ...optimisticBlocks,
      { id: crypto.randomUUID(), type: "text", text: "" },
    ];
    runStructural(next);
  }, [optimisticBlocks, runStructural]);

  const addChecklistBlock = useCallback(() => {
    const next: NoteBlock[] = [
      ...optimisticBlocks,
      { id: crypto.randomUUID(), type: "checklist", text: "", checked: false },
    ];
    runStructural(next);
  }, [optimisticBlocks, runStructural]);

  const updateBlockText = useCallback(
    (blockId: string, text: string) => {
      const next = optimisticBlocks.map((b) =>
        b.id === blockId ? { ...b, text } : b,
      );
      setBlocks(next);
      scheduleSave(id, next);
    },
    [id, optimisticBlocks],
  );

  const toggleChecklistBlock = useCallback(
    (blockId: string) => {
      const next = optimisticBlocks.map((b) =>
        b.id === blockId && b.type === "checklist"
          ? { ...b, checked: !b.checked }
          : b,
      );
      runStructural(next);
    },
    [optimisticBlocks, runStructural],
  );

  const removeBlock = useCallback(
    (blockId: string) => {
      const next = optimisticBlocks.filter((b) => b.id !== blockId);
      runStructural(next);
    },
    [optimisticBlocks, runStructural],
  );

  const insertBlockAfter = useCallback(
    (blockId: string, type: "text" | "checklist"): string => {
      const newBlock: NoteBlock =
        type === "text"
          ? { id: crypto.randomUUID(), type: "text", text: "" }
          : { id: crypto.randomUUID(), type: "checklist", text: "", checked: false };
      const idx = optimisticBlocks.findIndex((b) => b.id === blockId);
      const insertAt = idx === -1 ? optimisticBlocks.length : idx + 1;
      const next = [
        ...optimisticBlocks.slice(0, insertAt),
        newBlock,
        ...optimisticBlocks.slice(insertAt),
      ];
      runStructural(next);
      return newBlock.id;
    },
    [optimisticBlocks, runStructural],
  );

  return {
    blocks: optimisticBlocks,
    hydrated,
    addTextBlock,
    addChecklistBlock,
    updateBlockText,
    toggleChecklistBlock,
    removeBlock,
    insertBlockAfter,
  };
}
