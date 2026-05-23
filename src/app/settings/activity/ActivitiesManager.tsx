"use client";

import { useState } from "react";
import { ActivitiesTab } from "@/dashboard/widgets/activitySelector/config/ActivitiesTab";
import { TagsTab } from "@/dashboard/widgets/activitySelector/config/TagsTab";

type Tab = "activities" | "tags";

export function ActivitiesManager() {
  const [tab, setTab] = useState<Tab>("activities");

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex border-b border-white/10">
        {(["activities", "tags"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              "px-4 py-2 text-xs font-medium capitalize transition-colors",
              tab === t
                ? "text-white border-b-2 border-emerald-400 -mb-px"
                : "text-white/40 hover:text-white/70",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "activities" ? <ActivitiesTab /> : <TagsTab />}
    </div>
  );
}
