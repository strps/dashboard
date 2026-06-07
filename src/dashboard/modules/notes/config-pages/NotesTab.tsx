"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import {
  createNoteAction,
  deleteNoteAction,
  listNotesAction,
  renameNoteAction,
} from "../actions";
import type { Note } from "../schemas";

export function NotesTab() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    let cancelled = false;
    listNotesAction()
      .then((rows) => {
        if (cancelled) return;
        setNotes(rows);
        setHydrated(true);
      })
      .catch(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function create() {
    const title = newTitle.trim();
    if (!title) return;
    const created = await createNoteAction(title);
    setNotes((prev) => [...prev, created]);
    setNewTitle("");
  }

  async function rename(id: string) {
    const title = editValue.trim();
    if (title) {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, title } : n)));
      await renameNoteAction(id, title);
    }
    setEditingId(null);
  }

  async function remove(note: Note) {
    if (!confirm(`Delete "${note.title}"? This removes it from all widgets.`))
      return;
    setNotes((prev) => prev.filter((n) => n.id !== note.id));
    await deleteNoteAction(note.id);
  }

  return (
    <div className="p-3 flex flex-col gap-3">
      <p className="text-xs text-white/40 px-1">
        Notes are shared across every Notes widget. Each widget picks which notes
        to show via its <span className="text-white/60">+</span> button.
      </p>

      {hydrated && notes.length === 0 ? (
        <p className="text-xs text-white/40 px-1">
          No notes yet. Create one below.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-md border border-white/10 bg-white/5 flex items-center gap-2 px-2 py-2"
            >
              {editingId === n.id ? (
                <>
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") rename(n.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 min-w-0 rounded-md border border-white/10 bg-neutral-900 px-2 py-1 text-sm text-white/90 outline-none focus:border-white/30"
                  />
                  <button
                    type="button"
                    onClick={() => rename(n.id)}
                    className="text-emerald-300/70 hover:text-emerald-300 p-1"
                    title="Save"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-white/40 hover:text-white/80 p-1"
                    title="Cancel"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 min-w-0 text-sm text-white/80 truncate">
                    {n.title}
                  </span>
                  <span className="text-[10px] text-white/30 shrink-0">
                    {n.blocks.length} block{n.blocks.length === 1 ? "" : "s"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(n.id);
                      setEditValue(n.title);
                    }}
                    className="text-white/40 hover:text-white/80 p-1"
                    title="Rename"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(n)}
                    className="text-rose-300/60 hover:text-rose-300 p-1"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-md border border-dashed border-white/10 bg-white/2 p-2 flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") create();
          }}
          placeholder="New note name…"
          className="flex-1 min-w-0 rounded-md border border-white/10 bg-neutral-900 px-2 py-1.5 text-sm text-white/90 placeholder-white/30 outline-none focus:border-white/30"
        />
        <button
          type="button"
          onClick={create}
          disabled={!newTitle.trim()}
          className="flex items-center gap-1 text-xs text-white bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded-md"
        >
          <Plus size={13} />
          Add
        </button>
      </div>
    </div>
  );
}
