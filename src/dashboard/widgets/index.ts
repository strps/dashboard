// Import each widget to trigger registerWidget side effects
import "./clock/ClockWidget";
import "./stats/StatsWidget";
import "./notes/NotesWidget";
import "./weather/WeatherWidget";
import "./activitySelector/ActivitySelectorWidget";
import "./cheatsheet/CheatsheetWidget";

export { WIDGET_REGISTRY } from "./registry";
export type { WidgetComponentProps, WidgetDefinition } from "./registry";
