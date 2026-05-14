import { useCallback, useEffect, useRef } from "react";

import { BaseWidget } from "../base/BaseWidget";
import { useWidget } from "../base/useWidget";
import { registerWidget, type WidgetComponentProps } from "../registry";
import { useNotes } from "./useNotes";
import type { NoteBlock } from "./schemas";

export function NotesWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);
  const {
    blocks,
    hydrated,
    addTextBlock,
    addChecklistBlock,
    updateBlockText,
    toggleChecklistBlock,
    removeBlock,
    insertBlockAfter,
  } = useNotes(id);

  const interactive = locked;
  const blockRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  function handleEnter(blockId: string, type: "text" | "checklist") {
    const newId = insertBlockAfter(blockId, type);
    requestAnimationFrame(() => {
      blockRefs.current.get(newId)?.focus();
    });
  }

  function handleBackspaceEmpty(blockId: string) {
    const idx = blocks.findIndex((b) => b.id === blockId);
    removeBlock(blockId);
    const prevId = idx > 0 ? blocks[idx - 1].id : null;
    if (prevId) {
      requestAnimationFrame(() => {
        const el = blockRefs.current.get(prevId);
        if (!el) return;
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      });
    }
  }

  return (
    <BaseWidget id={id} locked={locked} onRemove={onRemove}>
      <div className="h-full w-full rounded-xl bg-white/5 flex flex-col">
        <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">Notes</div>
        <div className="flex-1 overflow-y-auto p-3 pt-1 space-y-2">
          {!hydrated && (
            <div className="text-white/30 text-xs font-mono">Loading…</div>
          )}
          {hydrated && blocks.length === 0 && (
            <div className="text-white/20 text-sm font-mono">
              No notes yet. Use the buttons below to add a paragraph or
              checklist item.
            </div>
          )}
          {blocks.map((block) => (
            <BlockRow
              key={block.id}
              block={block}
              interactive={interactive}
              onTextChange={(text) => updateBlockText(block.id, text)}
              onToggle={() => toggleChecklistBlock(block.id)}
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
            onClick={addTextBlock}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={!interactive}
          >
            + Text
          </button>
          <button
            type="button"
            className="px-2 py-1 text-xs rounded bg-white/10 text-white/70 hover:bg-white/20 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={addChecklistBlock}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={!interactive}
          >
            + Checklist
          </button>
        </div>
      </div>
    </BaseWidget>
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
        <input
          type="checkbox"
          className="mt-1.5 cursor-pointer accent-white/70 disabled:cursor-not-allowed"
          checked={block.checked}
          onChange={onToggle}
          onMouseDown={(e) => e.stopPropagation()}
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

registerWidget("notes", {
  label: "Notes",
  defaultSize: { w: 4, h: 4 },
  minW: 2,
  minH: 2,
  component: NotesWidget,
});
