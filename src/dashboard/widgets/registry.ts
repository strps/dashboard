import type { ComponentType, ReactNode } from "react";
import type { WidgetType } from "../store/dashboardStore";

export interface WidgetComponentProps {
  id: string;
}

export interface WidgetDefinition {
  label: string;
  defaultSize: { w: number; h: number };
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  component: ComponentType<WidgetComponentProps>;
  configComponent?: ComponentType;
  /**
   * Optional shared provider mounted around the dashboard grid when at least one
   * instance of this widget type is present. Use for per-user state shared
   * across multiple instances (e.g. cheatsheet library).
   */
  provider?: ComponentType<{ children: ReactNode }>;
}

export const WIDGET_REGISTRY = {} as Record<WidgetType, WidgetDefinition>;

export function registerWidget(type: WidgetType, def: WidgetDefinition) {
  WIDGET_REGISTRY[type] = def;
}
