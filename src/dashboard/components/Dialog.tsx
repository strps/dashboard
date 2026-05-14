"use client";

import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  widthClass?: string;
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  widthClass = "max-w-2xl",
}: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`relative w-full ${widthClass} max-h-[85vh] rounded-xl border border-white/10 bg-neutral-900 shadow-2xl flex flex-col overflow-hidden`}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {title !== undefined && (
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
                <div className="text-sm text-white/80">{title}</div>
                <button
                  type="button"
                  aria-label="Close"
                  className="w-7 h-7 rounded-md text-white/40 hover:text-white/80 hover:bg-white/10 flex items-center justify-center"
                  onClick={onClose}
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
