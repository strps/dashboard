"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Dialog } from "@/dashboard/components/Dialog";
import {
  createEntryAction,
  deleteEntryAction,
  updateEntryAction,
} from "@/dashboard/modules/cheatsheet/actions";
import {
  entryInputSchema,
  type CheatsheetEntry,
  type CheatsheetEntryInput,
  type CheatsheetTag,
} from "@/dashboard/modules/cheatsheet/schemas";

import type { EntryOptimisticAction } from "./CheatsheetManager";

interface EntriesTabProps {
  entries: CheatsheetEntry[];
  tags: CheatsheetTag[];
  setEntries: React.Dispatch<React.SetStateAction<CheatsheetEntry[]>>;
  applyOptimistic: (action: EntryOptimisticAction) => void;
}

export function EntriesTab({
  entries,
  tags,
  setEntries,
  applyOptimistic,
}: EntriesTabProps) {
  const [editing, setEditing] = useState<CheatsheetEntry | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  const tagsById = useMemo(() => {
    const map = new Map<string, CheatsheetTag>();
    for (const t of tags) map.set(t.id, t);
    return map;
  }, [tags]);

  const onDelete = (id: string) => {
    if (!window.confirm("Delete this entry?")) return;
    startTransition(async () => {
      applyOptimistic({ type: "delete", id });
      try {
        await deleteEntryAction(id);
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } catch {
        // optimistic update is discarded when the transition ends
      }
    });
  };

  const sorted = useMemo(
    () =>
      [...entries].sort(
        (a, b) => b.priority - a.priority || a.title.localeCompare(b.title),
      ),
    [entries],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/50">
          Higher priority entries appear first in the widget.
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          disabled={pending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600/80 text-xs text-white hover:bg-emerald-500 disabled:opacity-40"
        >
          <Plus size={12} />
          New entry
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="px-3 py-8 text-center text-xs text-white/40">
          No entries yet.
        </div>
      ) : (
        <div className="rounded-md border border-white/10 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-white/[0.02] text-white/50">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Title</th>
                <th className="text-left px-3 py-2 font-medium">Syntax</th>
                <th className="text-left px-3 py-2 font-medium">Tags</th>
                <th className="text-right px-3 py-2 font-medium w-16">
                  Priority
                </th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sorted.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/[0.02]">
                  <td className="px-3 py-2 text-white/85 align-top">
                    {entry.title}
                  </td>
                  <td className="px-3 py-2 align-top font-mono text-emerald-300/80 max-w-[220px] truncate">
                    {entry.syntax.split("\n")[0]}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex flex-wrap gap-1">
                      {entry.tagIds.map((id) => {
                        const t = tagsById.get(id);
                        if (!t) return null;
                        return (
                          <span
                            key={id}
                            className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-white/60"
                            style={
                              t.color
                                ? { borderColor: t.color, color: t.color }
                                : undefined
                            }
                          >
                            {t.name}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-white/60 align-top">
                    {entry.priority}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(entry)}
                        disabled={pending}
                        title="Edit"
                        className="p-1.5 rounded text-white/50 hover:text-white hover:bg-white/10"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(entry.id)}
                        disabled={pending}
                        title="Delete"
                        className="p-1.5 rounded text-white/50 hover:text-red-400 hover:bg-white/10"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={creating}
        onClose={() => setCreating(false)}
        title="New entry"
      >
        {creating && (
          <EntryForm
            tags={tags}
            onCancel={() => setCreating(false)}
            onSubmit={(values) =>
              startTransition(async () => {
                const placeholder: CheatsheetEntry = {
                  id: `optimistic-${crypto.randomUUID()}`,
                  ...values,
                };
                applyOptimistic({ type: "create", entry: placeholder });
                setCreating(false);
                try {
                  const created = await createEntryAction(values);
                  setEntries((prev) => [created, ...prev]);
                } catch {
                  // optimistic add is discarded on transition end
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
        title="Edit entry"
      >
        {editing && (
          <EntryForm
            tags={tags}
            initial={editing}
            onCancel={() => setEditing(null)}
            onSubmit={(values) =>
              startTransition(async () => {
                const optimistic: CheatsheetEntry = {
                  ...editing,
                  ...values,
                };
                applyOptimistic({ type: "update", entry: optimistic });
                setEditing(null);
                try {
                  const updated = await updateEntryAction(editing.id, values);
                  setEntries((prev) =>
                    prev.map((e) => (e.id === updated.id ? updated : e)),
                  );
                } catch {
                  // optimistic update is discarded on transition end
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

interface EntryFormProps {
  tags: CheatsheetTag[];
  initial?: CheatsheetEntry;
  onSubmit: (values: CheatsheetEntryInput) => void;
  onCancel: () => void;
  submitting: boolean;
}

function EntryForm({
  tags,
  initial,
  onSubmit,
  onCancel,
  submitting,
}: EntryFormProps) {
  const { register, handleSubmit, control, formState } =
    useForm<CheatsheetEntryInput>({
      resolver: zodResolver(entryInputSchema),
      defaultValues: {
        title: initial?.title ?? "",
        syntax: initial?.syntax ?? "",
        description: initial?.description ?? "",
        priority: initial?.priority ?? 0,
        tagIds: initial?.tagIds ?? [],
      },
    });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col h-full overflow-hidden"
    >
      <div className="flex-1 min-h-0 overflow-auto p-5 space-y-3">
        <Field
          label="Title"
          error={formState.errors.title?.message}
        >
          <input
            type="text"
            {...register("title")}
            placeholder="Git: stash untracked files"
            className="w-full rounded-md border border-white/10 bg-neutral-950 px-2.5 py-1.5 text-sm text-white/85 outline-none focus:border-white/30"
          />
        </Field>

        <Field
          label="Syntax / code"
          error={formState.errors.syntax?.message}
        >
          <textarea
            {...register("syntax")}
            rows={5}
            placeholder="git stash -u"
            className="w-full rounded-md border border-white/10 bg-neutral-950 px-2.5 py-1.5 text-sm font-mono text-emerald-300/90 outline-none focus:border-white/30 resize-y"
          />
        </Field>

        <Field
          label="Description"
          error={formState.errors.description?.message}
        >
          <textarea
            {...register("description")}
            rows={2}
            placeholder="Includes untracked files in the stash."
            className="w-full rounded-md border border-white/10 bg-neutral-950 px-2.5 py-1.5 text-sm text-white/80 outline-none focus:border-white/30 resize-y"
          />
        </Field>

        <Field
          label="Priority"
          hint="Higher number shows higher in lists. Default 0."
          error={formState.errors.priority?.message}
        >
          <input
            type="number"
            {...register("priority", { valueAsNumber: true })}
            className="w-24 rounded-md border border-white/10 bg-neutral-950 px-2.5 py-1.5 text-sm text-white/80 outline-none focus:border-white/30"
          />
        </Field>

        <Field
          label="Tags"
          hint={
            tags.length === 0
              ? "No tags yet — switch to the Tags tab to create some."
              : undefined
          }
          error={formState.errors.tagIds?.message}
        >
          <Controller
            control={control}
            name="tagIds"
            render={({ field }) => (
              <TagMultiSelect
                tags={tags}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </Field>
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
          {initial ? "Save changes" : "Create entry"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] uppercase tracking-wide text-white/50">
        {label}
      </span>
      {children}
      {hint && !error && (
        <span className="text-[11px] text-white/40">{hint}</span>
      )}
      {error && <span className="text-[11px] text-red-400">{error}</span>}
    </label>
  );
}

interface TagMultiSelectProps {
  tags: CheatsheetTag[];
  value: string[];
  onChange: (next: string[]) => void;
}

function TagMultiSelect({ tags, value, onChange }: TagMultiSelectProps) {
  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };
  if (tags.length === 0) {
    return (
      <div className="text-xs text-white/40 italic px-1 py-1">
        No tags available.
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => {
        const active = value.includes(t.id);
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => toggle(t.id)}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
              active
                ? "border-white/60 text-white bg-white/10"
                : "border-white/10 text-white/55 hover:border-white/30"
            }`}
            style={
              active && t.color
                ? { borderColor: t.color, color: t.color }
                : undefined
            }
          >
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
