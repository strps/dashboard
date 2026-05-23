import { z } from "zod";

export const timeChartConfigSchema = z.object({
  groupBy: z.enum(["activity", "tag"]),
  dateRange: z.enum(["7d", "30d", "90d"]),
  selectedTagIds: z.array(z.string()),
});

export type TimeChartConfig = z.infer<typeof timeChartConfigSchema>;

export const defaultTimeChartConfig: TimeChartConfig = {
  groupBy: "activity",
  dateRange: "30d",
  selectedTagIds: [],
};
