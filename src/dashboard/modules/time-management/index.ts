import { Activity, Calendar, Clock, Tag } from "lucide-react";

import { defineModule } from "../registry";
import { ActivitiesTab } from "./config-pages/ActivitiesTab";
import { TagsTab } from "./config-pages/TagsTab";
import { activitySelectorWidget } from "./widgets/activity-selector/ActivitySelectorWidget";
import { calendarWidget } from "./widgets/calendar/CalendarWidget";
import { clockWidget } from "./widgets/clock/ClockWidget";

defineModule({
  id: "time-management",
  label: "Time management",
  icon: Clock,
  widgets: [clockWidget, activitySelectorWidget, calendarWidget],
  configPages: [
    {
      slug: "activities",
      label: "Activities",
      icon: Activity,
      component: ActivitiesTab,
      description:
        "Manage your activities. These are shared across every activity widget on your dashboard.",
    },
    {
      slug: "tags",
      label: "Tags",
      icon: Tag,
      component: TagsTab,
      description: "Categorize activities. Tags are shared across the workspace.",
    },
  ],
});

export {};
