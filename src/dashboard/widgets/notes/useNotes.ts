import { useNotesStore } from "./notesStore";

export function useNotes(id: string) {
  const content = useNotesStore((s) => s.notes[id] ?? "");
  const updateNote = useNotesStore((s) => s.updateNote);
  return { content, setContent: (v: string) => updateNote(id, v) };
}
