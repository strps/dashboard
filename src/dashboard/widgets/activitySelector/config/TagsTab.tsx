import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useActivitySelector } from "../useActivitySelector";
import {
  type ActivityTag,
  type ActivityTagInput,
  activityTagInputSchema,
} from "../schemas";

const DEFAULT_COLOR = "#6366f1";

export function TagsTab() {
  const { tags, createTag, updateTag, deleteTag } = useActivitySelector();
  const [editingId, setEditingId] = useState<string | null>(null);

  const rootTags = tags.filter((t) => t.parentId === null);
  const childrenOf = (parentId: string) => tags.filter((t) => t.parentId === parentId);

  function renderTag(tag: ActivityTag, depth = 0) {
    const children = childrenOf(tag.id);
    return (
      <div key={tag.id}>
        <div
          className={[
            "rounded-md border border-white/10 bg-white/5",
            depth > 0 ? "ml-5" : "",
          ].join(" ")}
        >
          {editingId === tag.id ? (
            <TagForm
              defaultValues={{
                name: tag.name,
                parentId: tag.parentId,
                color: tag.color,
              }}
              tags={tags}
              excludeId={tag.id}
              submitLabel="Save"
              onCancel={() => setEditingId(null)}
              onSubmit={async (values) => {
                await updateTag(tag.id, values);
                setEditingId(null);
              }}
            />
          ) : (
            <TagRow
              tag={tag}
              onEdit={() => setEditingId(tag.id)}
              onDelete={async () => {
                if (!confirm(`Delete "${tag.name}"? Child tags will become top-level.`)) return;
                await deleteTag(tag.id);
              }}
            />
          )}
        </div>
        {children.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            {children.map((c) => renderTag(c, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-3 flex flex-col gap-3">
      {tags.length === 0 ? (
        <p className="text-xs text-white/40 px-1">
          No tags yet. Add one below to categorize your activities.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {rootTags.map((t) => renderTag(t))}
        </div>
      )}

      <div className="rounded-md border border-dashed border-white/10 bg-white/[0.02] p-2">
        <p className="text-[10px] uppercase tracking-wider text-white/30 px-1 pb-1">
          Add tag
        </p>
        <TagForm
          defaultValues={{ name: "", parentId: null, color: DEFAULT_COLOR }}
          tags={tags}
          submitLabel="Add"
          onSubmit={async (values) => {
            await createTag(values);
          }}
          resetOnSubmit
        />
      </div>
    </div>
  );
}

function TagRow({
  tag,
  onEdit,
  onDelete,
}: {
  tag: ActivityTag;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: tag.color ?? "#6366f1" }}
      />
      <span className="flex-1 text-sm text-white/80 truncate">{tag.name}</span>
      <button
        type="button"
        className="text-xs text-white/40 hover:text-white/80 px-2 py-1"
        onClick={onEdit}
      >
        Edit
      </button>
      <button
        type="button"
        className="text-xs text-rose-300/60 hover:text-rose-300 px-2 py-1"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  );
}

function TagForm({
  defaultValues,
  tags,
  excludeId,
  submitLabel,
  onSubmit,
  onCancel,
  resetOnSubmit,
}: {
  defaultValues: ActivityTagInput;
  tags: ActivityTag[];
  excludeId?: string;
  submitLabel: string;
  onSubmit: (values: ActivityTagInput) => Promise<void>;
  onCancel?: () => void;
  resetOnSubmit?: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ActivityTagInput>({
    resolver: zodResolver(activityTagInputSchema),
    defaultValues,
  });

  const parentOptions = tags.filter((t) => t.id !== excludeId);

  return (
    <form
      className="flex flex-col gap-2 p-1"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
        if (resetOnSubmit) reset(defaultValues);
      })}
    >
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="w-8 h-8 rounded bg-transparent border border-white/10 shrink-0 cursor-pointer"
          {...register("color")}
        />
        <input
          type="text"
          placeholder="Tag name"
          className="flex-1 rounded-md border border-white/10 bg-neutral-900 px-2 py-1.5 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:border-white/30"
          {...register("name")}
        />
      </div>
      {parentOptions.length > 0 && (
        <select
          className="w-full rounded-md border border-white/10 bg-neutral-900 px-2 py-1.5 text-sm text-white/70 focus:outline-none focus:border-white/30"
          {...register("parentId")}
        >
          <option value="">No parent (top-level)</option>
          {parentOptions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}
      {(errors.name || errors.color) && (
        <p className="text-[11px] text-rose-300/80">
          {errors.name?.message ?? errors.color?.message}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            className="text-xs text-white/40 hover:text-white/80 px-2 py-1"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="text-xs text-white bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 px-3 py-1 rounded-md"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
