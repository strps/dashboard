import { useEffect, useState } from "react";
import { useActivityStore } from "./activityStore";

export function useActivitySelector() {
  const activities = useActivityStore((s) => s.activities);
  const activeActivityId = useActivityStore((s) => s.activeActivityId);
  const activeStartedAt = useActivityStore((s) => s.activeStartedAt);
  const setActiveActivity = useActivityStore((s) => s.setActiveActivity);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (activeStartedAt == null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeStartedAt]);

  const active = activities.find((a) => a.id === activeActivityId) ?? null;
  const elapsedMs = activeStartedAt ? now - activeStartedAt : 0;

  return { activities, active, elapsedMs, setActiveActivity };
}

export function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}
