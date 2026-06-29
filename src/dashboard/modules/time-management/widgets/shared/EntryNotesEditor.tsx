"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";

import { useEntryNotes } from "./useEntryNotes";

const labelCls = "text-[10px] font-mono uppercase tracking-widest text-white/40";
const inputCls =
  "flex-1 bg-transparent text-sm text-white/70 outline-none placeholder:text-white/20 font-mono disabled:opacity-40";

/**
 * Per-entry free-text notes list. Renders one text input per note with add/remove
 * controls. Shared between the Calendar Properties and Activity Selector widgets.
 *
 * Keyboard behaviour mirrors the Notes widget: Enter inserts a new item below the
 * current one and focuses it; Backspace on an empty item removes it and focuses the
 * previous one.
 */
export function EntryNotesEditor({
  entryId,
  disabled = false,
  fill = false,
}: {
  entryId: string | null;
  disabled?: boolean;
  /**
   * Fill the parent height and keep the "Notes" header fixed while only the
   * items list scrolls. When false (default) the editor sizes to its content.
   */
  fill?: boolean;
}) {
  const { notes, addItem, insertItemAfter, updateItemText, removeItem } =
    useEntryNotes(entryId);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  function focusItem(id: string, caretToEnd = false) {
    requestAnimationFrame(() => {
      const el = inputRefs.current.get(id);
      if (!el) return;
      el.focus();
      if (caretToEnd) el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  function handleAdd() {
    focusItem(addItem());
  }

  function handleKeyDown(id: string, e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;
    if (e.key === "Enter") {
      e.preventDefault();
      focusItem(insertItemAfter(id));
    } else if (e.key === "Backspace" && e.currentTarget.value === "") {
      e.preventDefault();
      const idx = notes.findIndex((n) => n.id === id);
      const prevId = idx > 0 ? notes[idx - 1].id : null;
      removeItem(id);
      if (prevId) focusItem(prevId, true);
    }
  }

  return (
    <div className={`flex flex-col gap-1${fill ? " h-full min-h-0" : ""}`}>
      <div className="flex shrink-0 items-center justify-between">
        <span className={labelCls}>Notes</span>
        <button
          type="button"
          disabled={disabled}
          onMouseDown={stop}
          onClick={handleAdd}
          title="Add note"
          className="flex items-center gap-1 rounded px-1 py-0.5 text-[10px] text-white/40 hover:text-white/80 disabled:opacity-40"
        >
          <Plus size={11} />
          Add
        </button>
      </div>

      {notes.length === 0 ? (
        <span className="px-0.5 py-1 text-[11px] text-white/25">No notes yet.</span>
      ) : (
        <div
          className={`flex flex-col gap-1.5${fill ? " min-h-0 flex-1 overflow-y-auto" : ""}`}
        >
          {notes.map((n) => (
            <div key={n.id} className="group flex items-center gap-2">
              <input
                ref={(el) => {
                  if (el) inputRefs.current.set(n.id, el);
                  else inputRefs.current.delete(n.id);
                }}
                type="text"
                value={n.text}
                disabled={disabled}
                placeholder="Note…"
                onMouseDown={stop}
                onChange={(e) => updateItemText(n.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(n.id, e)}
                className={inputCls}
              />
              <button
                type="button"
                disabled={disabled}
                onMouseDown={stop}
                onClick={() => removeItem(n.id)}
                title="Remove note"
                aria-label="Remove note"
                className="shrink-0 opacity-0 group-hover:opacity-100 text-white/40 hover:text-white text-xs disabled:opacity-0"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
