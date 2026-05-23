import { StickyNote } from "lucide-react";

import { defineModule } from "../registry";
import { notesWidget } from "./NotesWidget";

defineModule({
  id: "notes",
  label: "Notes",
  icon: StickyNote,
  widgets: [notesWidget],
});

export {};
