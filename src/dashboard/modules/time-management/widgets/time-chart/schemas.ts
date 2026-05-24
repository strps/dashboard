import { z } from "zod";

export const timeChartConfigSchema = z.object({
  groupBy: z.enum(["activity", "tag"]),
  viewMode: z.enum(["week", "months"]),
  monthsBack: z.number().int().min(3).max(12),
  selectedTagIds: z.array(z.string()),
});

export type TimeChartConfig = z.infer<typeof timeChartConfigSchema>;

export const defaultTimeChartConfig: TimeChartConfig = {
  groupBy: "activity",
  viewMode: "week",
  monthsBack: 6,
  selectedTagIds: [],
};
