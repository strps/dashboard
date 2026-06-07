import { BookOpen } from "lucide-react";

import { defineModule } from "../registry";
import { CheatsheetTab } from "./config-pages/CheatsheetTab";
import { cheatsheetWidget } from "./CheatsheetWidget";

defineModule({
  id: "cheatsheet",
  label: "Cheatsheet",
  icon: BookOpen,
  widgets: [cheatsheetWidget],
  configPages: [
    {
      slug: "cheatsheet",
      label: "Cheatsheet",
      icon: BookOpen,
      component: CheatsheetTab,
      description:
        "Manage entries and tags. These are shared across every cheatsheet widget on your dashboard. Use the gear icon on a widget to pick which tags appear as filter buttons there.",
    },
  ],
});

export {};
