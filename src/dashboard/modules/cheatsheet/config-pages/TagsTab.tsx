"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";

import { Dialog } from "@/dashboard/components/Dialog";
import {
  createTagAction,
  deleteTagAction,
  updateTagAction,
} from "../actions";
import {
  tagInputSchema,
  type CheatsheetEntry,
  type CheatsheetTag,
  type CheatsheetTagInput,
} from "../schemas";

import type {
  EntryOptimisticAction,
  TagOptimisticAction,
} from "./CheatsheetManager";

interface TagsTabProps {
  tags: CheatsheetTag[];
  setTags: React.Dispatch<React.SetStateAction<CheatsheetTag[]>>;
  setEntries: React.Dispatch<React.SetStateAction<CheatsheetEntry[]>>;
  applyTagOptimistic: (action: TagOptimisticAction) => void;
  applyEntryOptimistic: (action: EntryOptimisticAction) => void;
}

interface TagNode {
  tag: CheatsheetTag;
  children: TagNode[];
}

function buildTree(tags: CheatsheetTag[]): TagNode[] {
  const byId = new Map<string, TagNode>();
  for (const t of tags) byId.set(t.id, { tag: t, children: [] });
  const roots: TagNode[] = [];
  for (const node of byId.values()) {
    const parentId = node.tag.parentId;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const sortFn = (a: TagNode, b: TagNode) =>
    a.tag.name.localeCompare(b.tag.name);
  const sortRec = (nodes: TagNode[]) => {
    nodes.sort(sortFn);
    for (const n of nodes) sortRec(n.children);
  };
  sortRec(roots);
  return roots;
}

function descendantsOf(tagId: string, tags: CheatsheetTag[]): Set<string> {
  const result = new Set<string>([tagId]);
  let added = true;
  while (added) {
    added = false;
    for (const t of tags) {
      if (t.parentId && result.has(t.parentId) && !result.has(t.id)) {
        result.add(t.id);
        added = true;
      }
    }
  }
  return result;
}

export function TagsTab({
  tags,
  setTags,
  setEntries,
  applyTagOptimistic,
  applyEntryOptimistic,
}: TagsTabProps) {
  const [editing, setEditing] = useState<CheatsheetTag | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  const tree = useMemo(() => buildTree(tags), [tags]);

  const onDelete = (id: string) => {
    if (
      !window.confirm(
        "Delete this tag? Child tags will be moved to the top level and the tag will be removed from all entries.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      applyTagOptimistic({ type: "delete", id });
      applyEntryOptimistic({ type: "strip-tag", tagId: id });
      try {
        await deleteTagAction(id);
        setTags((prev) =>
          prev
            .filter((t) => t.id !== id)
            .map((t) => (t.parentId === id ? { ...t, parentId: null } : t)),
        );
        setEntries((prev) =>
          prev.map((e) =>
            e.tagIds.includes(id)
              ? { ...e, tagIds: e.tagIds.filter((t) => t !== id) }
              : e,
          ),
        );
      } catch {
        // optimistic updates discarded on transition end
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">
          Tags can be nested. Filtering a parent tag also matches its
          descendants.
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          disabled={pending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600/80 text-xs text-white hover:bg-emerald-500 disabled:opacity-40"
        >
          <Plus size={12} />
          New tag
        </button>
      </div>

      {tree.length === 0 ? (
        <div className="px-3 py-8 text-center text-xs text-white/40">
          No tags yet.
        </div>
      ) : (
        <div className="rounded-md border border-white/10 overflow-hidden">
          <ul className="divide-y divide-white/5">
            {tree.map((node) => (
              <TagRow
                key={node.tag.id}
                node={node}
                depth={0}
                onEdit={setEditing}
                onDelete={onDelete}
                pending={pending}
              />
            ))}
          </ul>
        </div>
      )}

      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        title="New tag"
      >
        {creating && (
          <TagForm
            tags={tags}
            onCancel={() => setCreating(false)}
            onSubmit={(values) =>
              startTransition(async () => {
                const placeholder: CheatsheetTag = {
                  id: `optimistic-${crypto.randomUUID()}`,
                  ...values,
                };
                applyTagOptimistic({ type: "create", tag: placeholder });
                setCreating(false);
                try {
                  const created = await createTagAction(values);
                  setTags((prev) =>
                    [...prev, created].sort((a, b) =>
                      a.name.localeCompare(b.name),
                    ),
                  );
                } catch {
                  // optimistic add discarded on transition end
                }
              })
            }
            submitting={pending}
          />
        )}
      </Dialog>

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit tag"
      >
        {editing && (
          <TagForm
            tags={tags}
            initial={editing}
            onCancel={() => setEditing(null)}
            onSubmit={(values) =>
              startTransition(async () => {
                const optimistic: CheatsheetTag = { ...editing, ...values };
                applyTagOptimistic({ type: "update", tag: optimistic });
                setEditing(null);
                try {
                  const updated = await updateTagAction(editing.id, values);
                  setTags((prev) =>
                    prev.map((t) => (t.id === updated.id ? updated : t)),
                  );
                } catch {
                  // optimistic update discarded on transition end
                }
              })
            }
            submitting={pending}
          />
        )}
      </Dialog>
    </div>
  );
}

interface TagRowProps {
  node: TagNode;
  depth: number;
  onEdit: (tag: CheatsheetTag) => void;
  onDelete: (id: string) => void;
  pending: boolean;
}

function TagRow({ node, depth, onEdit, onDelete, pending }: TagRowProps) {
  const indent = depth * 16;
  return (
    <>
      <li
        className="flex items-center gap-2 px-3 py-2 hover:bg-white/[0.02]"
        style={{ paddingLeft: 12 + indent }}
      >
        {depth > 0 && (
          <ChevronRight size={12} className="text-white/30 shrink-0" />
        )}
        {node.tag.color && (
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
            style={{ backgroundColor: node.tag.color }}
          />
        )}
        <span className="flex-1 text-xs text-white/85 truncate">
          {node.tag.name}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onEdit(node.tag)}
            disabled={pending}
            title="Edit"
            className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10"
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(node.tag.id)}
            disabled={pending}
            title="Delete"
            className="p-1.5 rounded text-white/50 hover:text-red-400 hover:bg-white/10"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </li>
      {node.children.map((child) => (
        <TagRow
          key={child.tag.id}
          node={child}
          depth={depth + 1}
          onEdit={onEdit}
          onDelete={onDelete}
          pending={pending}
        />
      ))}
    </>
  );
}

interface TagFormProps {
  tags: CheatsheetTag[];
  initial?: CheatsheetTag;
  onSubmit: (values: CheatsheetTagInput) => void;
  onCancel: () => void;
  submitting: boolean;
}

function TagForm({
  tags,
  initial,
  onSubmit,
  onCancel,
  submitting,
}: TagFormProps) {
  const { register, handleSubmit, formState, watch, setValue } = useForm<
    CheatsheetTagInput
  >({
    resolver: zodResolver(tagInputSchema),
    defaultValues: {
      name: initial?.name ?? "",
      parentId: initial?.parentId ?? null,
      color: initial?.color ?? null,
    },
  });

  const colorValue = watch("color");

  // Disallow selecting self or any descendant as parent (would create a cycle).
  const forbiddenParentIds = useMemo(
    () => (initial ? descendantsOf(initial.id, tags) : new Set<string>()),
    [initial, tags],
  );
  const parentOptions = useMemo(
    () => tags.filter((t) => !forbiddenParentIds.has(t.id)),
    [tags, forbiddenParentIds],
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col h-full overflow-hidden"
    >
      <div className="flex-1 min-h-0 overflow-auto p-5 space-y-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-white/50">
            Name
          </span>
          <input
            type="text"
            {...register("name")}
            placeholder="git"
            className="w-full rounded-md border border-white/10 bg-neutral-950 px-2.5 py-1.5 text-sm text-white/85 outline-none focus:border-white/30"
          />
          {formState.errors.name && (
            <span className="text-[11px] text-red-400">
              {formState.errors.name.message}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-white/50">
            Parent tag
          </span>
          <select
            {...register("parentId", {
              setValueAs: (v) => (v === "" ? null : v),
            })}
            className="w-full rounded-md border border-white/10 bg-neutral-950 px-2.5 py-1.5 text-sm text-white/85 outline-none focus:border-white/30"
          >
            <option value="">— Top level —</option>
            {parentOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-white/50">
            Color
          </span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorValue ?? "#a3e635"}
              onChange={(e) =>
                setValue("color", e.target.value, { shouldDirty: true })
              }
              className="h-8 w-12 rounded border border-white/10 bg-neutral-950"
            />
            <span className="font-mono text-xs text-white/60">
              {colorValue ?? "(inherit)"}
            </span>
            {colorValue && (
              <button
                type="button"
                onClick={() =>
                  setValue("color", null, { shouldDirty: true })
                }
                className="text-[11px] text-white/40 hover:text-white/80 underline"
              >
                clear
              </button>
            )}
          </div>
          {formState.errors.color && (
            <span className="text-[11px] text-red-400">
              {formState.errors.color.message}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-white/10 bg-white/[0.02]">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-3 py-1.5 rounded-md text-xs text-white/60 hover:text-white hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-3 py-1.5 rounded-md bg-emerald-600/80 text-xs text-white hover:bg-emerald-500 disabled:opacity-40"
        >
          {initial ? "Save changes" : "Create tag"}
        </button>
      </div>
    </form>
  );
}
