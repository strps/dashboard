"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { BaseWidget } from "../../components/base-widget/BaseWidget";
import { useWidget } from "../../components/base-widget/useWidget";
import { useWidgetConfig } from "../../components/base-widget/useWidgetConfig";
import type { WidgetComponentProps, WidgetDefinition } from "../registry";
import { AddNotePopover } from "./AddNotePopover";
import { BigCheckbox } from "./BigCheckbox";
import { NotesLibraryProvider, useNotesLibrary } from "./notesLibraryContext";
import {
  type Note,
  type NoteBlock,
  type NotesConfig,
  defaultNotesConfig,
  notesConfigSchema,
} from "./schemas";

export function NotesWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);
  const interactive = locked;
  const lib = useNotesLibrary();
  const [config, setConfig] = useWidgetConfig<NotesConfig>(id);

  const blockRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  // Notes shown by this widget, in selection order (stale ids filtered out).
  const visibleNotes = config.noteIds
    .map((nid) => lib.notes.find((n) => n.id === nid))
    .filter((n): n is Note => Boolean(n));

  const activeNote =
    visibleNotes.find((n) => n.id === config.activeNoteId) ??
    visibleNotes[0] ??
    null;
  const blocks = activeNote?.blocks ?? [];

  const available = lib.notes.filter((n) => !config.noteIds.includes(n.id));

  // --- selection / tab config ---------------------------------------------
  const setActive = (noteId: string) =>
    setConfig({ ...config, activeNoteId: noteId });

  const addExisting = (noteId: string) => {
    if (config.noteIds.includes(noteId)) {
      setActive(noteId);
      return;
    }
    setConfig({ noteIds: [...config.noteIds, noteId], activeNoteId: noteId });
  };

  const createAndAdd = async (title: string) => {
    const created = await lib.createNote(title);
    setConfig({
      noteIds: [...config.noteIds, created.id],
      activeNoteId: created.id,
    });
  };

  const deselect = (noteId: string) => {
    const nextIds = config.noteIds.filter((x) => x !== noteId);
    const nextActive =
      config.activeNoteId === noteId
        ? (nextIds[0] ?? null)
        : config.activeNoteId;
    setConfig({ noteIds: nextIds, activeNoteId: nextActive });
  };

  // --- block edits (operate on the active note) ---------------------------
  const updateBlocks = (next: NoteBlock[], flush?: boolean) => {
    if (!activeNote) return;
    lib.updateNoteBlocks(activeNote.id, next, { flush });
  };

  const updateBlockText = (blockId: string, text: string) =>
    updateBlocks(blocks.map((b) => (b.id === blockId ? { ...b, text } : b)));

  const toggleChecklist = (blockId: string) =>
    updateBlocks(
      blocks.map((b) =>
        b.id === blockId && b.type === "checklist"
          ? { ...b, checked: !b.checked }
          : b,
      ),
      true,
    );

  const removeBlock = (blockId: string) =>
    updateBlocks(
      blocks.filter((b) => b.id !== blockId),
      true,
    );

  const appendBlock = (type: "text" | "checklist"): string => {
    const newBlock = makeBlock(type);
    updateBlocks([...blocks, newBlock], true);
    return newBlock.id;
  };

  const insertBlockAfter = (blockId: string, type: "text" | "checklist"): string => {
    const newBlock = makeBlock(type);
    const idx = blocks.findIndex((b) => b.id === blockId);
    const insertAt = idx === -1 ? blocks.length : idx + 1;
    updateBlocks(
      [...blocks.slice(0, insertAt), newBlock, ...blocks.slice(insertAt)],
      true,
    );
    return newBlock.id;
  };

  function focusBlock(blockId: string, caretToEnd = false) {
    requestAnimationFrame(() => {
      const el = blockRefs.current.get(blockId);
      if (!el) return;
      el.focus();
      if (caretToEnd) el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  function handleEnter(blockId: string, type: "text" | "checklist") {
    focusBlock(insertBlockAfter(blockId, type));
  }

  function handleBackspaceEmpty(blockId: string) {
    const idx = blocks.findIndex((b) => b.id === blockId);
    removeBlock(blockId);
    const prevId = idx > 0 ? blocks[idx - 1].id : null;
    if (prevId) focusBlock(prevId, true);
  }

  // Click empty body space → focus the last block, or start one if empty.
  function handleBodyClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!interactive || !activeNote) return;
    if (e.target !== e.currentTarget) return;
    const last = blocks[blocks.length - 1];
    if (last) focusBlock(last.id, true);
    else focusBlock(appendBlock("text"));
  }

  return (
    <BaseWidget id={id} locked={locked} onRemove={onRemove}>
      <div className="h-full w-full rounded-xl bg-white/5 flex flex-col">
        <div className="flex items-center gap-1 px-2 pt-2 pb-1">
          <NoteTabs
            notes={visibleNotes}
            activeId={activeNote?.id ?? null}
            interactive={interactive}
            onSwitch={setActive}
            onRename={lib.renameNote}
            onDeselect={deselect}
          />
          <AddNotePopover
            available={available}
            onAddExisting={addExisting}
            onCreate={createAndAdd}
            disabled={!interactive}
          />
        </div>

        <div
          className="flex-1 overflow-y-auto p-3 pt-1 space-y-2 cursor-text"
          onClick={handleBodyClick}
        >
          {!lib.hydrated && (
            <div className="pointer-events-none text-white/30 text-xs font-mono">
              Loading…
            </div>
          )}
          {lib.hydrated && !activeNote && (
            <div className="pointer-events-none text-white/20 text-sm font-mono">
              No note selected. Use the + button above to add or create a note.
            </div>
          )}
          {lib.hydrated && activeNote && blocks.length === 0 && (
            <div className="pointer-events-none text-white/20 text-sm font-mono">
              Click anywhere to start typing…
            </div>
          )}
          {blocks.map((block) => (
            <BlockRow
              key={block.id}
              block={block}
              interactive={interactive}
              onTextChange={(text) => updateBlockText(block.id, text)}
              onToggle={() => toggleChecklist(block.id)}
              onRemove={() => removeBlock(block.id)}
              onEnter={() => handleEnter(block.id, block.type)}
              onBackspaceEmpty={() => handleBackspaceEmpty(block.id)}
              textareaRefCallback={(el) => {
                if (el) blockRefs.current.set(block.id, el);
                else blockRefs.current.delete(block.id);
              }}
            />
          ))}
        </div>

        <div className="flex gap-2 p-2 border-t border-white/10">
          <button
            type="button"
            className="px-2 py-1 text-xs rounded bg-white/10 text-white/70 hover:bg-white/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => appendBlock("text")}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={!interactive || !activeNote}
          >
            + Text
          </button>
          <button
            type="button"
            className="px-2 py-1 text-xs rounded bg-white/10 text-white/70 hover:bg-white/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => appendBlock("checklist")}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={!interactive || !activeNote}
          >
            + Checklist
          </button>
        </div>
      </div>
    </BaseWidget>
  );
}

function makeBlock(type: "text" | "checklist"): NoteBlock {
  return type === "text"
    ? { id: crypto.randomUUID(), type: "text", text: "" }
    : { id: crypto.randomUUID(), type: "checklist", text: "", checked: false };
}

interface NoteTabsProps {
  notes: Note[];
  activeId: string | null;
  interactive: boolean;
  onSwitch: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDeselect: (id: string) => void;
}

function NoteTabs({
  notes,
  activeId,
  interactive,
  onSwitch,
  onRename,
  onDeselect,
}: NoteTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId) inputRef.current?.focus();
  }, [editingId]);

  function startEdit(note: Note, e: React.MouseEvent) {
    if (!interactive) return;
    e.stopPropagation();
    setEditingId(note.id);
    setEditValue(note.title);
  }

  function commitEdit() {
    if (editingId && editValue.trim()) onRename(editingId, editValue.trim());
    setEditingId(null);
  }

  return (
    <div className="flex items-center gap-1 flex-1 overflow-x-auto min-w-0">
      {notes.map((note) => (
        <div
          key={note.id}
          className={`group flex items-center gap-1 px-2 py-1 rounded-md text-xs select-none shrink-0 transition-colors ${
            interactive ? "cursor-pointer" : "cursor-default"
          } ${
            note.id === activeId
              ? "bg-white/15 text-white"
              : "text-white/50 hover:bg-white/10 hover:text-white/80"
          }`}
          onClick={() => {
            if (interactive && editingId !== note.id) onSwitch(note.id);
          }}
          onDoubleClick={(e) => startEdit(note, e)}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {editingId === note.id ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") setEditingId(null);
              }}
              className="bg-transparent outline-none w-24 text-white text-xs"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate max-w-32">{note.title}</span>
          )}
          {interactive && (
            <button
              type="button"
              className="opacity-0 group-hover:opacity-60 hover:opacity-100! transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDeselect(note.id);
              }}
              title="Remove from this widget"
            >
              <X size={10} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

interface BlockRowProps {
  block: NoteBlock;
  interactive: boolean;
  onTextChange: (text: string) => void;
  onToggle: () => void;
  onRemove: () => void;
  onEnter: () => void;
  onBackspaceEmpty: () => void;
  textareaRefCallback: (el: HTMLTextAreaElement | null) => void;
}

function BlockRow({
  block,
  interactive,
  onTextChange,
  onToggle,
  onRemove,
  onEnter,
  onBackspaceEmpty,
  textareaRefCallback,
}: BlockRowProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [block.text]);

  const setRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      textareaRefCallback(el);
    },
    [textareaRefCallback],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!interactive) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnter();
    } else if (e.key === "Backspace" && block.text === "") {
      e.preventDefault();
      onBackspaceEmpty();
    }
  }

  return (
    <div className="group flex items-start gap-2">
      {block.type === "checklist" && (
        <BigCheckbox
          checked={block.checked}
          onToggle={onToggle}
          disabled={!interactive}
        />
      )}
      <textarea
        ref={setRef}
        className={`flex-1 bg-transparent text-sm resize-none overflow-hidden outline-none placeholder:text-white/20 font-mono ${
          block.type === "checklist" && block.checked
            ? "text-white/30 line-through"
            : "text-white/70"
        }`}
        rows={1}
        placeholder={block.type === "text" ? "Paragraph…" : "Item…"}
        value={block.text}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onMouseDown={(e) => e.stopPropagation()}
        readOnly={!interactive}
      />
      <button
        type="button"
        aria-label="Remove block"
        className="mt-1 opacity-0 group-hover:opacity-100 text-white/40 hover:text-white text-xs disabled:opacity-0"
        onClick={onRemove}
        onMouseDown={(e) => e.stopPropagation()}
        disabled={!interactive}
      >
        ×
      </button>
    </div>
  );
}

export const notesWidget: WidgetDefinition<NotesConfig> = {
  type: "notes",
  label: "Notes",
  defaultSize: { w: 4, h: 4 },
  minW: 2,
  minH: 2,
  component: NotesWidget,
  provider: NotesLibraryProvider,
  configSchema: notesConfigSchema,
  defaultConfig: defaultNotesConfig,
};
