import type { ComponentType, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { ZodType } from "zod";
import type { WidgetType } from "../store/dashboardStore";

export interface WidgetComponentProps {
  id: string;
}

export interface WidgetConfigDialogProps {
  widgetId: string;
  onClose: () => void;
}

export interface WidgetDefinition<TConfig = unknown> {
  /** Stable identifier — must match a value in the WidgetType union. */
  type: WidgetType;
  label: string;
  defaultSize: { w: number; h: number };
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  component: ComponentType<WidgetComponentProps>;
  /**
   * Optional per-instance configuration UI. Rendered inside a Dialog when the
   * user clicks the gear icon on the widget. The component is responsible for
   * its own form/state and calls `onClose` to dismiss.
   */
  configDialog?: ComponentType<WidgetConfigDialogProps>;
  /**
   * Optional shared provider mounted around the dashboard grid when at least
   * one instance of this widget type is present. Use for per-user state shared
   * across multiple instances (e.g. cheatsheet library).
   */
  provider?: ComponentType<{ children: ReactNode }>;
  /**
   * Optional zod schema describing the per-instance config persisted with the
   * grid state (in `WidgetInstance.config`). When declared together with
   * `defaultConfig`, widgets read/write config via `useWidgetConfig(id)`. The
   * schema is used to safe-parse stored values, falling back to `defaultConfig`
   * on mismatch (handles stale localStorage / older rows).
   */
  configSchema?: ZodType<TConfig>;
  /** Default value returned by `useWidgetConfig` when no config is stored. */
  defaultConfig?: TConfig;
}

export interface ConfigPageDefinition {
  /** URL slug under /settings/<module-id>/<slug>. */
  slug: string;
  label: string;
  icon?: LucideIcon;
  /** Client component rendered as the page body. */
  component: ComponentType;
  /** Optional one-liner shown beneath the page title. */
  description?: string;
  adminOnly?: boolean;
}

export interface ModuleDefinition {
  /** URL slug used under /settings/<id>. Kebab-case, e.g. "time-management". */
  id: string;
  label: string;
  icon?: LucideIcon;
  widgets: WidgetDefinition[];
  configPages?: ConfigPageDefinition[];
}

export const MODULES: ModuleDefinition[] = [];
export const WIDGET_REGISTRY = {} as Record<WidgetType, WidgetDefinition>;

export function defineModule(mod: ModuleDefinition): ModuleDefinition {
  MODULES.push(mod);
  for (const widget of mod.widgets) {
    WIDGET_REGISTRY[widget.type] = widget;
  }
  return mod;
}

export function getModule(id: string): ModuleDefinition | undefined {
  return MODULES.find((m) => m.id === id);
}

export function getConfigPage(
  moduleId: string,
  slug: string,
): { module: ModuleDefinition; page: ConfigPageDefinition } | undefined {
  const mod = getModule(moduleId);
  if (!mod) return undefined;
  const page = mod.configPages?.find((p) => p.slug === slug);
  if (!page) return undefined;
  return { module: mod, page };
}
