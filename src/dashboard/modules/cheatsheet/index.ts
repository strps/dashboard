import { BookOpen } from "lucide-react";

import { defineModule } from "../registry";
import { cheatsheetWidget } from "./CheatsheetWidget";

defineModule({
  id: "cheatsheet",
  label: "Cheatsheet",
  icon: BookOpen,
  widgets: [cheatsheetWidget],
  // Cheatsheet settings (entries + tags) currently live at /settings/cheatsheet
  // as a legacy route. Migrate them into configPages here when ready.
});

export {};
