import { ActivitiesManager } from "./ActivitiesManager";

export default function ActivitySettingsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <h2 className="text-base font-medium tracking-wide">Activities</h2>
        <p className="mt-1 text-xs text-white/50">
          Manage your activities. These are shared across every activity widget on your dashboard.
        </p>
      </div>
      <ActivitiesManager />
    </div>
  );
}
