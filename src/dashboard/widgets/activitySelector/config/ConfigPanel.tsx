import { ActivitiesTab } from "./ActivitiesTab";
import { PreferencesTab } from "./PreferencesTab";
import { Tabs } from "./Tabs";

export function ActivitySelectorConfig() {
  return (
    <Tabs
      tabs={[
        { id: "activities", label: "Activities", content: <ActivitiesTab /> },
        { id: "preferences", label: "Preferences", content: <PreferencesTab /> },
      ]}
    />
  );
}
