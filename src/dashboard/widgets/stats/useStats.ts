export interface Stat {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
}

// Replace with real data source (API, websocket, etc.)
const MOCK_STATS: Stat[] = [
  { label: "CPU",      value: "34%",    trend: "up"      },
  { label: "Memory",   value: "6.2 GB", trend: "neutral" },
  { label: "Uptime",   value: "14d 3h", trend: "neutral" },
  { label: "Requests", value: "1,284",  trend: "up"      },
];

export function useStats(): Stat[] {
  return MOCK_STATS;
}
