import { BaseWidget } from "../base/BaseWidget";
import { useWidget } from "../base/useWidget";
import { registerWidget, type WidgetComponentProps } from "../registry";

export function WeatherWidget({ id }: WidgetComponentProps) {
  const { locked, onRemove } = useWidget(id);

  return (
    <BaseWidget id={id} locked={locked} onRemove={onRemove}>
      <div className="h-full w-full rounded-xl bg-white/5 flex flex-col items-center justify-center gap-2 select-none">
        <span className="text-4xl">⛅</span>
        <span className="text-white/30 text-xs">coming soon</span>
      </div>
    </BaseWidget>
  );
}

registerWidget("weather", {
  label: "Weather",
  defaultSize: { w: 3, h: 3 },
  minW: 2,
  minH: 2,
  component: WeatherWidget,
});
