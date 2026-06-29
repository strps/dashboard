import { useCallback, useEffect, useRef, useState } from "react";

import { getEntryNotesAction, updateEntryNotesAction } from "../../actions";
import type { TextItem } from "../../schemas";

const SAVE_DEBOUNCE_MS = 500;

/**
 * Loads and edits the free-text notes for a single time entry. Notes are fetched
 * by id on mount; text edits are debounced, structural changes (add/remove) flush
 * immediately. Used by both the Calendar Properties and Activity Selector widgets.
 *
 * Callers should mount one editor per entry (e.g. `key={entryId}`) so switching
 * entries resets local state via remount rather than an in-effect reset.
 */
export function useEntryNotes(entryId: string | null) {
  const [notes, setNotes] = useState<TextItem[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!entryId) return;
    let cancelled = false;
    getEntryNotesAction(entryId)
      .then((n) => {
        if (!cancelled) setNotes(n);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [entryId]);

  const save = useCallback(
    (next: TextItem[], debounced: boolean) => {
      if (!entryId) return;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      const flush = () => {
        updateEntryNotesAction({ id: entryId, notes: next }).catch(() => {});
      };
      if (debounced) {
        saveTimer.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
      } else {
        flush();
      }
    },
    [entryId],
  );

  const addItem = useCallback(() => {
    setNotes((prev) => {
      const next = [...prev, { id: crypto.randomUUID(), text: "" }];
      save(next, false);
      return next;
    });
  }, [save]);

  const updateItemText = useCallback(
    (id: string, text: string) => {
      setNotes((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, text } : n));
        save(next, true);
        return next;
      });
    },
    [save],
  );

  const removeItem = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id);
        save(next, false);
        return next;
      });
    },
    [save],
  );

  return { notes, addItem, updateItemText, removeItem };
}
