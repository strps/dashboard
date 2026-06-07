"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Note } from "./schemas";

interface AddNotePopoverProps {
  /** Library notes not already shown in this widget. */
  available: Note[];
  /** Add an existing library note to this widget. */
  onAddExisting: (id: string) => void;
  /** Create a new library note (and add it to this widget). */
  onCreate: (title: string) => void | Promise<void>;
  disabled?: boolean;
}

export function AddNotePopover({
  available,
  onAddExisting,
  onCreate,
  disabled,
}: AddNotePopoverProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function create() {
    const t = title.trim();
    if (!t) return;
    void onCreate(t);
    setTitle("");
    setOpen(false);
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseDown={(e) => e.stopPropagation()}
        disabled={disabled}
        title="Add note"
        className="p-1 rounded-md text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus size={13} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 w-52 rounded-lg border border-white/10 bg-neutral-900 shadow-xl z-50 overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {available.length > 0 && (
            <div className="max-h-40 overflow-y-auto p-1 border-b border-white/10">
              <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-white/30">
                Add existing
              </p>
              {available.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    onAddExisting(n.id);
                    setOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs text-white/70 hover:bg-white/10 rounded-md truncate"
                >
                  {n.title}
                </button>
              ))}
            </div>
          )}

          <div className="p-2">
            <p className="px-0.5 pb-1 text-[10px] uppercase tracking-wider text-white/30">
              Create new
            </p>
            <div className="flex gap-1">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") create();
                  if (e.key === "Escape") setOpen(false);
                }}
                placeholder="Note name…"
                className="flex-1 min-w-0 rounded-md border border-white/10 bg-neutral-950 px-2 py-1 text-xs text-white/80 outline-none focus:border-white/30 placeholder:text-white/25"
              />
              <button
                type="button"
                onClick={create}
                disabled={!title.trim()}
                className="px-2 py-1 rounded-md bg-emerald-600/80 text-xs text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
