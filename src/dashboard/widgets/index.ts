// Import each widget to trigger registerWidget side effects
import "./clock/ClockWidget";
import "./stats/StatsWidget";
import "./notes/NotesWidget";
import "./weather/WeatherWidget";
import "./activitySelector/ActivitySelectorWidget";

export { WIDGET_REGISTRY } from "./registry";
export type { WidgetComponentProps, WidgetDefinition } from "./registry";
