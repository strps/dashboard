import { StickyNote } from "lucide-react";

import { defineModule } from "../registry";
import { NotesTab } from "./config-pages/NotesTab";
import { notesWidget } from "./NotesWidget";

defineModule({
  id: "notes",
  label: "Notes",
  icon: StickyNote,
  widgets: [notesWidget],
  configPages: [
    {
      slug: "notes",
      label: "Notes",
      icon: StickyNote,
      component: NotesTab,
      description: "Manage your shared note library — create, rename, delete.",
    },
  ],
});

export {};
