"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { listEntriesAction, listTagsAction } from "./actions";
import type { CheatsheetEntry, CheatsheetTag } from "./schemas";

interface CheatsheetLibrary {
  entries: CheatsheetEntry[];
  tags: CheatsheetTag[];
  libraryHydrated: boolean;
}

const CheatsheetLibraryContext = createContext<CheatsheetLibrary | null>(null);

export function CheatsheetLibraryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<CheatsheetEntry[]>([]);
  const [tags, setTags] = useState<CheatsheetTag[]>([]);
  const [libraryHydrated, setLibraryHydrated] = useState(false);

  useEffect(() => {
    if (libraryHydrated) return;
    let cancelled = false;
    Promise.all([listEntriesAction(), listTagsAction()])
      .then(([e, t]) => {
        if (cancelled) return;
        setEntries(e);
        setTags(t);
        setLibraryHydrated(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLibraryHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [libraryHydrated]);

  return (
    <CheatsheetLibraryContext.Provider
      value={{ entries, tags, libraryHydrated }}
    >
      {children}
    </CheatsheetLibraryContext.Provider>
  );
}

export function useCheatsheetLibrary(): CheatsheetLibrary {
  const ctx = useContext(CheatsheetLibraryContext);
  if (!ctx) {
    throw new Error(
      "useCheatsheetLibrary must be used inside <CheatsheetLibraryProvider>",
    );
  }
  return ctx;
}
