import type { ComponentType } from "react";
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
}

export const WIDGET_REGISTRY = {} as Record<WidgetType, WidgetDefinition>;

export function registerWidget(type: WidgetType, def: WidgetDefinition) {
  WIDGET_REGISTRY[type] = def;
}
