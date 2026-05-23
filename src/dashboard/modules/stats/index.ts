import { BarChart3 } from "lucide-react";

import { defineModule } from "../registry";
import { statsWidget } from "./StatsWidget";

defineModule({
  id: "stats",
  label: "Stats",
  icon: BarChart3,
  widgets: [statsWidget],
});

export {};
