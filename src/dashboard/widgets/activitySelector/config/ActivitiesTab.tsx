import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useActivitySelector } from "../useActivitySelector";
import {
  type Activity,
  type ActivityFormValues,
  type ActivityTag,
  activityFormSchema,
} from "../schemas";

const DEFAULT_COLOR = "#10b981";

export function ActivitiesTab() {
  const { activities, tags, createActivity, updateActivity, deleteActivity, reorderActivities } =
    useActivitySelector();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const onDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const ids = activities.map((a) => a.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    setDragId(null);
    setDragOverId(null);
    try {
      await reorderActivities(ids);
    } catch (err) {
      console.error("Reorder failed", err);
    }
  };

  return (
    <div className="p-3 flex flex-col gap-3">
      {activities.length === 0 ? (
        <p className="text-xs text-white/40 px-1">
          No activities yet. Add one below to start tracking.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {activities.map((a) => (
            <li
              key={a.id}
              draggable={editingId !== a.id}
              onDragStart={() => setDragId(a.id)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverId(a.id);
              }}
              onDragLeave={() => setDragOverId((id) => (id === a.id ? null : id))}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(a.id);
              }}
              onDragEnd={() => {
                setDragId(null);
                setDragOverId(null);
              }}
              className={[
                "rounded-md border border-white/10 bg-white/5",
                dragOverId === a.id && dragId !== a.id ? "border-emerald-400/60" : "",
                dragId === a.id ? "opacity-50" : "",
              ].join(" ")}
            >
              {editingId === a.id ? (
                <ActivityForm
                  defaultValues={{ name: a.name, color: a.color, tagIds: a.tagIds }}
                  tags={tags}
                  submitLabel="Save"
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (values) => {
                    await updateActivity(a.id, values);
                    setEditingId(null);
                  }}
                />
              ) : (
                <ActivityRow
                  activity={a}
                  tags={tags}
                  onEdit={() => setEditingId(a.id)}
                  onDelete={async () => {
                    if (!confirm(`Delete "${a.name}"?`)) return;
                    await deleteActivity(a.id);
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-md border border-dashed border-white/10 bg-white/2 p-2">
        <p className="text-[10px] uppercase tracking-wider text-white/30 px-1 pb-1">
          Add activity
        </p>
        <ActivityForm
          defaultValues={{ name: "", color: DEFAULT_COLOR, tagIds: [] }}
          tags={tags}
          submitLabel="Add"
          onSubmit={async (values) => {
            await createActivity(values);
          }}
          resetOnSubmit
        />
      </div>
    </div>
  );
}

function ActivityRow({
  activity,
  tags,
  onEdit,
  onDelete,
}: {
  activity: Activity;
  tags: ActivityTag[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const activityTags = tags.filter((t) => activity.tagIds.includes(t.id));
  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <span className="text-white/30 cursor-grab select-none">⋮⋮</span>
      <span
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: activity.color }}
      />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-sm text-white/80 truncate">{activity.name}</span>
        {activityTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {activityTags.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: t.color ?? "#6366f1" }}
                />
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>
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

function ActivityForm({
  defaultValues,
  tags,
  submitLabel,
  onSubmit,
  onCancel,
  resetOnSubmit,
}: {
  defaultValues: ActivityFormValues;
  tags: ActivityTag[];
  submitLabel: string;
  onSubmit: (values: ActivityFormValues) => Promise<void>;
  onCancel?: () => void;
  resetOnSubmit?: boolean;
}) {
  const methods = useForm<ActivityFormValues>({
    resolver: zodResolver(activityFormSchema),
    defaultValues,
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = methods;

  const selectedTagIds = watch("tagIds");

  const toggleTag = (tagId: string) => {
    const next = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId];
    setValue("tagIds", next);
  };

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
          placeholder="Activity name"
          className="flex-1 rounded-md border border-white/10 bg-neutral-900 px-2 py-1.5 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:border-white/30"
          {...register("name")}
        />
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-1">
          {tags.map((t) => {
            const selected = selectedTagIds.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={[
                  "inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border transition-colors",
                  selected
                    ? "border-white/30 bg-white/15 text-white/80"
                    : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/60",
                ].join(" ")}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: t.color ?? "#6366f1" }}
                />
                {t.name}
              </button>
            );
          })}
        </div>
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
