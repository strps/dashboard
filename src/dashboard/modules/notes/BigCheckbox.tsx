"use client";

import { Check } from "lucide-react";

interface BigCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/**
 * Larger, top-aligned checkbox with a clear filled state + check icon. Used by
 * checklist note blocks for stronger visual feedback than a native checkbox.
 */
export function BigCheckbox({ checked, onToggle, disabled }: BigCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      onMouseDown={(e) => e.stopPropagation()}
      disabled={disabled}
      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        checked
          ? "border-emerald-400/70 bg-emerald-500/80 text-white"
          : "border-white/25 bg-white/5 text-transparent hover:border-white/50"
      }`}
    >
      <Check size={14} strokeWidth={3} />
    </button>
  );
}
