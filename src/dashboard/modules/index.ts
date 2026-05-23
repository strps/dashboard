// Side-effect imports — each module file calls defineModule(), which populates
// MODULES and WIDGET_REGISTRY. The dashboard reads from those exports.
import "./time-management";
import "./notes";
import "./weather";
import "./stats";
import "./cheatsheet";

export {
  MODULES,
  WIDGET_REGISTRY,
  defineModule,
  getModule,
  getConfigPage,
} from "./registry";
export type {
  ConfigPageDefinition,
  ModuleDefinition,
  WidgetComponentProps,
  WidgetConfigDialogProps,
  WidgetDefinition,
} from "./registry";
