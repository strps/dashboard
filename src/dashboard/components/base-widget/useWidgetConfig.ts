import { useCallback } from "react";

import { useDashboardStore } from "../../store/dashboardStore";
import { WIDGET_REGISTRY } from "../../modules/registry";

/**
 * Read/write a widget instance's per-instance config. Config is stored on
 * `WidgetInstance.config` and persists with the grid state (localStorage + the
 * `dashboard_layout` JSONB row).
 *
 * The widget's `WidgetDefinition` must declare `configSchema` and
 * `defaultConfig`. The stored value is safe-parsed every read; on mismatch
 * (stale localStorage, older row) the default is returned.
 */
export function useWidgetConfig<T>(id: string): [T, (next: T) => void] {
  const instance = useDashboardStore((s) => s.instances.find((w) => w.id === id));
  const setWidgetConfig = useDashboardStore((s) => s.setWidgetConfig);

  const def = instance ? WIDGET_REGISTRY[instance.type] : undefined;
  const parsed = def?.configSchema?.safeParse(instance?.config);
  const value = (parsed?.success ? parsed.data : def?.defaultConfig) as T;

  const setConfig = useCallback(
    (next: T) => setWidgetConfig(id, next),
    [id, setWidgetConfig],
  );

  return [value, setConfig];
}
