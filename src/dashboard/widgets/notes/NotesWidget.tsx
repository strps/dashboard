import { BaseWidget } from "../base/BaseWidget";
import { useNotes } from "./useNotes";
import { registerWidget, type WidgetComponentProps } from "../registry";
import { useWidget } from "../base/useWidget";

export function NotesWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);
  const { content, setContent } = useNotes(id);

  return (
    <BaseWidget id={id} locked={locked} onRemove={onRemove}>
      <div className="h-full w-full rounded-xl bg-white/5">
        <textarea
          className="w-full h-full bg-transparent text-white/70 text-sm resize-none p-3 outline-none placeholder:text-white/20 font-mono rounded-xl"
          placeholder="Type your notes..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          readOnly={!locked}
        />
      </div>
    </BaseWidget>
  );
}

registerWidget("notes", {
  label: "Notes",
  defaultSize: { w: 4, h: 4 },
  minW: 2,
  minH: 2,
  component: NotesWidget,
});
