"use client";

import { Plus, X } from "lucide-react";

import { useEntryNotes } from "./useEntryNotes";

const labelCls = "text-[10px] font-mono uppercase tracking-widest text-white/40";
const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white outline-none focus:border-white/30 disabled:opacity-40";

/**
 * Per-entry free-text notes list. Renders one text input per note with add/remove
 * controls. Shared between the Calendar Properties and Activity Selector widgets.
 */
export function EntryNotesEditor({
  entryId,
  disabled = false,
}: {
  entryId: string | null;
  disabled?: boolean;
}) {
  const { notes, addItem, updateItemText, removeItem } = useEntryNotes(entryId);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className={labelCls}>Notes</span>
        <button
          type="button"
          disabled={disabled}
          onMouseDown={stop}
          onClick={addItem}
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
        <div className="flex flex-col gap-1.5">
          {notes.map((n) => (
            <div key={n.id} className="flex items-center gap-1.5">
              <input
                type="text"
                value={n.text}
                disabled={disabled}
                placeholder="Note…"
                onMouseDown={stop}
                onChange={(e) => updateItemText(n.id, e.target.value)}
                className={inputCls}
              />
              <button
                type="button"
                disabled={disabled}
                onMouseDown={stop}
                onClick={() => removeItem(n.id)}
                title="Remove note"
                className="shrink-0 rounded p-1 text-white/30 hover:text-red-300 disabled:opacity-40"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
