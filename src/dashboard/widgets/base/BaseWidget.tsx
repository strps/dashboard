import type { ReactNode } from "react";

interface WidgetProps {
  id: string;
  locked: boolean;
  onRemove: (id: string) => void;
  children?: ReactNode;
}

export function BaseWidget({ id, locked, onRemove, children }: WidgetProps) {
  if (locked) {
    return <div className="h-full w-full">{children}</div>;
  }

  return (
    <div className="relative h-full w-full rounded-xl border border-dashed border-white/30 drag-handle cursor-move">
      <div className="h-full w-full overflow-hidden rounded-xl">{children}</div>
      <button
        type="button"
        aria-label="Remove widget"
        className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-red-800 border border-white/40 text-white/70 hover:text-white hover:border-white/70 text-xs leading-none flex items-center justify-center"
        onClick={() => onRemove(id)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        ×
      </button>
    </div>
  );
}
