import { CloudSun } from "lucide-react";

import { defineModule } from "../registry";
import { weatherWidget } from "./WeatherWidget";

defineModule({
  id: "weather",
  label: "Weather",
  icon: CloudSun,
  widgets: [weatherWidget],
});

export {};
