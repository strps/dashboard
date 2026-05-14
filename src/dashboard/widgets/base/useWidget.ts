import { useDashboardStore } from "../../store/dashboardStore";

export function useWidget(id: string) {
  const locked = useDashboardStore((s) => s.locked);
  const onRemove = useDashboardStore((s) => s.removeWidget);
  const instance = useDashboardStore((s) => s.instances.find((w) => w.id === id));
  return { locked, onRemove, instance };
}
